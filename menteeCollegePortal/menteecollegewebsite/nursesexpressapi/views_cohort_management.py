from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from mentee_college_online_school.models import Cohort, Student
from mentee_college_online_school.serializers_documents import CohortSerializer
from nursesexpressapi.serializers import StudentSerializer
import json


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cohort_students(request, cohort_id):
    """
    Get all students in a specific cohort with their payment details
    """
    try:
        cohort = get_object_or_404(Cohort, id=cohort_id)
        students = Student.objects.filter(cohort=cohort).select_related('user')
        
        # Serialize students with payment details
        students_data = []
        for student in students:
            student_serialized = StudentSerializer(student).data
            
            # Add payment details using the existing method
            try:
                payment_details = student.get_payment_details()
                student_serialized['payment_details'] = payment_details
            except Exception as e:
                print(f"Error getting payment details for student {student.username}: {e}")
                student_serialized['payment_details'] = {}
            
            students_data.append(student_serialized)
        
        return Response(students_data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch cohort students: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cohort_analytics(request, cohort_id):
    """
    Get analytics data for a specific cohort
    """
    try:
        cohort = get_object_or_404(Cohort, id=cohort_id)
        students = Student.objects.filter(cohort=cohort)
        
        # Calculate analytics
        total_students = students.count()
        total_outstanding = 0
        paid_students = 0
        unpaid_students = 0
        payment_plan_students = students.filter(on_payment_plan=True).count()
        
        for student in students:
            try:
                payment_details = student.get_payment_details()
                student_balance = 0
                
                # Calculate total balance for this student
                for program_type in ['certificate_courses', 'diploma_programs', 'associate_programs']:
                    if program_type in payment_details:
                        for program in payment_details[program_type]:
                            balance = (program.get('total_due', 0) or program.get('amount_due', 0)) - \
                                    (program.get('total_paid', 0) or program.get('amount_paid', 0))
                            student_balance += balance
                
                total_outstanding += student_balance
                
                if student_balance > 0:
                    unpaid_students += 1
                else:
                    paid_students += 1
                    
            except Exception as e:
                print(f"Error calculating balance for student {student.username}: {e}")
                unpaid_students += 1  # Assume unpaid if error
        
        analytics_data = {
            'cohort_info': CohortSerializer(cohort).data,
            'total_students': total_students,
            'total_outstanding_balance': round(total_outstanding, 2),
            'paid_students': paid_students,
            'unpaid_students': unpaid_students,
            'payment_plan_students': payment_plan_students,
            'average_balance': round(total_outstanding / total_students, 2) if total_students > 0 else 0,
            'payment_completion_rate': round((paid_students / total_students) * 100, 1) if total_students > 0 else 0,
        }
        
        return Response(analytics_data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch cohort analytics: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cohorts_dashboard_stats(request):
    """
    Get dashboard statistics for all cohorts
    """
    try:
        cohorts = Cohort.objects.all()
        all_students = Student.objects.all()
        
        total_cohorts = cohorts.count()
        total_students = all_students.count()
        active_cohorts = cohorts.filter(is_active=True).count()
        
        # Calculate total outstanding balance across all students
        total_outstanding = 0
        students_with_balances = 0
        
        for student in all_students:
            try:
                payment_details = student.get_payment_details()
                student_balance = 0
                
                for program_type in ['certificate_courses', 'diploma_programs', 'associate_programs']:
                    if program_type in payment_details:
                        for program in payment_details[program_type]:
                            balance = (program.get('total_due', 0) or program.get('amount_due', 0)) - \
                                    (program.get('total_paid', 0) or program.get('amount_paid', 0))
                            student_balance += balance
                
                total_outstanding += student_balance
                if student_balance > 0:
                    students_with_balances += 1
                    
            except Exception as e:
                print(f"Error calculating balance for student {student.username}: {e}")
                continue
        
        # Calculate program type distribution
        program_distribution = {}
        for cohort in cohorts:
            program_type = cohort.program_type
            if program_type in program_distribution:
                program_distribution[program_type] += 1
            else:
                program_distribution[program_type] = 1
        
        stats = {
            'total_cohorts': total_cohorts,
            'total_students': total_students,
            'active_cohorts': active_cohorts,
            'inactive_cohorts': total_cohorts - active_cohorts,
            'average_cohort_size': round(total_students / total_cohorts, 1) if total_cohorts > 0 else 0,
            'total_outstanding_balance': round(total_outstanding, 2),
            'students_with_balances': students_with_balances,
            'students_current': total_students - students_with_balances,
            'program_distribution': program_distribution,
        }
        
        return Response(stats)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch dashboard stats: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cohort_bulk_email(request, cohort_id):
    """
    Send bulk email to all students in a cohort
    """
    try:
        cohort = get_object_or_404(Cohort, id=cohort_id)
        students = Student.objects.filter(cohort=cohort).select_related('user')
        
        subject = request.data.get('subject', '')
        message = request.data.get('message', '')
        
        if not subject or not message:
            return Response(
                {'error': 'Subject and message are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get student email addresses
        recipient_emails = []
        for student in students:
            email = None
            if hasattr(student, 'email') and student.email:
                email = student.email
            elif hasattr(student, 'user') and student.user and student.user.email:
                email = student.user.email
            
            if email:
                recipient_emails.append(email)
        
        if not recipient_emails:
            return Response(
                {'error': 'No student email addresses found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Implement actual email sending functionality
        # This would typically use Django's email functionality or a service like SendGrid
        
        # For now, return success with the email addresses that would be contacted
        return Response({
            'success': True,
            'message': f'Email would be sent to {len(recipient_emails)} students',
            'recipient_count': len(recipient_emails),
            'cohort_name': f"{cohort.academic_year} - Cohort {cohort.cohort_number}",
            # 'recipients': recipient_emails  # Don't return actual emails for privacy
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to send bulk email: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_cohort_details(request, student_id):
    """
    Get detailed student information within cohort context
    """
    try:
        student = get_object_or_404(Student, id=student_id)
        
        # Get student data with payment details
        student_data = StudentSerializer(student).data
        
        # Add payment details
        try:
            payment_details = student.get_payment_details()
            student_data['payment_details'] = payment_details
        except Exception as e:
            print(f"Error getting payment details for student {student.username}: {e}")
            student_data['payment_details'] = {}
        
        # Add cohort information
        if student.cohort:
            student_data['cohort_info'] = CohortSerializer(student.cohort).data
        
        # Add enrollment information
        enrolled_programs = {
            'certificate_programs': [p.name for p in student.enrolled_certificate_programs.all()],
            'diploma_programs': [p.name for p in student.enrolled_diploma_programs.all()],
            'associates_programs': [p.name for p in student.enrolled_associates_programs.all()],
        }
        student_data['enrolled_programs'] = enrolled_programs
        
        return Response(student_data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch student details: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )