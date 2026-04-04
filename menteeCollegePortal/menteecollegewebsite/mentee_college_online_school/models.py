import datetime
import uuid

from django.conf import settings
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.timezone import localtime

# Choices
courses = (
    ("Nursing Assistant", "Nursing Assistant"),
    ("EKG Technician", "EKG Technician"),
    ("Phlebotomy", "Phlebotomy"),
    ("Ultrasound Program", "Ultrasound Program"),
    ("MA", "Medical Assistant"),
    ("MA(associates)", "Medical Assistant(associates)"),
    ("Patient Care Technician", "Patient Care Technician"),
    ("Algebra", "Algebra"),
    ("Ultrasound", "Ultrasound"),
    ("Nurse Ethics", "Nurse Ethics"),
    ("Physics", "Physics"),
    ("Biology", "Biology"),
    ("English", "English"),
    (
        "Medical Terminology for Allied Health Sciences",
        "Medical Terminology for Allied Health Sciences.",
    ),
    ("Pharmacology", "Pharmacology"),
    ("Nursing Fundamentals", "Nursing Fundamentals"),
    ("Nutrition", "Nutrition"),
)


diplomaprograms = (
    ("Ultrasound Program", "Ultrasound Program"),
    ("LPN", "LPN"),
    ("DMS", "DMS"),
)

associateprograms = (
    ("MA(associates)", "Medical Assistant(associates)"),
    ("DMS", "DMS"),
)

certificateprograms = (
    ("CNA", "CNA"),
    ("EKG", "EKG"),
    ("PCT", "Patient Care Technician"),
    ("MA", "Medical Assistant(Certificate)"),
    ("Phlebotomy", "Phlebotomy"),
)


method_of_discovery = (
    ("Search engine (Google, Yahoo, etc.)", "Search engine (Google, Yahoo, etc.)"),
    ("Recommended by a friend or colleague", "Recommended by a friend or colleague"),
    ("Social media", "Social media"),
    ("Blog or publication", "Blog or publication"),
    ("Other", "Other"),
)

Schedule = (
    ("Day classes", "Day classes"),
    ("Night classes", "Night classes"),
    ("Online classes", "Online classes"),
)
Semester = (("FALL", "FALL"), ("SPRING", "SPRING"), ("SUMMER", "SUMMER"))


# Models
class DegreeApplication(models.Model):
    application_type = models.CharField(max_length=200, blank=True, null=True)
    first_name = models.CharField(max_length=200)
    last_name = models.CharField(max_length=200)
    email = models.EmailField(max_length=200)
    phone_number = models.CharField(blank="true", max_length=14)
    DOB = models.DateField()
    home_address = models.CharField(max_length=200)
    city = models.CharField(max_length=200)
    degrees_held = models.TextField()
    how_did_you_hear_about_us = models.CharField(
        max_length=200, choices=method_of_discovery
    )
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    GENDER_CHOICES = (
        ("M", "Male"),
        ("F", "Female"),
    )
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)

    medical_background = models.TextField(blank=True)
    interest = models.TextField()
    disability_or_ailment = models.TextField(blank=True)
    signature = models.CharField(max_length=200)

    class Meta:
        abstract = True

    def __str__(self):
        return self.first_name + " " + self.last_name


class Course(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    name = models.CharField(max_length=200, choices=courses)
    CRN = models.TextField()
    credit_hours = models.PositiveIntegerField(default=1)
    application_price = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    tuition_price = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    is_certificate_course = models.BooleanField(default=True)
    prerequisites = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='required_for',
        blank=True,
        help_text="Courses that must be completed before this course"
    )

    def __str__(self):
        return self.name


class DiplomaProgram(models.Model):
    name = models.CharField(max_length=200)
    courses = models.ManyToManyField(Course, related_name="diploma_programs")
    prerequisites = models.ManyToManyField(
        Course, related_name="diploma_prerequisite_for", blank=True
    )
    application_price = models.DecimalField(max_digits=6, decimal_places=2)
    tuition_price_per_hour = models.DecimalField(max_digits=6, decimal_places=2)
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )

    def __str__(self):
        return self.name


class AssociatesProgram(models.Model):
    name = models.CharField(max_length=200)
    courses = models.ManyToManyField(Course, related_name="associates_programs")
    prerequisites = models.ManyToManyField(
        Course, related_name="associates_prerequisite_for", blank=True
    )
    application_price = models.DecimalField(max_digits=6, decimal_places=2)
    tuition_price_per_hour = models.DecimalField(max_digits=6, decimal_places=2)
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )

    def __str__(self):
        return self.name


class CertificateProgram(models.Model):
    name = models.CharField(max_length=200)
    courses = models.ManyToManyField(Course, related_name="certificate_programs")
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )

    def __str__(self):
        return self.name


class DiplomaApplication(DegreeApplication):
    diploma_program = models.CharField(
        max_length=100, choices=diplomaprograms, blank=True, null=True
    )

    def __str__(self):
        return self.first_name + " " + self.last_name


class CertificateApplication(DegreeApplication):
    Certificate = models.CharField(
        max_length=100, choices=certificateprograms, blank=True, null=True
    )

    def __str__(self):
        return self.first_name + " " + self.last_name


class AssociatesApplication(DegreeApplication):
    associates_program = models.CharField(
        max_length=100, choices=associateprograms, blank=True, null=True
    )

    def __str__(self):
        return self.first_name + " " + self.last_name


