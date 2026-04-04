from collections import defaultdict
from decimal import Decimal

import stripe
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from mentee_college_online_school import models
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from menteecollegewebsite import settings

from .models import *
from .serializers import (
    ApplicationSerializer,
    AssociatesApplicationSerializer,
    CertificateApplicationSerializer,
    CourseDetailSerializer,
    CourseSerializer,
    DiplomaApplicationSerializer,
    StudentSerializer,
    UserSerializer,
    UserSerializerWithToken,
)

# Create your views here.


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims to customize token (You can see values when you fecowhen you decode it
        token["username"] = user.username
        token["message"] = "hello world"

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        refresh = self.get_token(self.user)
        # attributes in django user model
        serializer = UserSerializerWithToken(self.user).data

        for k, v in serializer.items():
            data[k] = v

        return data


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_user(request):
    data = request.data

    try:
        user = User.objects.create(
            first_name=data["name"],
            username=data["username"],
            email=data["email"],
            password=make_password(data["password"]),
        )

        # create Profile instance for new User

        serializer = UserSerializerWithToken(user, many=False)
        return Response(serializer.data)

    except:
        message = {"detail": "User with this email already exists"}
        return Response(message, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def Test(request):
    routes = [{"Works": "True"}]
    return Response(routes)


@api_view(["GET"])
def getCohorts(request):
    from mentee_college_online_school.models import Cohort

    cohorts = Cohort.objects.all().order_by("-academic_year", "cohort_number")
    cohort_data = []
    for cohort in cohorts:
        cohort_data.append(
            {
                "id": str(cohort.id),
                "academic_year": cohort.academic_year,
                "cohort_number": cohort.cohort_number,
                "program_type": cohort.program_type,
                "program_name": cohort.get_program_name(),
            }
        )
    return Response(cohort_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getUserProfile(request):
    User = request.user
    serializer = UserSerializer(User, many=False)
    return Response(serializer.data)


@api_view(["GET"])
def getCourses(request):
    Courses = models.Course.objects.all()
    serializer = CourseSerializer(Courses, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def getCourse(request, pk):
    Course = models.Course.objects.get(id=pk)
    serializer = CourseSerializer(Course, many=False)
    print(Course)
    return Response(serializer.data)


def build_application_email(application, ssn=None):
    """
    Build a comprehensive email body with all application data.
    SSN is included in email but NOT stored in database.
    """
    program_display = {
        'CNA': 'Nurse Aide (CNA)',
        'MA_cert': 'Medical Assistant (Certificate)',
        'MA_assoc': 'Medical Assistant (Associates)',
        'LPN': 'Practical Nursing (LPN)',
    }

    email_lines = [
        "=" * 60,
        "NEW APPLICATION SUBMISSION",
        "=" * 60,
        "",
        "PROGRAM INFORMATION",
        "-" * 40,
        f"Program Type: {application.program_type.title()}",
        f"Program: {program_display.get(application.program_name, application.program_name)}",
        f"Semester/Start Date: {application.semester}",
        "",
        "PERSONAL DATA",
        "-" * 40,
        f"Name: {application.first_name} {application.middle_initial} {application.last_name}".replace("  ", " "),
        f"Address: {application.address}",
        f"Date of Birth: {application.date_of_birth}",
        f"SSN: {ssn if ssn else 'Not provided'}",
        f"Phone: {application.phone_number}",
        f"Email: {application.email}",
        f"Gender: {application.gender}",
        f"Marital Status: {application.marital_status.title()}",
        f"Dependents: {'Yes - ' + str(application.num_dependents) if application.has_dependents else 'No'}",
        "",
        "EMERGENCY CONTACT",
        "-" * 40,
        f"Name: {application.emergency_first_name} {application.emergency_middle_initial} {application.emergency_last_name}".replace("  ", " "),
        f"Phone: {application.emergency_phone}",
        f"Email: {application.emergency_email or 'Not provided'}",
        "",
        "EDUCATIONAL DATA",
        "-" * 40,
        f"High School Graduate: {'Yes - ' + application.high_school_name + ' (' + application.high_school_year + ')' if application.high_school_graduate else 'No'}",
        f"GED/HSE: {'Yes - ' + application.ged_school_name + ' (' + application.ged_year + ')' if application.ged_graduate else 'No'}",
        "",
    ]

    # Colleges Attended
    if application.colleges_attended:
        email_lines.append("Colleges Attended:")
        for college in application.colleges_attended:
            email_lines.append(f"  - {college.get('name', 'N/A')} ({college.get('city_state', 'N/A')})")
            email_lines.append(f"    Date: {college.get('date_attended', 'N/A')}, Graduated: {college.get('graduated', 'N/A')}, Degree: {college.get('degree', 'N/A')}")
        email_lines.append("")

    # LPN/Diploma specific sections
    if application.program_type == 'diploma' or application.program_name == 'LPN':
        email_lines.extend([
            "PREREQUISITE COURSES (LPN Program)",
            "-" * 40,
        ])
        if application.prerequisite_courses:
            for course in application.prerequisite_courses:
                email_lines.append(f"  {course.get('course', 'N/A')}: {course.get('college', 'N/A')} - Grade: {course.get('grade', 'N/A')}")
        else:
            email_lines.append("  No prerequisite courses listed")

        email_lines.extend([
            "",
            f"Entrance Exam: {application.entrance_exam_status or 'Not specified'}",
            f"Exam Date: {application.entrance_exam_date or 'Not specified'}",
            "",
            "CNA REQUIREMENT",
            "-" * 40,
            f"Year Completed: {application.cna_year_completed or 'Not specified'}",
            f"License #: {application.cna_license_number or 'Not specified'}",
            f"Expiration Date: {application.cna_expiration_date or 'Not specified'}",
            "",
        ])

    # Employment History
    email_lines.extend([
        "EMPLOYMENT HISTORY",
        "-" * 40,
    ])
    if application.employment_history:
        for job in application.employment_history:
            email_lines.append(f"  {job.get('employer', 'N/A')} - {job.get('position', 'N/A')}")
            email_lines.append(f"    From: {job.get('from_date', 'N/A')} To: {job.get('to_date', 'N/A')}")
    else:
        email_lines.append("  No employment history listed")

    email_lines.extend([
        "",
        "LEGAL DISCLOSURE",
        "-" * 40,
        f"Prior Conviction: {'Yes' if application.has_conviction else 'No'}",
    ])
    if application.has_conviction and application.conviction_explanation:
        email_lines.append(f"Explanation: {application.conviction_explanation}")

    email_lines.extend([
        "",
        "SIGNATURE",
        "-" * 40,
        f"Signature: {application.signature}",
        f"Date: {application.signature_date}",
        "",
        f"How did you hear about us: {application.how_did_you_hear_about_us or 'Not specified'}",
        "",
        "=" * 60,
        f"Application submitted: {application.created_at}",
        f"Application ID: {application.id}",
        "=" * 60,
    ])

    return "\n".join(email_lines)


@api_view(["POST"])
def application_view(request):
    """
    Unified application view for all programs (Certificate, Associates, Diploma).
    SSN is extracted and included in email but NOT saved to database.
    """
    data = request.data.copy()

    # Extract SSN - this will NOT be saved to database, only emailed
    ssn = data.pop('ssn', None)
    if isinstance(ssn, list):
        ssn = ssn[0] if ssn else None

    # Initialize the serializer with the request data
    serializer = ApplicationSerializer(data=data)

    # Validate the data
    if serializer.is_valid():
        # Save the validated data (SSN is excluded)
        application = serializer.save()

        # Build comprehensive email with ALL data including SSN
        email_body = build_application_email(application, ssn)

        # Prepare email
        program_display = {
            'CNA': 'Nurse Aide',
            'MA_cert': 'Medical Assistant (Certificate)',
            'MA_assoc': 'Medical Assistant (Associates)',
            'LPN': 'Practical Nursing',
        }
        subject = f"New Application: {program_display.get(application.program_name, application.program_name)} - {application.first_name} {application.last_name}"
        from_email = "Admissions@menteecollege.com"
        recipient_list = ["Admissions@menteecollege.com", "andrewbrowne161@gmail.com"]

        try:
            send_mail(
                subject=subject,
                message=email_body,
                from_email=from_email,
                recipient_list=recipient_list,
                fail_silently=False
            )
        except Exception as e:
            # Log the error but don't fail the application submission
            print(f"Email sending failed: {str(e)}")

        return Response(serializer.data, status=201)
    else:
        # If the data is not valid, return the errors
        return Response(serializer.errors, status=400)


endpoint_secret = (
    "whsec_18da12281e2fdc06f86c2640684ddee2afc5001ad78176c5b5fce702d4c152cd"
)


@api_view(["POST"])
@csrf_exempt
def create_payment(request):
    stripe.api_key = settings.STRIPE_SECRET_KEY
    username = request.data.get("username")
    total_cost = request.data.get("totalCost")
    # Extracting student data
    student_data = request.data.get("studentData", {})
    first_name = student_data.get("firstName")
    last_name = student_data.get("lastName")
    student_id = student_data.get("studentId")  # If you need to use it

    if total_cost is None:
        return JsonResponse({"error": "totalCost is required"}, status=400)

    try:
        customer = stripe.Customer.create()
        # Convert total_cost to an integer since Stripe expects the amount to be in cents
        amount = int(total_cost) * 100

        payment_intent = stripe.PaymentIntent.create(
            customer=customer["id"],
            amount=amount,  # amount is already expected to be in cents
            currency="usd",
            payment_method_types=["card", "link", "us_bank_account"],
            metadata={
                "integration_check": "accept_a_payment",
                "user_id": username,
                "total_cost": total_cost,
                "first_name": first_name,
                "last_name": last_name,
                "student_id": student_id,
            },
            setup_future_usage="off_session",
        )

        return JsonResponse({"clientSecret": payment_intent["client_secret"]})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=403)


@api_view(["POST"])
@csrf_exempt
def recordpayment(request):
    if request.method == "POST":
        try:
            event = stripe.Webhook.construct_event(
                payload=request.body,
                sig_header=request.META.get("HTTP_STRIPE_SIGNATURE", ""),
                secret=settings.STRIPE_WEBHOOK_SECRET,
            )
        except ValueError:
            return JsonResponse(
                {"status": "error", "message": "Invalid payload"}, status=400
            )
        except stripe.error.SignatureVerificationError:
            return JsonResponse(
                {"status": "error", "message": "Invalid signature"}, status=400
            )

        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            first_name = payment_intent["metadata"].get("first_name")
            last_name = payment_intent["metadata"].get("last_name")
            user_id = payment_intent["metadata"].get("user_id")
            student_id = payment_intent["metadata"].get("student_id")
            total_cost = payment_intent["metadata"].get("total_cost")

            from decimal import Decimal

            total_cost_decimal = Decimal(total_cost)

            try:
                student = models.Student.objects.get(id=student_id)
                payment_schedule = (
                    models.PaymentSchedule.objects.filter(
                        student=student, amount_due=total_cost_decimal, paid=False
                    )
                    .order_by("due_date")
                    .first()
                )

                if payment_schedule:
                    payment_schedule.paid = True
                    payment_schedule.save()

                subject = f"Payment from {first_name} {last_name}"
                message = (
                    f"Received payment of ${total_cost} from {first_name} {last_name}"
                )
                from_email = "andrewb@mentee-college.com"
                recipient_list = [
                    "andrewb@mentee-college.com",
                    "admissions@menteecollege.com",
                ]
                send_mail(
                    subject, message, from_email, recipient_list, fail_silently=False
                )

                return JsonResponse(
                    {
                        "status": "success",
                        "message": "Payment recorded and PaymentSchedule updated",
                    }
                )

            except models.Student.DoesNotExist:
                return JsonResponse(
                    {"status": "error", "message": "Student not found"}, status=404
                )

        else:
            return JsonResponse(
                {"status": "error", "message": "Unhandled event type"}, status=400
            )
    else:
        return JsonResponse(
            {"status": "error", "message": "Method not allowed"}, status=405
        )


@api_view(["GET"])
def student_detail(request, username):
    # Fetch the student by username
    student = get_object_or_404(models.Student, username=username)

    # Serialize the student data
    serializer = StudentSerializer(student)

    # Start with serialized data
    response_data = serializer.data

    # Directly use model methods to get the data needed for the response
    # This assumes get_payment_details() returns a dictionary that you want to include
    payment_details = student.get_payment_details()

    # If needed, manipulate or add additional data here
    # For example, adding debugging information in development environment
    if settings.DEBUG:
        # Ensure this doesn't override existing keys unless intended
        debug_info = {"debug": "This is debugging information."}
        response_data.update(debug_info)

    # Merge serialized data with payment details
    # This is assuming payment_details is a dictionary you wish to merge
    response_data["payment_details"] = payment_details

    # Return the serialized student data along with any additional data
    return Response(response_data)


@api_view(["POST"])
def send_test_email(request):
    # Hardcoded email details
    subject = "Boom shaka laka"
    message = "This is a test email message."
    from_email = "andrewb@mentee-college.com"  # Sender's email
    recipient_list = ["admissions@menteecollege.com"]  # Recipient's email list

    # Send email
    send_mail(subject, message, from_email, recipient_list, fail_silently=False)

    # Respond back to the POST request
    return JsonResponse({"message": "Test email sent successfully!"}, status=200)


@api_view(["POST"])
def validate_discount_code(request):
    discount_code = request.data.get("discountCode")
    total_cost = Decimal(
        request.data.get("totalCost")
    )  # Convert to Decimal for accurate financial calculations

    try:
        code = models.DiscountCode.objects.get(code=discount_code, is_active=True)
        if code.is_valid():
            new_total = code.apply_discount(total_cost)
            return JsonResponse({"isValid": True, "newTotal": new_total})
        else:
            return JsonResponse(
                {"isValid": False, "message": "Discount code is expired or inactive."}
            )
    except models.DiscountCode.DoesNotExist:
        return JsonResponse({"isValid": False, "message": "Invalid discount code."})


# Course CRUD API Views
@api_view(["GET"])
def course_list(request):
    """
    List all courses or filter by query parameters.
    """
    try:
        courses = models.Course.objects.all()

        # Filter by name if provided
        name = request.query_params.get("name", None)
        if name:
            courses = courses.filter(name__icontains=name)

        # Filter by is_certificate_course if provided
        is_certificate = request.query_params.get("is_certificate", None)
        if is_certificate is not None:
            is_certificate_bool = is_certificate.lower() == "true"
            courses = courses.filter(is_certificate_course=is_certificate_bool)

        serializer = CourseDetailSerializer(courses, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])  # Add appropriate permissions
def course_create(request):
    """
    Create a new course.
    """
    try:
        serializer = CourseDetailSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def course_detail(request, pk):
    """
    Retrieve a course by id.
    """
    try:
        course = get_object_or_404(models.Course, id=pk)
        serializer = CourseDetailSerializer(course)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])  # Add appropriate permissions
