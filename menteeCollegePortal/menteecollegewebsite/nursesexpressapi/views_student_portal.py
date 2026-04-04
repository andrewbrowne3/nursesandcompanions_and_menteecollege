from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from mentee_college_online_school.models import (
    Student, Course, CourseEnrollmentHistory, AcademicProgress,
    PaymentSchedule, StudentDocument
)


def getCurrentSemester():
    """Determine current semester based on month"""
    current_month = timezone.now().month
    if current_month >= 1 and current_month <= 5:
        return 'Spring'
    elif current_month >= 6 and current_month <= 8:
        return 'Summer'
    else:
        return 'Fall'


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_dashboard_data(request):
    """
    Get comprehensive student dashboard data including academic progress,
    financial summary, available courses with prerequisite checking, and deadlines
    """
    try:
        try:
            student = get_object_or_404(Student, user=request.user)
        except:
            student = get_object_or_404(Student, username=request.user.username)

        # Get or create academic progress
        academic_progress, created = AcademicProgress.objects.get_or_create(student=student)
        if created or request.GET.get('recalculate') == 'true':
            academic_progress.calculate_gpa()

        # Get current semester courses (in progress)
        current_courses = CourseEnrollmentHistory.objects.filter(
            student=student,
            completed=False,
            grade='IP'
        ).select_related('course')

        current_courses_data = [
            {
                'id': str(enrollment.course.id),
                'name': enrollment.course.name,
                'credit_hours': enrollment.course.credit_hours,
                'semester': enrollment.semester,
                'year': enrollment.year,
                'grade': enrollment.grade,
            }
            for enrollment in current_courses
        ]

        # If no CourseEnrollmentHistory records, fall back to course_enrollments ManyToMany
        if not current_courses_data:
            current_semester = getCurrentSemester()
            current_year = timezone.now().year
            current_courses_data = [
                {
                    'id': str(course.id),
                    'name': course.name,
                    'credit_hours': course.credit_hours,
                    'semester': current_semester,
                    'year': current_year,
                    'grade': 'IP',
                }
                for course in student.course_enrollments.all()
            ]

        # Get completed courses
        completed_courses = CourseEnrollmentHistory.objects.filter(
            student=student,
            completed=True
        ).select_related('course')

        completed_courses_data = [
            {
                'id': str(enrollment.course.id),
                'enrollment_id': str(enrollment.id),
                'name': enrollment.course.name,
                'credit_hours': enrollment.course.credit_hours,
                'semester': enrollment.semester,
                'year': enrollment.year,
                'grade': enrollment.grade if enrollment.grade_released else 'LOCKED',
                'grade_points': float(enrollment.grade_points) if enrollment.grade_points and enrollment.grade_released else None,
                'grade_released': enrollment.grade_released,
                'survey_completed': enrollment.survey_completed,
            }
            for enrollment in completed_courses
        ]

        # Get available courses based on completed prerequisites
        available_courses = get_available_courses_with_prereqs(student)

        # Academic progress data
        academic_data = {
            'gpa': float(academic_progress.cumulative_gpa),
            'credits_earned': academic_progress.total_credits_earned,
            'credits_attempted': academic_progress.total_credits_attempted,
            'academic_standing': academic_progress.get_academic_standing_display(),
            'current_courses': current_courses_data,
            'completed_courses': completed_courses_data,
            'available_courses': available_courses,
        }

        # Financial summary
        financial_summary = student.get_payment_details()

        # Get upcoming payment deadlines
        today = timezone.now().date()
        upcoming_payments = PaymentSchedule.objects.filter(
            student=student,
            paid=False,
            due_date__gte=today
        ).order_by('due_date')[:5]

        payment_deadlines = [
            {
                'id': str(schedule.id),
                'amount_due': float(schedule.amount_due),
                'due_date': schedule.due_date.strftime('%Y-%m-%d'),
                'days_until_due': (schedule.due_date - today).days,
                'program': str(schedule.diploma_program or schedule.associates_program or schedule.certificate_program)
            }
            for schedule in upcoming_payments
        ]

        # Get pending mandatory documents
        pending_documents = StudentDocument.objects.filter(
            students=student,
            is_mandatory=True
        ).exclude(
            acknowledgments__student=student
        ).values('id', 'title', 'description', 'category__name')

        # Compile alerts and deadlines
        alerts = []

        # Payment alerts
        for payment in payment_deadlines:
            if payment['days_until_due'] <= 5:
                alerts.append({
                    'type': 'payment',
                    'priority': 'high' if payment['days_until_due'] <= 2 else 'medium',
                    'message': f"Payment of ${payment['amount_due']} due in {payment['days_until_due']} days",
                    'due_date': payment['due_date']
                })

        # Document alerts
        if pending_documents:
            alerts.append({
                'type': 'document',
                'priority': 'medium',
                'message': f"{len(pending_documents)} mandatory document(s) require acknowledgment",
                'count': len(pending_documents)
            })

        # Academic standing alerts
        if academic_progress.academic_standing != 'good_standing':
            alerts.append({
                'type': 'academic',
                'priority': 'high',
                'message': f"Academic Standing: {academic_progress.get_academic_standing_display()}",
            })

        # Survey alerts for locked grades
        locked_grades_count = completed_courses.filter(grade_released=False).count()
        if locked_grades_count > 0:
            alerts.append({
                'type': 'survey',
                'priority': 'high',
                'message': f"Complete end-of-semester survey to view {locked_grades_count} final grade(s)",
                'count': locked_grades_count
            })

        return Response({
            'student': {
                'id': str(student.id),
                'first_name': student.first_name,
                'last_name': student.last_name,
                'username': student.username,
            },
            'academic_progress': academic_data,
            'financial_summary': financial_summary,
            'payment_deadlines': payment_deadlines,
            'pending_documents': list(pending_documents),
            'alerts': alerts,
        }, status=status.HTTP_200_OK)

    except Student.DoesNotExist:
        return Response(
            {'error': 'Student profile not found for this user'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def get_available_courses_with_prereqs(student):
    """
    Get courses available to student based on completed prerequisites
    """
    # Get all completed course IDs
    completed_course_ids = set(
        CourseEnrollmentHistory.objects.filter(
            student=student,
            completed=True,
            grade__in=['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D']  # Passing grades
        ).values_list('course_id', flat=True)
    )

    # Get all courses currently enrolled in
    enrolled_course_ids = set(
        student.course_enrollments.values_list('id', flat=True)
    )

    # Get all courses from student's programs
    all_program_courses = set()
    for program in student.enrolled_certificate_programs.all():
        all_program_courses.update(program.courses.values_list('id', flat=True))
    for program in student.enrolled_diploma_programs.all():
        all_program_courses.update(program.courses.values_list('id', flat=True))
    for program in student.enrolled_associates_programs.all():
        all_program_courses.update(program.courses.values_list('id', flat=True))

    available_courses = []

    for course_id in all_program_courses:
        # Skip if already completed or currently enrolled
        if course_id in completed_course_ids or course_id in enrolled_course_ids:
            continue

        course = Course.objects.get(id=course_id)

        # Check if all prerequisites are met
        prerequisites = course.prerequisites.all()
        prerequisites_met = all(
            prereq.id in completed_course_ids for prereq in prerequisites
        )

        if prerequisites_met:
            available_courses.append({
                'id': str(course.id),
                'name': course.name,
                'credit_hours': course.credit_hours,
                'prerequisites': [
                    {'id': str(p.id), 'name': p.name} for p in prerequisites
                ],
                'can_enroll': True
            })
        else:
            # Include courses with unmet prerequisites for visibility
            missing_prereqs = [
                {'id': str(p.id), 'name': p.name}
                for p in prerequisites
                if p.id not in completed_course_ids
            ]
            available_courses.append({
                'id': str(course.id),
                'name': course.name,
                'credit_hours': course.credit_hours,
                'prerequisites': [
                    {'id': str(p.id), 'name': p.name} for p in prerequisites
                ],
                'missing_prerequisites': missing_prereqs,
                'can_enroll': False
            })

    return available_courses


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_academic_summary(request):
    """Get detailed academic summary for a student"""
    try:
        try:
            student = get_object_or_404(Student, user=request.user)
        except:
            student = get_object_or_404(Student, username=request.user.username)
        academic_progress = get_object_or_404(AcademicProgress, student=student)

        # Recalculate GPA if requested
        if request.GET.get('recalculate') == 'true':
            academic_progress.calculate_gpa()

        enrollment_history = CourseEnrollmentHistory.objects.filter(
            student=student
        ).select_related('course').order_by('-year', '-semester')

        history_data = [
            {
                'course_name': enrollment.course.name,
                'semester': enrollment.semester,
                'year': enrollment.year,
                'grade': enrollment.grade,
                'grade_points': float(enrollment.grade_points) if enrollment.grade_points else None,
                'credit_hours': enrollment.course.credit_hours,
                'completed': enrollment.completed,
            }
            for enrollment in enrollment_history
        ]

        return Response({
            'student': {
                'id': str(student.id),
                'name': f"{student.first_name} {student.last_name}",
            },
            'gpa': float(academic_progress.cumulative_gpa),
            'credits_earned': academic_progress.total_credits_earned,
            'credits_attempted': academic_progress.total_credits_attempted,
            'academic_standing': academic_progress.get_academic_standing_display(),
            'enrollment_history': history_data,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_course_survey(request):
    """
    Submit end-of-semester course survey and unlock grade
    """
    try:
        try:
            student = get_object_or_404(Student, user=request.user)
        except:
            student = get_object_or_404(Student, username=request.user.username)

        enrollment_id = request.data.get('enrollment_id')
        survey_responses = request.data.get('responses', {})

        if not enrollment_id:
            return Response(
                {'error': 'enrollment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the enrollment record
        enrollment = get_object_or_404(
            CourseEnrollmentHistory,
            id=enrollment_id,
            student=student
        )

        # Validate that survey hasn't been completed already
        if enrollment.survey_completed:
            return Response(
                {'error': 'Survey already completed for this course'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark survey as completed and release grade
        enrollment.survey_completed = True
        enrollment.grade_released = True
        enrollment.save()

        # TODO: Store survey responses in SurveyResponse model if needed
        # For MVP, we're just unlocking the grade

        return Response({
            'message': 'Survey submitted successfully',
            'grade_released': True,
            'grade': enrollment.grade,
            'grade_points': float(enrollment.grade_points) if enrollment.grade_points else None,
        }, status=status.HTTP_200_OK)

    except CourseEnrollmentHistory.DoesNotExist:
        return Response(
            {'error': 'Enrollment record not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