# New Unified Application Model (replaces the three separate application forms)
PROGRAM_TYPE_CHOICES = (
    ('certificate', 'Certificate'),
    ('associates', 'Associates'),
    ('diploma', 'Diploma'),
)

PROGRAM_NAME_CHOICES = (
    ('CNA', 'Nurse Aide'),
    ('MA_cert', 'Medical Assistant (Certificate)'),
    ('MA_assoc', 'Medical Assistant (Associates)'),
    ('LPN', 'Practical Nursing'),
)

MARITAL_STATUS_CHOICES = (
    ('single', 'Single'),
    ('married', 'Married'),
    ('widowed', 'Widowed'),
    ('divorced', 'Divorced'),
)

ENTRANCE_EXAM_CHOICES = (
    ('passed', 'Passed'),
    ('failed', 'Failed'),
    ('not_taken', 'Not Taken'),
)

GENDER_CHOICES = (
    ('M', 'Male'),
    ('F', 'Female'),
)


class Application(models.Model):
    """
    Unified application model for all programs (Certificate, Associates, Diploma).
    SSN is NOT stored in this model - it is only included in the email notification.
    """
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # Program Selection
    program_type = models.CharField(max_length=50, choices=PROGRAM_TYPE_CHOICES)
    program_name = models.CharField(max_length=100, choices=PROGRAM_NAME_CHOICES)
    semester = models.CharField(max_length=50)  # e.g., "Spring 2025" or "January 2025"

    # Personal Data
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_initial = models.CharField(max_length=5, blank=True)
    address = models.TextField()
    date_of_birth = models.DateField()
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES)
    has_dependents = models.BooleanField(default=False)
    num_dependents = models.IntegerField(default=0)

    # Emergency Contact
    emergency_first_name = models.CharField(max_length=100)
    emergency_last_name = models.CharField(max_length=100)
    emergency_middle_initial = models.CharField(max_length=5, blank=True)
    emergency_phone = models.CharField(max_length=20)
    emergency_email = models.EmailField(blank=True)

    # Educational Data
    high_school_graduate = models.BooleanField(default=False)
    high_school_year = models.CharField(max_length=10, blank=True)
    high_school_name = models.CharField(max_length=200, blank=True)
    ged_graduate = models.BooleanField(default=False)
    ged_year = models.CharField(max_length=10, blank=True)
    ged_school_name = models.CharField(max_length=200, blank=True)

    # Colleges Attended (JSON field)
    # Format: [{"name": "...", "city_state": "...", "date_attended": "...", "graduated": "Yes/No", "degree": "..."}]
    colleges_attended = models.JSONField(default=list, blank=True)

    # Prerequisite Courses - LPN/Diploma only (JSON field)
    # Format: [{"course": "ALHS 1090", "college": "...", "year": "...", "semester": "...", "grade": "..."}]
    prerequisite_courses = models.JSONField(default=list, blank=True)

    # Entrance Exam - LPN/Diploma only
    entrance_exam_status = models.CharField(
        max_length=20, blank=True, choices=ENTRANCE_EXAM_CHOICES
    )
    entrance_exam_date = models.DateField(null=True, blank=True)

    # CNA Requirement - LPN/Diploma only
    cna_year_completed = models.CharField(max_length=10, blank=True)
    cna_license_number = models.CharField(max_length=50, blank=True)
    cna_expiration_date = models.DateField(null=True, blank=True)

    # Employment History (JSON field)
    # Format: [{"employer": "...", "position": "...", "from_date": "...", "to_date": "..."}]
    employment_history = models.JSONField(default=list, blank=True)

    # Legal Disclosure
    has_conviction = models.BooleanField(default=False)
    conviction_explanation = models.TextField(blank=True)

    # Signature
    signature = models.CharField(max_length=200)
    signature_date = models.DateField()

    # How did you hear about us
    how_did_you_hear_about_us = models.CharField(
        max_length=200, choices=method_of_discovery, blank=True
    )

    class Meta:
        db_table = 'applications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.program_name}"


import uuid

from django.db import models
from django.db.models import Sum