def course_update(request, pk):
    """
    Update a course.
    """
    try:
        course = get_object_or_404(models.Course, id=pk)
        serializer = CourseDetailSerializer(course, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])  # Add appropriate permissions
def course_delete(request, pk):
    """
    Delete a course.
    """
    try:
        course = get_object_or_404(models.Course, id=pk)
        course.delete()
        return Response(
            {"message": "Course deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def course_list_by_category(request):
    """
    Return a formatted list of courses, organized by category.
    """
    try:
        # Fetch all courses
        courses = models.Course.objects.all().order_by("name")

        # Create course categories
        course_categories = {
            "nursing": [],
            "medical": [],
            "tech": [],
            "general_education": [],
            "other": [],
        }

        # Map course names to categories
        category_mapping = {
            "Nursing Assistant": "nursing",
            "Nurse Ethics": "nursing",
            "EKG Technician": "tech",
            "Phlebotomy": "medical",
            "Ultrasound Program": "tech",
            "Ultrasound": "tech",
            "MA": "medical",
            "MA(associates)": "medical",
            "Medical Assistant": "medical",
            "Medical Assistant(associates)": "medical",
            "Patient Care Technician": "medical",
            "Algebra": "general_education",
            "Physics": "general_education",
            "Biology": "general_education",
            "English": "general_education",
            "Medical Terminology for Allied Health Sciences": "medical",
        }

        # Category display names
        category_display_names = {
            "nursing": "Nursing Courses",
            "medical": "Medical Courses",
            "tech": "Technical Courses",
            "general_education": "General Education",
            "other": "Other Courses",
        }

        # Sort courses into categories
        for course in courses:
            category = category_mapping.get(course.name, "other")
            serialized_course = CourseSerializer(course).data
            course_categories[category].append(serialized_course)

        # Format the response
        formatted_response = []
        for category, courses in course_categories.items():
            if courses:  # Only include categories that have courses
                formatted_response.append(
                    {
                        "category": category,
                        "display_name": category_display_names[category],
                        "courses": courses,
                    }
                )

        return Response(formatted_response)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def course_stats(request):
    """
    Return statistics about courses.
    """
    try:
        # Get count of all courses
        total_courses = models.Course.objects.count()

        # Get count of certificate courses
        certificate_courses = models.Course.objects.filter(
            is_certificate_course=True
        ).count()

        # Get count by course name
        course_counts = defaultdict(int)
        courses = models.Course.objects.all()
        for course in courses:
            course_counts[course.name] += 1

        # Get average credit hours
        avg_credit_hours = models.Course.objects.all().values_list(
            "credit_hours", flat=True
        )
        avg_credit_hours = (
            sum(avg_credit_hours) / len(avg_credit_hours) if avg_credit_hours else 0
        )

        return Response(
            {
                "total_courses": total_courses,
                "certificate_courses": certificate_courses,
                "non_certificate_courses": total_courses - certificate_courses,
                "course_type_counts": dict(course_counts),
                "average_credit_hours": round(avg_credit_hours, 2),
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
