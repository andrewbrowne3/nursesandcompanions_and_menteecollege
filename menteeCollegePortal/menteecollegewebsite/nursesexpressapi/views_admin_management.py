from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
from mentee_college_online_school.models import (
    Student, Course, Cohort, CertificateProgram,
    DiplomaProgram, AssociatesProgram, CourseEnrollmentHistory,
    AcademicProgress, Payment, PaymentSchedule
)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def assign_courses_to_student(request, username):
    """
    Assign courses to a student via course_enrollments ManyToMany field.
    Admin only.

    Expected payload:
    {
        "course_ids": ["uuid1", "uuid2", ...]
    }

    Returns updated list of assigned courses.
    """
    try:
        # Get student by username (with fallback)
        try:
            student = get_object_or_404(Student, username=username)
        except:
            student = get_object_or_404(Student, user__username=username)

        # Get course IDs from request
        course_ids = request.data.get('course_ids', [])

        # Validate courses exist
        courses = Course.objects.filter(id__in=course_ids)

        if len(courses) != len(course_ids):
            return Response(
                {'error': 'One or more invalid course IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Clear existing enrollments and set new ones
        student.course_enrollments.set(courses)

        # Return updated course list
        assigned_courses = [
            {
                'id': str(course.id),
                'name': course.name,
                'credit_hours': course.credit_hours,
                'is_certificate_course': course.is_certificate_course
            }
            for course in student.course_enrollments.all()
        ]

        return Response({
            'success': True,
            'assigned_courses': assigned_courses,
            'total_credits': sum(c['credit_hours'] for c in assigned_courses)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_student_cohort(request, username):
    """
    Update a student's cohort assignment.
    Admin only.

    Expected payload:
    {
        "cohort_id": "uuid" or null
    }
    """
    try:
        # Get student by username
        try:
            student = get_object_or_404(Student, username=username)
        except:
            student = get_object_or_404(Student, user__username=username)

        cohort_id = request.data.get('cohort_id')

        if cohort_id:
            # Validate cohort exists
            cohort = get_object_or_404(Cohort, id=cohort_id)
            student.cohort = cohort
        else:
            # Remove cohort assignment
            student.cohort = None

        student.save()

        cohort_data = None
        if student.cohort:
            cohort_data = {
                'id': str(student.cohort.id),
                'academic_year': student.cohort.academic_year,
                'cohort_number': student.cohort.cohort_number,
                'program_type': student.cohort.program_type,
                'program_name': student.cohort.get_program_name()
            }

        return Response({
            'success': True,
            'cohort': cohort_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def manage_student_programs(request, username):
    """
    Manage student program enrollments across all program types.
    Admin only.

    Expected payload:
    {
        "certificate_programs": ["uuid1", "uuid2"],
        "diploma_programs": ["uuid1"],
        "associates_programs": []
    }
    """
    try:
        # Get student by username
        try:
            student = get_object_or_404(Student, username=username)
        except:
            student = get_object_or_404(Student, user__username=username)

        # Get program IDs from request
        cert_ids = request.data.get('certificate_programs', [])
        diploma_ids = request.data.get('diploma_programs', [])
        assoc_ids = request.data.get('associates_programs', [])

        # Update certificate programs
        if cert_ids:
            cert_programs = CertificateProgram.objects.filter(id__in=cert_ids)
            student.enrolled_certificate_programs.set(cert_programs)
        else:
            student.enrolled_certificate_programs.clear()

        # Update diploma programs
        if diploma_ids:
            diploma_programs = DiplomaProgram.objects.filter(id__in=diploma_ids)
            student.enrolled_diploma_programs.set(diploma_programs)
        else:
            student.enrolled_diploma_programs.clear()

        # Update associates programs
        if assoc_ids:
            assoc_programs = AssociatesProgram.objects.filter(id__in=assoc_ids)
            student.enrolled_associates_programs.set(assoc_programs)
        else:
            student.enrolled_associates_programs.clear()

        # Return updated program enrollments
        return Response({
            'success': True,
            'certificate_programs': [
                {'id': str(p.id), 'name': p.name}
                for p in student.enrolled_certificate_programs.all()
            ],
            'diploma_programs': [
                {'id': str(p.id), 'name': p.name}
                for p in student.enrolled_diploma_programs.all()
            ],
            'associates_programs': [
                {'id': str(p.id), 'name': p.name}
                for p in student.enrolled_associates_programs.all()
            ]
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_admin_resources(request):
    """
    Get all available courses, cohorts, and programs for admin dropdowns.
    Admin only.
    """
    try:
        # Get all courses
        courses = Course.objects.all().order_by('name')
        courses_data = [
            {
                'id': str(course.id),
                'name': course.name,
                'credit_hours': course.credit_hours,
                'is_certificate_course': course.is_certificate_course
            }
            for course in courses
        ]

        # Get all cohorts
        cohorts = Cohort.objects.all().order_by('-academic_year', 'cohort_number')
        cohorts_data = [
            {
                'id': str(cohort.id),
                'academic_year': cohort.academic_year,
                'cohort_number': cohort.cohort_number,
                'program_type': cohort.program_type,
                'program_name': cohort.get_program_name(),
                'is_active': cohort.is_active
            }
            for cohort in cohorts
        ]

        # Get all programs
        cert_programs = CertificateProgram.objects.all().order_by('name')
        diploma_programs = DiplomaProgram.objects.all().order_by('name')
        assoc_programs = AssociatesProgram.objects.all().order_by('name')

        programs_data = {
            'certificate_programs': [
                {'id': str(p.id), 'name': p.name}
                for p in cert_programs
            ],
            'diploma_programs': [
                {'id': str(p.id), 'name': p.name}
                for p in diploma_programs
            ],
            'associates_programs': [
                {'id': str(p.id), 'name': p.name}
                for p in assoc_programs
            ]
        }

        return Response({
            'courses': courses_data,
            'cohorts': cohorts_data,
            'programs': programs_data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_student_grades(request, username):
    """
    Get all grade records for a student.
    Admin only.
    """
    try:
        # Get student by username
        try:
            student = get_object_or_404(Student, username=username)
        except:
            student = get_object_or_404(Student, user__username=username)

        # Get all enrollment history
        enrollments = CourseEnrollmentHistory.objects.filter(
            student=student
        ).select_related('course').order_by('-year', '-semester', 'course__name')

        enrollment_data = [
            {
                'id': str(enrollment.id),
                'course_id': str(enrollment.course.id),
                'course_name': enrollment.course.name,
                'credit_hours': enrollment.course.credit_hours,
                'semester': enrollment.semester,
                'year': enrollment.year,
                'grade': enrollment.grade,
                'grade_points': float(enrollment.grade_points) if enrollment.grade_points else None,
                'completed': enrollment.completed,
                'grade_released': enrollment.grade_released,
                'survey_completed': enrollment.survey_completed,
                'enrollment_date': enrollment.enrollment_date.isoformat() if enrollment.enrollment_date else None,
                'completion_date': enrollment.completion_date.isoformat() if enrollment.completion_date else None,
            }
            for enrollment in enrollments
        ]

        # Get academic progress
        academic_progress = None
        try:
            progress = AcademicProgress.objects.get(student=student)
            academic_progress = {
                'gpa': float(progress.cumulative_gpa),
                'credits_earned': progress.total_credits_earned,
                'credits_attempted': progress.total_credits_attempted,
                'academic_standing': progress.get_academic_standing_display()
            }
        except AcademicProgress.DoesNotExist:
            pass

        return Response({
            'enrollments': enrollment_data,
            'academic_progress': academic_progress
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST', 'PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_student_grade(request, username):
    """
    Create or update a grade record for a student.
    Admin only.

    Expected payload:
    {
        "enrollment_id": "uuid" (optional, for updating existing),
        "course_id": "uuid" (required for new enrollment),
        "semester": "Fall/Spring/Summer",
        "year": 2025,
        "grade": "A",
        "grade_released": true/false
    }
    """
    try:
        # Get student by username
        try:
            student = get_object_or_404(Student, username=username)
        except:
            student = get_object_or_404(Student, user__username=username)

        enrollment_id = request.data.get('enrollment_id')
        course_id = request.data.get('course_id')
        semester = request.data.get('semester')
        year = request.data.get('year')
        grade = request.data.get('grade')
        grade_released = request.data.get('grade_released', True)

        # Validate grade
        valid_grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'W', 'IP', 'I']
        if grade and grade not in valid_grades:
            return Response(
                {'error': f'Invalid grade. Must be one of: {", ".join(valid_grades)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        enrollment = None

        if enrollment_id:
            # Update existing enrollment
            enrollment = get_object_or_404(
                CourseEnrollmentHistory,
                id=enrollment_id,
                student=student
            )

            if grade:
                enrollment.grade = grade
            if semester:
                enrollment.semester = semester
            if year:
                enrollment.year = year
            enrollment.grade_released = grade_released

            # Mark as completed if final grade is assigned (not IP or I)
            if grade and grade not in ['IP', 'I']:
                enrollment.completed = True

            enrollment.save()  # save() method auto-calculates grade_points

        else:
            # Create new enrollment record
            if not course_id or not semester or not year or not grade:
                return Response(
                    {'error': 'course_id, semester, year, and grade are required for new enrollment'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            course = get_object_or_404(Course, id=course_id)

            enrollment = CourseEnrollmentHistory.objects.create(
                student=student,
                course=course,
                semester=semester,
                year=year,
                grade=grade,
                grade_released=grade_released,
                completed=grade not in ['IP', 'I']
            )

        # Recalculate GPA
        academic_progress, created = AcademicProgress.objects.get_or_create(student=student)
        academic_progress.calculate_gpa()

        return Response({
            'success': True,
            'enrollment': {
                'id': str(enrollment.id),
                'course_name': enrollment.course.name,
                'semester': enrollment.semester,
                'year': enrollment.year,
                'grade': enrollment.grade,
                'grade_points': float(enrollment.grade_points) if enrollment.grade_points else None,
                'grade_released': enrollment.grade_released,
                'completed': enrollment.completed,
            },
            'gpa': float(academic_progress.cumulative_gpa) if academic_progress else None
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def create_student(request):
    """
    Create a new student in the system.
    Admin only.

    Expected payload:
    {
        "username": "student_username",
        "email": "student@email.com",
        "first_name": "First",
        "last_name": "Last",
        "DOB": "YYYY-MM-DD",
        "password": "student_password",
        "phone_number": "123-456-7890",
        "cohort_id": "uuid" (optional)
    }
    """
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        dob = request.data.get('DOB')
        password = request.data.get('password')
        phone_number = request.data.get('phone_number')
        cohort_id = request.data.get('cohort_id')

        # Validate required fields
        if not all([username, email, first_name, last_name, dob, password]):
            return Response(
                {'error': 'username, email, first_name, last_name, DOB, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create User account with provided password
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password
        )

        # Get cohort if provided
        cohort = None
        if cohort_id:
            cohort = get_object_or_404(Cohort, id=cohort_id)

        # Create Student record
        student = Student.objects.create(
            user=user,
            username=username,
            first_name=first_name,
            last_name=last_name,
            DOB=dob,
            phone_number=phone_number or '',
            cohort=cohort
        )

        # Create AcademicProgress record
        AcademicProgress.objects.create(student=student)

        # Return student data
        cohort_data = None
        if student.cohort:
            cohort_data = {
                'id': str(student.cohort.id),
                'academic_year': student.cohort.academic_year,
                'cohort_number': student.cohort.cohort_number,
                'program_type': student.cohort.program_type,
                'program_name': student.cohort.get_program_name()
            }

        return Response({
            'success': True,
            'student': {
                'username': student.username,
                'email': user.email,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'DOB': student.DOB,
                'phone_number': student.phone_number,
                'cohort': cohort_data
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def record_payment(request, username):
    """
    Record a payment for a student.
    Admin only.

    Expected payload:
    {
        "amount_paid": 500.00,
        "program_type": "certificate/diploma/associates",
        "program_id": "uuid",
        "payment_method": "Credit Card/Check/Cash" (optional)
    }
    """
    try:
        # Get student by username
        try:
            student = get_object_or_404(Student, username=username)
        except:
            student = get_object_or_404(Student, user__username=username)

        amount_paid = request.data.get('amount_paid')
        program_type = request.data.get('program_type')
        program_id = request.data.get('program_id')
        payment_method = request.data.get('payment_method', 'Credit Card')

        # Validate required fields
        if not all([amount_paid, program_type, program_id]):
            return Response(
                {'error': 'amount_paid, program_type, and program_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Convert to Decimal
        try:
            amount_paid = Decimal(str(amount_paid))
        except:
            return Response(
                {'error': 'Invalid amount_paid value'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get program based on type
        program = None
        if program_type == 'certificate':
            program = get_object_or_404(CertificateProgram, id=program_id)
        elif program_type == 'diploma':
            program = get_object_or_404(DiplomaProgram, id=program_id)
        elif program_type == 'associates':
            program = get_object_or_404(AssociatesProgram, id=program_id)
        else:
            return Response(
                {'error': 'Invalid program_type. Must be certificate, diploma, or associates'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find or create payment schedule for this student/program
        payment_schedule = PaymentSchedule.objects.filter(
            student=student,
            **{f'{program_type}_program': program}
        ).first()

        if not payment_schedule:
            # Create new payment schedule
            payment_schedule = PaymentSchedule.objects.create(
                student=student,
                amount_due=program.total_cost,
                due_date=timezone.now().date(),
                paid=False
            )
            setattr(payment_schedule, f'{program_type}_program', program)
            payment_schedule.save()

        # Create payment record
        payment = Payment.objects.create(
            student=student,
            payment_schedule=payment_schedule,
            amount_paid=amount_paid,
            payment_date=timezone.now(),
            payment_method=payment_method,
            status='completed'
        )

        # Calculate total paid for this schedule
        from django.db.models import Sum
        total_paid = Payment.objects.filter(
            payment_schedule=payment_schedule
        ).aggregate(Sum('amount_paid'))['amount_paid__sum'] or Decimal('0')

        # Update payment schedule status
        if total_paid >= payment_schedule.amount_due:
            payment_schedule.paid = True
            payment_schedule.save()

        remaining_balance = payment_schedule.amount_due - total_paid

        return Response({
            'success': True,
            'payment': {
                'id': str(payment.id),
                'amount_paid': float(amount_paid),
                'payment_date': payment.payment_date.isoformat(),
                'payment_method': payment_method,
                'status': payment.status
            },
            'payment_schedule': {
                'total_due': float(payment_schedule.amount_due),
                'total_paid': float(total_paid),
                'remaining_balance': float(remaining_balance),
                'fully_paid': payment_schedule.paid
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_student_contact(request, username):
    """
    Update student contact information (email and phone).
    Admin only.

    Expected payload:
    {
        "email": "newemail@example.com" (optional),
        "phone_number": "123-456-7890" (optional)
    }
    """
    try:
        # Get student by username
        try:
            student = get_object_or_404(Student, username=username)
        except:
            student = get_object_or_404(Student, user__username=username)

        email = request.data.get('email')
        phone_number = request.data.get('phone_number')

        # Update email in User model
        if email:
            # Check if email already exists for another user
            if User.objects.filter(email=email).exclude(id=student.user.id).exists():
                return Response(
                    {'error': 'Email already in use by another user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            student.user.email = email
            student.user.save()

        # Update phone number in Student model
        if phone_number is not None:
            student.phone_number = phone_number
            student.save()

        return Response({
            'success': True,
            'contact_info': {
                'email': student.user.email,
                'phone_number': student.phone_number
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def create_payment_schedule(request, username):
    """
    Create a payment schedule for a student.
    Admin only.

    Expected payload:
    {
        "program_type": "certificate/diploma/associates",
        "program_id": "uuid",
        "amount_due": 2500.00 (optional, auto-calculated if not provided),
        "due_date": "2026-01-15",
        "auto_calculate": true/false,
        "description": "First installment" (optional)
    }
    """
    try:
        # Get student by username
        try:
            student = get_object_or_404(Student, username=username)
        except:
            student = get_object_or_404(Student, user__username=username)

        program_type = request.data.get('program_type')
        program_id = request.data.get('program_id')
        amount_due = request.data.get('amount_due')
        due_date = request.data.get('due_date')
        auto_calculate = request.data.get('auto_calculate', False)
        description = request.data.get('description', '')

        # Validate required fields
        if not all([program_type, program_id, due_date]):
            return Response(
                {'error': 'program_type, program_id, and due_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get program based on type
        program = None
        if program_type == 'certificate':
            program = get_object_or_404(CertificateProgram, id=program_id)
        elif program_type == 'diploma':
            program = get_object_or_404(DiplomaProgram, id=program_id)
        elif program_type == 'associates':
            program = get_object_or_404(AssociatesProgram, id=program_id)
        else:
            return Response(
                {'error': 'Invalid program_type. Must be certificate, diploma, or associates'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Auto-calculate amount if requested
        if auto_calculate or amount_due is None:
            # Calculate total cost based on program type
            if program_type == 'certificate':
                # Sum tuition prices of all courses in the program
                total_cost = sum(
                    course.tuition_price or 0 
                    for course in program.courses.all()
                )
            elif program_type in ['diploma', 'associates']:
                # Get student's enrolled courses for this program
                enrolled_courses = student.course_enrollments.filter(
                    **{f'{program_type}_programs': program}
                )
                
                if enrolled_courses.exists():
                    # Calculate: credit_hours * tuition_price_per_hour
                    total_cost = sum(
                        course.credit_hours for course in enrolled_courses
                    ) * program.tuition_price_per_hour
                else:
                    # Use total credit hours from program courses
                    total_credit_hours = sum(
                        course.credit_hours for course in program.courses.all()
                    )
                    total_cost = total_credit_hours * program.tuition_price_per_hour
            
            amount_due = total_cost

        # Convert to Decimal
        try:
            amount_due = Decimal(str(amount_due))
        except:
            return Response(
                {'error': 'Invalid amount_due value'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create payment schedule
        payment_schedule = PaymentSchedule.objects.create(
            student=student,
            amount_due=amount_due,
            due_date=due_date,
            paid=False
        )
        setattr(payment_schedule, f'{program_type}_program', program)
        payment_schedule.save()

        # Format the due_date properly
        due_date_str = due_date
        if hasattr(payment_schedule.due_date, 'isoformat'):
            due_date_str = payment_schedule.due_date.isoformat()

        return Response({
            'success': True,
            'payment_schedule': {
                'id': str(payment_schedule.id),
                'program_name': program.name,
                'program_type': program_type,
                'amount_due': float(amount_due),
                'due_date': due_date_str,
                'paid': payment_schedule.paid,
                'description': description
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def list_payment_schedules(request, username):
    """
    List all payment schedules for a student.
    Admin only.
    """
    try:
        # Get student by username
        try:
            student = get_object_or_404(Student, username=username)
        except:
            student = get_object_or_404(Student, user__username=username)

        # Get all payment schedules
        schedules = PaymentSchedule.objects.filter(student=student).order_by('due_date')

        from django.db.models import Sum
        schedules_data = []
        
        for schedule in schedules:
            # Calculate total paid for this schedule
            total_paid = Payment.objects.filter(
                payment_schedule=schedule
            ).aggregate(Sum('amount_paid'))['amount_paid__sum'] or Decimal('0')

            # Determine program
            program = schedule.diploma_program or schedule.associates_program or schedule.certificate_program
            program_type = 'diploma' if schedule.diploma_program else (
                'associates' if schedule.associates_program else 'certificate'
            )

            schedules_data.append({
                'id': str(schedule.id),
                'program_name': program.name if program else 'N/A',
                'program_type': program_type,
                'program_id': str(program.id) if program else None,
                'amount_due': float(schedule.amount_due),
                'total_paid': float(total_paid),
                'remaining_balance': float(schedule.amount_due - total_paid),
                'due_date': schedule.due_date.isoformat(),
                'paid': schedule.paid,
                'is_overdue': schedule.due_date < timezone.now().date() and not schedule.paid
            })

        return Response({
            'payment_schedules': schedules_data,
            'total_schedules': len(schedules_data),
            'total_due': sum(s['amount_due'] for s in schedules_data),
            'total_paid': sum(s['total_paid'] for s in schedules_data),
            'total_remaining': sum(s['remaining_balance'] for s in schedules_data)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def delete_payment_schedule(request, username, schedule_id):
    """
    Delete a payment schedule.
    Admin only.
    """
    try:
        # Get student by username
        try:
            student = get_object_or_404(Student, username=username)
        except:
            student = get_object_or_404(Student, user__username=username)

        # Get payment schedule
        schedule = get_object_or_404(
            PaymentSchedule,
            id=schedule_id,
            student=student
        )

        # Check if there are any payments against this schedule
        payment_count = Payment.objects.filter(payment_schedule=schedule).count()
        
        if payment_count > 0:
            return Response(
                {'error': f'Cannot delete schedule with {payment_count} payment(s). Delete payments first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        schedule.delete()

        return Response({
            'success': True,
            'message': 'Payment schedule deleted successfully'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