# Assuming Address, DiplomaApplication, CertificateApplication, AssociatesApplication, Course,
# CertificateProgram, DiplomaProgram, AssociatesProgram, and PaymentSchedule models are defined elsewhere


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    first_name = models.CharField(max_length=200)
    last_name = models.CharField(max_length=200)
    username = models.CharField(max_length=200)
    DOB = models.DateField()
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.ForeignKey(
        "Address", on_delete=models.PROTECT, null=True, blank=True
    )
    diploma_applications = models.ManyToManyField(
        "DiplomaApplication", related_name="students", blank=True
    )
    certificate_applications = models.ManyToManyField(
        "CertificateApplication", related_name="students", blank=True
    )
    associates_applications = models.ManyToManyField(
        "AssociatesApplication", related_name="students", blank=True
    )
    course_enrollments = models.ManyToManyField(
        "Course", related_name="students", blank=True
    )
    enrolled_certificate_programs = models.ManyToManyField(
        "CertificateProgram", related_name="enrolled_students", blank=True
    )
    enrolled_diploma_programs = models.ManyToManyField(
        "DiplomaProgram", related_name="enrolled_students", blank=True
    )
    enrolled_associates_programs = models.ManyToManyField(
        "AssociatesProgram", related_name="enrolled_students", blank=True
    )
    on_payment_plan = models.BooleanField(default=False)
    cohort = models.ForeignKey(
        "Cohort",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )

    def calculate_total_hours_for_diploma(self, diploma_program):
        """
        Calculate the total hours a student is enrolled in within a specific diploma program.
        """
        total_hours = 0
        enrolled_courses = self.course_enrollments.filter(
            diploma_programs=diploma_program
        )
        for course in enrolled_courses:
            total_hours += course.credit_hours
        return total_hours

    def calculate_total_payments_for_program(self, program):
        """
        Calculate the total payments due for a specific program, focusing on the unpaid payment
        schedule with the closest future due date, including those due today.
        """
        if self.on_payment_plan:
            today_date = localtime().date()  # Adjust the date to the local timezone

            payment_schedules = None
            # Adjust the filter to include only unpaid payment schedules
            if isinstance(program, DiplomaProgram):
                payment_schedules = PaymentSchedule.objects.filter(
                    student=self,
                    diploma_program=program,
                    due_date__gte=today_date,
                    paid=False,
                ).order_by("due_date")
            elif isinstance(program, AssociatesProgram):
                payment_schedules = PaymentSchedule.objects.filter(
                    student=self,
                    associates_program=program,
                    due_date__gte=today_date,
                    paid=False,
                ).order_by("due_date")
            elif isinstance(program, CertificateProgram):
                payment_schedules = PaymentSchedule.objects.filter(
                    student=self,
                    certificate_program=program,
                    due_date__gte=today_date,
                    paid=False,
                ).order_by("due_date")

            # Now payment_schedules only includes unpaid schedules
            if payment_schedules and payment_schedules.exists():
                closest_payment_schedule = payment_schedules.first()
                return closest_payment_schedule.amount_due
            else:
                # No upcoming unpaid payments, could mean they are all paid or none are scheduled yet
                return 0
        else:
            # For students not on a payment plan, calculate the full price
            return self.calculate_full_price_for_program(program)

    def calculate_full_price_for_program(self, program):
        """
        Calculate the full price for a program.
        """
        # Implement the logic to calculate the full price for the program
        # This could be a hardcoded value or calculated based on the program details
        if isinstance(program, DiplomaProgram):
            hours = sum(
                [
                    course.credit_hours
                    for course in self.course_enrollments.filter(
                        diploma_programs=program
                    )
                ]
            )
            return hours * 360  # Assuming $360 per credit hour
        elif isinstance(program, AssociatesProgram):
            hours = sum(
                [
                    course.credit_hours
                    for course in self.course_enrollments.filter(
                        associate_programs=program
                    )
                ]
            )

            return hours * 360  # Full price for Associates Program
        elif isinstance(program, CertificateProgram):
            total = sum(
                [
                    course.tuition_price
                    for course in self.course_enrollments.filter(
                        certificate_programs=program
                    )
                ]
            )
            return total  # Full price for Certificate Program
        # Default to 0 if program type is not recognized
        return 0

    def get_payment_details(self):
        """
        Compile payment details for all programs the student is enrolled in.
        Includes enrollment status and application information.
        """
        # Check enrollment status
        has_enrollments = (
            self.enrolled_certificate_programs.exists() or
            self.enrolled_diploma_programs.exists() or
            self.enrolled_associates_programs.exists()
        )

        has_applications = (
            self.diploma_applications.exists() or
            self.certificate_applications.exists() or
            self.associates_applications.exists()
        )

        payment_details = {
            "certificate_courses": [],
            "diploma_programs": [],
            "associate_programs": [],
            "enrollment_status": {
                "is_enrolled": has_enrollments,
                "has_applications": has_applications,
                "status": "enrolled" if has_enrollments else ("application_pending" if has_applications else "not_enrolled")
            }
        }

        # Check if there are any enrolled certificate programs and calculate due and paid amounts
        if self.enrolled_certificate_programs.exists():
            for program in self.enrolled_certificate_programs.all():
                payment_details["certificate_courses"].append(
                    {
                        "program_name": program.name,
                        "total_due": self.calculate_total_payments_for_program(program),
                        "total_paid": self.calculate_total_paid_for_program(program),
                    }
                )

        # Repeat the process for diploma and associates programs
        if self.enrolled_diploma_programs.exists():
            for program in self.enrolled_diploma_programs.all():
                payment_details["diploma_programs"].append(
                    {
                        "program_name": program.name,
                        "total_due": self.calculate_total_payments_for_program(program),
                        "total_paid": self.calculate_total_paid_for_program(program),
                    }
                )

        if self.enrolled_associates_programs.exists():
            for program in self.enrolled_associates_programs.all():
                payment_details["associate_programs"].append(
                    {
                        "program_name": program.name,
                        "total_due": self.calculate_total_payments_for_program(program),
                        "total_paid": self.calculate_total_paid_for_program(program),
                    }
                )

        return payment_details

    def calculate_total_paid_for_program(self, program, debug=False):
        """
        Calculate the total amount paid by the student for a specific program,
        using if/elif statements to filter payment schedules based on program type.
        """
        # Initialize the queryset variable
        payment_schedules = PaymentSchedule.objects.none()

        # Determine the type of program and filter payment schedules accordingly
        if hasattr(program, "diplomaprogram"):
            payment_schedules = PaymentSchedule.objects.filter(diploma_program=program)
        elif hasattr(program, "associatesprogram"):
            payment_schedules = PaymentSchedule.objects.filter(
                associates_program=program
            )
        elif hasattr(program, "certificateprogram"):
            payment_schedules = PaymentSchedule.objects.filter(
                certificate_program=program
            )

        # Aggregate the total amount paid based on the filtered payment schedules
        total_paid = (
            Payment.objects.filter(
                payment_schedule__in=payment_schedules, student=self
            ).aggregate(total=Sum("amount_paid"))["total"]
            or 0
        )

        # Include debugging info if in DEBUG mode and debug is True
        if debug and settings.DEBUG:
            debugging_info = {
                "calculating_for": program.name,
                "payment_schedules_found": payment_schedules.count(),
                "total_paid": total_paid,
            }
            return total_paid, debugging_info

        # Return just the total paid amount for production use
        return total_paid

    def create_payment_schedules(self):
        # Calculate total tuition based on enrolled courses
        total_tuition = self.calculate_total_hours_for_diploma() * 360
        # Example: split total tuition into two payments
        payment_amount = total_tuition / 2

        # Create two payment schedules
        for i in range(2):
            PaymentSchedule.objects.create(
                student=self,
                due_date=now()
                + timedelta(days=30 * (i + 1)),  # Adjust the due date logic as needed
                amount_due=payment_amount,
            )

    # Signal handler
    # @receiver(m2m_changed, sender=Student.course_enrollments.through)
    # def create_or_update_payment_schedule(sender, instance, **kwargs):
    # Check if it's the right type of change, e.g., post_add
    # if kwargs['action'] in ['post_add', 'post_remove', 'post_clear']:
    # instance.update_payment_schedules()
    def __str__(self):
        return self.first_name + " " + self.last_name


class Lecturer(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    first_name = models.CharField(max_length=200)
    last_name = models.CharField(max_length=200)
    credentials = models.CharField(max_length=200)

    def __str__(self):
        return self.first_name + " " + self.last_name


class Payment_method(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    Student = models.ForeignKey(Student, on_delete=models.CASCADE, default="")
    type = models.CharField(max_length=200)
    card_number = models.TextField()
    expiration_month = models.TextField()
    expiration_year = models.TextField()


class Payment(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    student = models.ForeignKey(
        "Student", on_delete=models.CASCADE, related_name="payments"
    )
    payment_schedule = models.ForeignKey(
        "PaymentSchedule",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    due_date = models.DateField()
    amount_due = models.DecimalField(max_digits=8, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20,
        choices=(("Pending", "Pending"), ("Paid", "Paid"), ("Overdue", "Overdue")),
        default="Pending",
    )
    payment_type = models.CharField(
        max_length=50,
        choices=(
            ("Registration", "Registration"),
            ("Tuition", "Tuition"),
            ("Other", "Other"),
        ),
    )
    payment_description = models.TextField(blank=True, null=True)
    payment_date = models.DateField(
        blank=True, null=True
    )  # The actual date payment was made
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Automatically update status based on payment details
        if self.amount_paid >= self.amount_due:
            self.status = "Paid"
            if not self.payment_date:
                self.payment_date = timezone.now().date()
        elif self.due_date < timezone.now().date():
            self.status = "Overdue"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payment for {self.student} due on {self.due_date}"

    class Meta:
        ordering = ["due_date"]


class Address(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    street1 = models.TextField(max_length=200)
    street2 = models.TextField(max_length=200, blank=True)
    street3 = models.TextField(max_length=200, blank=True)
    city = models.TextField(max_length=200)
    zip = models.TextField(max_length=200)
    state = models.TextField(max_length=200)
    country = models.TextField(max_length=200)


class Course_Schedule(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    type = models.CharField(max_length=200, choices=Schedule)
    start_time = models.CharField(max_length=200)
    end_time = models.CharField(max_length=200)
    Days = models.CharField(max_length=200)


class Course_section(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    Course = models.ForeignKey("Course", on_delete=models.CASCADE)
    Course_Schedule = models.OneToOneField(Course_Schedule, on_delete=models.PROTECT)
    Lecturer = models.ForeignKey(Lecturer, on_delete=models.PROTECT)
    Capacity = models.IntegerField(blank=True, null=True)


class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course_section = models.ForeignKey(Course_section, on_delete=models.CASCADE)
    year = models.PositiveIntegerField()
    semester = models.CharField(max_length=200, choices=Semester)
    final_grade = models.CharField(max_length=5)

    class Meta:
        unique_together = ["student", "course_section", "year", "semester"]


class CourseEnrollmentHistory(models.Model):
    """Track student enrollment history with grades and completion status"""
    GRADE_CHOICES = (
        ('A', 'A'), ('A-', 'A-'),
        ('B+', 'B+'), ('B', 'B'), ('B-', 'B-'),
        ('C+', 'C+'), ('C', 'C'), ('C-', 'C-'),
        ('D', 'D'), ('F', 'F'),
        ('W', 'Withdrawn'), ('IP', 'In Progress'), ('I', 'Incomplete')
    )

    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollment_history')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollment_history')
    semester = models.CharField(max_length=20, choices=Semester)
    year = models.PositiveIntegerField()
    grade = models.CharField(max_length=5, choices=GRADE_CHOICES, blank=True, null=True)
    grade_points = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    completed = models.BooleanField(default=False)
    enrollment_date = models.DateField(auto_now_add=True)
    completion_date = models.DateField(null=True, blank=True)
    grade_released = models.BooleanField(
        default=True,
        help_text="Whether the student can view their final grade (survey gate)"
    )
    survey_completed = models.BooleanField(
        default=False,
        help_text="Whether student completed end-of-semester survey"
    )

    class Meta:
        unique_together = ['student', 'course', 'semester', 'year']
        ordering = ['-year', '-semester']

    def __str__(self):
        return f"{self.student} - {self.course.name} ({self.semester} {self.year})"

    def save(self, *args, **kwargs):
        # Calculate grade points based on letter grade
        grade_scale = {
            'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D': 1.0, 'F': 0.0
        }
        if self.grade and self.grade in grade_scale:
            self.grade_points = grade_scale[self.grade]

        # Mark as completed if grade is assigned (except IP, W, I)
        if self.grade and self.grade not in ['IP', 'W', 'I']:
            self.completed = True
            if not self.completion_date:
                self.completion_date = timezone.now().date()

        super().save(*args, **kwargs)


class AcademicProgress(models.Model):
    """Track student's academic progress, GPA, and standing"""
    STANDING_CHOICES = (
        ('good_standing', 'Good Standing'),
        ('probation', 'Academic Probation'),
        ('suspension', 'Academic Suspension'),
    )

    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='academic_progress')
    cumulative_gpa = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_credits_earned = models.PositiveIntegerField(default=0)
    total_credits_attempted = models.PositiveIntegerField(default=0)
    academic_standing = models.CharField(
        max_length=20,
        choices=STANDING_CHOICES,
        default='good_standing'
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student} - GPA: {self.cumulative_gpa}"

    def calculate_gpa(self):
        """Calculate cumulative GPA from enrollment history"""
        completed_courses = self.student.enrollment_history.filter(
            completed=True,
            grade_points__isnull=False
        )

        total_grade_points = 0
        total_credits = 0

        for enrollment in completed_courses:
            if enrollment.grade_points is not None:
                total_grade_points += float(enrollment.grade_points) * enrollment.course.credit_hours
                total_credits += enrollment.course.credit_hours

        if total_credits > 0:
            self.cumulative_gpa = round(total_grade_points / total_credits, 2)
            self.total_credits_earned = total_credits
        else:
            self.cumulative_gpa = 0.00
            self.total_credits_earned = 0

        # Update academic standing based on GPA
        if self.cumulative_gpa >= 2.0:
            self.academic_standing = 'good_standing'
        elif self.cumulative_gpa >= 1.5:
            self.academic_standing = 'probation'
        else:
            self.academic_standing = 'suspension'

        self.save()
        return self.cumulative_gpa


"""# HTTPS server block for api.andrewslearning.com
server {
    server_name menteecollege.com;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/menteecollege.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/menteecollege/privkey.p>
    client_max_body_size 100M;

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/ab/menteeCollegePortal>
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}"""


class DiscountCode(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_amount = models.DecimalField(
        max_digits=6, decimal_places=2, validators=[MinValueValidator(0)]
    )
    is_percentage = models.BooleanField(default=False)
    valid_from = models.DateTimeField(default=datetime.datetime.now)
    valid_to = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.code

    def is_valid(self):
        """Check if the discount code is valid"""
        now = timezone.now()
        return self.is_active and self.valid_from <= now <= self.valid_to

    def apply_discount(self, total_cost):
        """Apply the discount to the given cost"""
        if self.is_percentage:
            return total_cost * (1 - (self.discount_amount / 100))
        else:
            return max(total_cost - self.discount_amount, 0)


class PaymentSchedule(models.Model):
    student = models.ForeignKey(
        "Student", on_delete=models.CASCADE, related_name="payment_schedules"
    )
    diploma_program = models.ForeignKey(
        "DiplomaProgram",
        related_name="payment_schedules",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    associates_program = models.ForeignKey(
        "AssociatesProgram",
        related_name="payment_schedules",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    certificate_program = models.ForeignKey(
        "CertificateProgram",
        related_name="payment_schedules",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    due_date = models.DateField()
    amount_due = models.DecimalField(max_digits=8, decimal_places=2)
    paid = models.BooleanField(default="False")

    # Removed the self-referencing field as it might have been a mistake
    # payment = models.ForeignKey("PaymentSchedule", on_delete=models.SET_NULL, null=True, blank=True, related_name="payment")

    def __str__(self):
        program = (
            self.diploma_program or self.associates_program or self.certificate_program
        )
        program_name = program.name if program else "N/A"
        return f"{self.student.first_name} {self.student.last_name} - {program_name} - Due on {self.due_date} - Amount: ${self.amount_due}"


#
class ChatGroup(models.Model):
    group_name = models.CharField(max_length=128, unique=True)

    def __str__(self):
        return self.group_name


class GroupMessage(models.Model):
    group = models.ForeignKey(
        ChatGroup, related_name="chat_messages", on_delete=models.CASCADE
    )
    author = models.CharField(max_length=300, null=True, blank=True)  # Optional author
    body = models.CharField(max_length=300)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.body[:20]} by {self.author if self.author else 'Anonymous'}"


class PageVisit(models.Model):
    session_id = models.CharField(max_length=255, null=True, blank=True)
    page_url = models.URLField(null=True, blank=True)
    page_path = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(null=True, blank=True)
    time_spent = models.IntegerField(null=True, blank=True)  # Time in seconds
    ip_address = models.GenericIPAddressField(null=True, blank=True)  # For storing IP
    country = models.CharField(max_length=100, null=True, blank=True)
    region = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    referrer_url = models.URLField(
        null=True, blank=True, help_text="URL of the referring page"
    )  # Added field

    def __str__(self):
        return f"Session: {self.session_id}, Page: {self.page_path}, Time: {self.timestamp}"


# Calendar models for MenteeCollege and NursesAndCompanions
class Organization(models.Model):
    """Base organization model to categorize calendar events"""

    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Organizations"

    def __str__(self):
        return self.name


class CalendarCategory(models.Model):
    """Categories for calendar events (e.g., Academic, Financial, Recruitment)"""

    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="categories"
    )
    name = models.CharField(max_length=100)
    color = models.CharField(
        max_length=20, help_text="Hex color code for display", default="#3788d8"
    )
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Calendar Categories"

    def __str__(self):
        return f"{self.organization.name} - {self.name}"


class CalendarEvent(models.Model):
    """Main calendar event model with organization and category"""

    EVENT_TYPES = (
        ("goal", "Goal"),
        ("checkpoint", "Checkpoint"),
        ("deadline", "Deadline"),
        ("meeting", "Meeting"),
        ("class", "Class"),
        ("exam", "Exam"),
        ("other", "Other"),
    )

    PRIORITY_CHOICES = (
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    )

    STATUS_CHOICES = (
        ("planned", "Planned"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("delayed", "Delayed"),
        ("cancelled", "Cancelled"),
    )

    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="events"
    )
    category = models.ForeignKey(
        CalendarCategory,
        on_delete=models.SET_NULL,
        related_name="events",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    all_day = models.BooleanField(default=False)
    location = models.CharField(max_length=200, blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default="other")
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default="medium"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planned")

    # Optional related models
    related_course = models.ForeignKey(
        Course, on_delete=models.SET_NULL, null=True, blank=True, related_name="events"
    )
    related_student = models.ForeignKey(
        Student, on_delete=models.SET_NULL, null=True, blank=True, related_name="events"
    )
    related_lecturer = models.ForeignKey(
        Lecturer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )

    # For recurring events
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(
        max_length=200, blank=True, help_text="e.g. 'FREQ=WEEKLY;INTERVAL=1'"
    )
    parent_event = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="recurrences",
    )

    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_events",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_datetime"]

    def __str__(self):
        return f"{self.organization.name} - {self.title} ({self.start_datetime.strftime('%Y-%m-%d')})"

    @property
    def is_completed(self):
        return self.status == "completed"

    @property
    def is_past_due(self):
        return self.end_datetime < timezone.now() and self.status not in [
            "completed",
            "cancelled",
        ]


class EventAttendee(models.Model):
    """Model to track attendees for calendar events"""

    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    event = models.ForeignKey(
        CalendarEvent, on_delete=models.CASCADE, related_name="attendees"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="attending_events"
    )
    is_organizer = models.BooleanField(default=False)
    response_status = models.CharField(
        max_length=20,
        choices=(
            ("pending", "Pending"),
            ("accepted", "Accepted"),
            ("declined", "Declined"),
            ("tentative", "Tentative"),
        ),
        default="pending",
    )

    class Meta:
        unique_together = ["event", "user"]

    def __str__(self):
        return f"{self.user.username} - {self.event.title} ({self.response_status})"


class EventReminder(models.Model):
    """Reminders for calendar events"""

    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    event = models.ForeignKey(
        CalendarEvent, on_delete=models.CASCADE, related_name="reminders"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="event_reminders"
    )
    remind_at = models.DateTimeField()
    reminder_sent = models.BooleanField(default=False)
    reminder_method = models.CharField(
        max_length=20,
        choices=(
            ("email", "Email"),
            ("sms", "SMS"),
            ("notification", "System Notification"),
        ),
        default="email",
    )

    class Meta:
        ordering = ["remind_at"]

    def __str__(self):
        return f"Reminder for {self.event.title} at {self.remind_at.strftime('%Y-%m-%d %H:%M')}"


class EventAttachment(models.Model):
    """Attachments for calendar events (documents, files, etc.)"""

    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    event = models.ForeignKey(
        CalendarEvent, on_delete=models.CASCADE, related_name="attachments"
    )
    title = models.CharField(max_length=100)
    file = models.FileField(upload_to="calendar_attachments/")
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.event.title}"


# Cohort and Document Management Models
class Cohort(models.Model):
    """Model to represent student cohorts organized by academic year and program"""

    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    academic_year = models.CharField(
        max_length=9,
        default="2024-2025",
        help_text="Academic year range (e.g., 2024-2025)",
    )
    cohort_number = models.PositiveIntegerField()
    program_type = models.CharField(
        max_length=20,
        choices=(
            ("certificate", "Certificate"),
            ("diploma", "Diploma"),
            ("associates", "Associates"),
        ),
    )
    # Program-specific relationships
    certificate_program = models.ForeignKey(
        CertificateProgram,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="cohorts",
    )
    diploma_program = models.ForeignKey(
        DiplomaProgram,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="cohorts",
    )
    associates_program = models.ForeignKey(
        AssociatesProgram,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="cohorts",
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["academic_year", "cohort_number", "program_type"]
        ordering = ["-academic_year", "cohort_number"]

    def __str__(self):
        program_name = self.get_program_name()
        return f"{self.academic_year} Cohort {self.cohort_number} - {program_name}"

    @property
    def start_year(self):
        """Extract the start year from academic_year (e.g., 2024 from '2024-2025')"""
        try:
            return int(self.academic_year.split("-")[0])
        except (ValueError, IndexError):
            return None

    @property
    def end_year(self):
        """Extract the end year from academic_year (e.g., 2025 from '2024-2025')"""
        try:
            return int(self.academic_year.split("-")[1])
        except (ValueError, IndexError):
            return None

    def get_program_name(self):
        if self.certificate_program:
            return self.certificate_program.name
        elif self.diploma_program:
            return self.diploma_program.name
        elif self.associates_program:
            return self.associates_program.name
        return "No Program"

    def get_program(self):
        """Return the actual program object"""
        if self.certificate_program:
            return self.certificate_program
        elif self.diploma_program:
            return self.diploma_program
        elif self.associates_program:
            return self.associates_program
        return None


class DocumentCategory(models.Model):
    """Categories for organizing documents"""

    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Document Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class StudentDocument(models.Model):
    """Model for managing student documents with S3 storage"""

    DOCUMENT_SCOPE_CHOICES = (
        ("individual", "Individual Student"),
        ("cohort", "Entire Cohort"),
        ("program", "Program-wide"),
        ("general", "General/All Programs"),
    )

    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )

    # Document metadata
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        DocumentCategory, on_delete=models.SET_NULL, null=True, related_name="documents"
    )

    # Document scope - determines who can access this document
    scope = models.CharField(
        max_length=20,
        choices=DOCUMENT_SCOPE_CHOICES,
        default="cohort",
        help_text="Determines document visibility scope",
    )

    # Relationships
    cohort = models.ForeignKey(
        Cohort,
        on_delete=models.CASCADE,
        related_name="documents",
        null=True,
        blank=True,
        help_text="Required for cohort/individual scope",
    )
    students = models.ManyToManyField(
        Student,
        blank=True,
        related_name="assigned_documents",
        help_text="Specific students (for individual scope)",
    )
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    # File storage fields (using S3)
    file = models.FileField(
        upload_to="menteecollege/documents/",
        null=True,
        blank=True,
        help_text="Upload file here or use S3 direct upload",
    )

    # S3 metadata fields
    file_name = models.CharField(max_length=255, blank=True)
    file_type = models.CharField(max_length=50, blank=True)
    file_size = models.PositiveBigIntegerField(
        default=0, help_text="File size in bytes"
    )
    s3_key = models.CharField(
        max_length=500, blank=True, help_text="S3 object key for direct uploads"
    )
    s3_url = models.URLField(
        max_length=1000, blank=True, help_text="S3 URL for the file"
    )

    # Document processing fields
    extracted_text = models.TextField(
        blank=True, help_text="Extracted text from document"
    )
    preview_text = models.TextField(
        max_length=500, blank=True, help_text="Preview/summary of document"
    )
    page_count = models.PositiveIntegerField(null=True, blank=True)

    # Visibility and status
    is_public = models.BooleanField(
        default=True, help_text="Whether all cohort students can view"
    )
    is_mandatory = models.BooleanField(
        default=False, help_text="Whether students must acknowledge reading"
    )
    requires_signature = models.BooleanField(default=False)

    # Timestamps
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    valid_until = models.DateTimeField(
        null=True, blank=True, help_text="Document expiration date"
    )

    # File type validation choices
    ALLOWED_FILE_TYPES = (
        ("pdf", "PDF"),
        ("docx", "Word Document"),
        ("doc", "Word Document (Legacy)"),
        ("xlsx", "Excel Spreadsheet"),
        ("xls", "Excel Spreadsheet (Legacy)"),
        ("pptx", "PowerPoint Presentation"),
        ("txt", "Text File"),
        ("jpg", "JPEG Image"),
        ("jpeg", "JPEG Image"),
        ("png", "PNG Image"),
    )

    class Meta:
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["cohort", "category"]),
            models.Index(fields=["uploaded_at"]),
        ]

    def __str__(self):
        return f"{self.title} - {self.cohort}"

    def get_s3_key(self):
        """Generate S3 key based on cohort and document info"""
        if self.s3_key:
            return self.s3_key

        cohort = self.cohort
        program = cohort.get_program()
        program_name = program.name.replace(" ", "_").lower() if program else "unknown"
        safe_filename = (
            self.file_name.replace(" ", "_") if self.file_name else "document"
        )

        return f"menteecollege/{cohort.academic_year}/cohort_{cohort.cohort_number}/{program_name}/{self.id}_{safe_filename}"

    def save(self, *args, **kwargs):
        """Override save to auto-populate S3 fields if file is uploaded"""
        if self.file and not self.file_name:
            self.file_name = self.file.name.split("/")[-1]
            self.file_type = self.file_name.split(".")[-1].lower()
            self.file_size = self.file.size
            if not self.s3_key:
                self.s3_key = self.file.name
            if not self.s3_url and hasattr(self.file, "url"):
                self.s3_url = self.file.url
        super().save(*args, **kwargs)


class StudentDocumentAcknowledgment(models.Model):
    """Track when students have viewed/acknowledged mandatory documents"""

    id = models.UUIDField(
        default=uuid.uuid4, unique=True, primary_key=True, editable=False
    )
    document = models.ForeignKey(
        StudentDocument, on_delete=models.CASCADE, related_name="acknowledgments"
    )
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="document_acknowledgments"
    )
    acknowledged_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    signature = models.CharField(
        max_length=255, blank=True, help_text="Digital signature if required"
    )

    class Meta:
        unique_together = ["document", "student"]

    def __str__(self):
        return f"{self.student} acknowledged {self.document.title}"


# Survey System Models

class SurveyType(models.Model):
    """Defines types of surveys with meaningful names instead of day-based naming"""
    
    SURVEY_TYPE_CHOICES = (
        ('program_completion', 'Program Completion Survey'),
        ('employment_outcomes', 'Employment Outcomes Survey'), 
        ('satisfaction_feedback', 'Student Satisfaction Survey'),
        ('skills_assessment', 'Skills Assessment Survey'),
        ('career_readiness', 'Career Readiness Evaluation'),
        ('employer_evaluation', 'Supervisor Evaluation'),
        ('job_performance', 'Job Performance Review'),
        ('workplace_skills', 'Workplace Skills Assessment'),
    )
    
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
    name = models.CharField(max_length=100, unique=True)
    survey_type = models.CharField(max_length=50, choices=SURVEY_TYPE_CHOICES)
    description = models.TextField(blank=True)
    days_after_graduation = models.PositiveIntegerField(
        default=0, 
        help_text="Number of days after graduation to trigger this survey"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['days_after_graduation', 'name']
    
    def __str__(self):
        return f"{self.name} (Day {self.days_after_graduation})"


class SurveyQuestion(models.Model):
    """Individual questions that can be used in surveys"""
    
    QUESTION_TYPE_CHOICES = (
        ('text', 'Text Response'),
        ('textarea', 'Long Text Response'),
        ('multiple_choice', 'Multiple Choice'),
        ('checkbox', 'Checkbox (Multiple Selection)'),
        ('rating', 'Rating Scale (1-5)'),
        ('yes_no', 'Yes/No'),
        ('date', 'Date'),
        ('email', 'Email'),
        ('phone', 'Phone Number'),
    )
    
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
    survey_type = models.ForeignKey(SurveyType, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    choices = models.JSONField(
        blank=True, 
        null=True, 
        help_text="JSON array of choices for multiple choice/checkbox questions"
    )
    is_required = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['survey_type', 'order', 'id']
        unique_together = ['survey_type', 'order']
    
    def __str__(self):
        return f"{self.survey_type.name} - Q{self.order}: {self.question_text[:50]}"


class StudentSurvey(models.Model):
    """Tracks survey assignments and completion status for students"""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    )
    
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='surveys')
    survey_type = models.ForeignKey(SurveyType, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Dates
    assigned_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    sent_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    
    # Survey access
    survey_token = models.CharField(max_length=100, unique=True, blank=True)
    
    class Meta:
        unique_together = ['student', 'survey_type']
        ordering = ['-assigned_date']
    
    def __str__(self):
        return f"{self.student} - {self.survey_type.name} ({self.status})"
    
    def save(self, *args, **kwargs):
        # Generate unique survey token if not set
        if not self.survey_token:
            import secrets
            self.survey_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)


class SurveyResponse(models.Model):
    """Individual question responses from students"""
    
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
    student_survey = models.ForeignKey(StudentSurvey, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE)
    response_text = models.TextField(blank=True)
    response_json = models.JSONField(
        null=True, 
        blank=True, 
        help_text="For complex responses like multiple selections"
    )
    responded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['student_survey', 'question']
    
    def __str__(self):
        return f"{self.student_survey.student} - Q{self.question.order}"


# Employer Survey Models

class Employer(models.Model):
    """Employer information for supervisor evaluations"""
    
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
    company_name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    industry = models.CharField(max_length=100, blank=True)
    company_size = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.company_name} - {self.contact_person}"


class EmployerSurvey(models.Model):
    """Tracks employer survey assignments for student evaluations"""
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('in_progress', 'In Progress'), 
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    )
    
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='employer_surveys')
    employer = models.ForeignKey(Employer, on_delete=models.CASCADE, related_name='surveys')
    survey_type = models.ForeignKey(SurveyType, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Dates
    assigned_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    sent_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    
    # Survey access
    survey_token = models.CharField(max_length=100, unique=True, blank=True)
    
    # Additional context
    job_title = models.CharField(max_length=100, blank=True)
    employment_start_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['student', 'employer', 'survey_type']
        ordering = ['-assigned_date']
    
    def __str__(self):
        return f"{self.student} - {self.employer.company_name} ({self.survey_type.name})"
    
    def save(self, *args, **kwargs):
        # Generate unique survey token if not set
        if not self.survey_token:
            import secrets
            self.survey_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)


class EmployerSurveyResponse(models.Model):
    """Individual question responses from employers"""
    
    id = models.UUIDField(default=uuid.uuid4, unique=True, primary_key=True, editable=False)
    employer_survey = models.ForeignKey(EmployerSurvey, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE)
    response_text = models.TextField(blank=True)
    response_json = models.JSONField(
        null=True, 
        blank=True, 
        help_text="For complex responses like ratings or multiple selections"
    )
    responded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['employer_survey', 'question']
    
    def __str__(self):
        return f"{self.employer_survey.employer.company_name} - {self.employer_survey.student} - Q{self.question.order}"

