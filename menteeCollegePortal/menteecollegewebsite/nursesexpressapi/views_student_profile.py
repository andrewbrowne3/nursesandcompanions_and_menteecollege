"""
Unified student profile for accreditation monitoring.

One endpoint that assembles everything known about a student:
identity + cohort/program, academic progress (GPA/standing), courses with
grades, a payment summary, and a document-compliance checklist (submitted /
missing / expired) built from the "required" DocumentCategory rows.
"""
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from mentee_college_online_school.models import (
    Student,
    CourseEnrollmentHistory,
    AcademicProgress,
    DocumentCategory,
    StudentDocument,
    Cohort,
    CertificateProgram,
    DiplomaProgram,
    AssociatesProgram,
)


def available_programs():
    """All program names admins can configure requirements for (catalog + any in use)."""
    names = set()
    for M in (CertificateProgram, DiplomaProgram, AssociatesProgram):
        for p in M.objects.all():
            if getattr(p, "name", None):
                names.add(p.name)
    for c in Cohort.objects.all():
        try:
            n = c.get_program_name()
            if n and n != "No Program":
                names.add(n)
        except Exception:
            pass
    return sorted(names)


def _get_student(username):
    try:
        return Student.objects.get(username=username)
    except Student.DoesNotExist:
        return Student.objects.filter(user__username=username).first()


def student_program_name(student):
    """The specific program a student belongs to, via their cohort (e.g. 'Practical Nursing')."""
    cohort = getattr(student, "cohort", None)
    if cohort:
        try:
            name = cohort.get_program_name()
            if name and name != "No Program":
                return name
        except Exception:
            pass
    return None


def category_required_for(category, program_name):
    """Is this document category required for the given program?"""
    reqs = category.required_for_programs or []
    if not isinstance(reqs, list):
        return False
    if "ALL" in reqs:
        return True
    return program_name is not None and program_name in reqs


def build_compliance(student):
    """Return the document-compliance checklist for one student, scoped to their program."""
    program = student_program_name(student)

    # applicable = document types required for this student's specific program (or ALL)
    applicable = [
        c for c in DocumentCategory.objects.all().order_by("display_order", "name")
        if category_required_for(c, program)
    ]

    # documents this student has, indexed by category id
    docs = (
        StudentDocument.objects.filter(students=student)
        .exclude(category__isnull=True)
        .select_related("category")
        .order_by("-uploaded_at")
    )
    by_category = {}
    for d in docs:
        by_category.setdefault(str(d.category_id), d)  # newest wins (ordered desc)

    now = timezone.now()
    checklist = []
    complete = 0
    for cat in applicable:
        doc = by_category.get(str(cat.id))
        if doc is None:
            state = "missing"
        elif doc.valid_until and doc.valid_until < now:
            state = "expired"
        else:
            state = "submitted"
            complete += 1
        checklist.append({
            "category_id": str(cat.id),
            "category": cat.name,
            "description": cat.description,
            "status": state,
            "document": None if doc is None else {
                "id": str(doc.id),
                "file_name": doc.file_name,
                "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
                "valid_until": doc.valid_until.isoformat() if doc.valid_until else None,
                "has_file": bool(doc.s3_key),
            },
        })

    return {
        "items": checklist,
        "required_count": len(applicable),
        "complete_count": complete,
        "is_complete": len(applicable) > 0 and complete == len(applicable),
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_profile(request, username):
    """Unified profile for one student. Admin/staff only."""
    if not request.user.is_staff:
        return Response(
            {"error": "Administrator access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    student = _get_student(username)
    if student is None:
        return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

    cohort = getattr(student, "cohort", None)

    # ---- courses with grades ----
    enrollments = (
        CourseEnrollmentHistory.objects.filter(student=student)
        .select_related("course")
        .order_by("-year", "-semester", "course__name")
    )
    courses = [{
        "id": str(e.id),
        "course_name": e.course.name if e.course else None,
        "credit_hours": getattr(e.course, "credit_hours", None),
        "semester": e.semester,
        "year": e.year,
        "grade": e.grade,
        "grade_points": float(e.grade_points) if e.grade_points is not None else None,
        "completed": e.completed,
        "grade_released": e.grade_released,
    } for e in enrollments]

    # ---- academic progress ----
    progress = AcademicProgress.objects.filter(student=student).first()
    academic = None
    if progress:
        academic = {
            "cumulative_gpa": float(progress.cumulative_gpa) if progress.cumulative_gpa is not None else None,
            "total_credits_earned": progress.total_credits_earned,
            "total_credits_attempted": progress.total_credits_attempted,
            "academic_standing": progress.academic_standing,
        }

    # ---- payment summary (reuse the model's existing computation) ----
    try:
        payment_details = student.get_payment_details()
    except Exception:
        payment_details = {}

    profile = {
        "id": str(student.id),
        "username": student.username,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "email": getattr(student, "email", None),
        "phone_number": student.phone_number,
        "DOB": student.DOB.isoformat() if student.DOB else None,
        "on_payment_plan": student.on_payment_plan,
        "cohort": None if not cohort else {
            "id": str(cohort.id),
            "cohort_number": cohort.cohort_number,
            "academic_year": cohort.academic_year,
            "program_type": cohort.program_type,
        },
        "academic": academic,
        "courses": courses,
        "payment_details": payment_details,
        "compliance": build_compliance(student),
    }
    return Response(profile)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cohort_compliance(request, cohort_id):
    """Roll-up of document compliance for every student in a cohort. Admin only."""
    if not request.user.is_staff:
        return Response(
            {"error": "Administrator access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    students = Student.objects.filter(cohort_id=cohort_id).order_by("last_name", "first_name")
    rows = []
    complete_files = 0
    for s in students:
        c = build_compliance(s)
        if c["is_complete"]:
            complete_files += 1
        rows.append({
            "username": s.username,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "required_count": c["required_count"],
            "complete_count": c["complete_count"],
            "is_complete": c["is_complete"],
            "missing": [i["category"] for i in c["items"] if i["status"] != "submitted"],
        })

    return Response({
        "cohort_id": str(cohort_id),
        "student_count": len(rows),
        "files_complete": complete_files,
        "students": rows,
    })


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def document_requirements(request):
    """
    GET  -> the requirements matrix: available programs + every document type with
            the list of programs that require it.
    POST -> create a new document type. Body: {"name": "...", "description": "..."}.
    Admin only.
    """
    if not request.user.is_staff:
        return Response({"error": "Administrator access required"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "A document name is required."}, status=status.HTTP_400_BAD_REQUEST)
        cat, created = DocumentCategory.objects.get_or_create(
            name=name,
            defaults={
                "description": request.data.get("description", ""),
                "required_for_programs": request.data.get("required_for_programs", []),
                "display_order": DocumentCategory.objects.count() + 1,
            },
        )
        return Response(
            {"id": str(cat.id), "name": cat.name, "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    categories = [{
        "id": str(c.id),
        "name": c.name,
        "description": c.description,
        "required_for_programs": c.required_for_programs or [],
    } for c in DocumentCategory.objects.all().order_by("display_order", "name")]

    return Response({
        "programs": available_programs(),
        "categories": categories,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def set_document_requirement(request, category_id):
    """
    Replace the list of programs that require a document type.
    Body: {"required_for_programs": ["Practical Nursing", ...]} or ["ALL"]. Admin only.
    """
    if not request.user.is_staff:
        return Response({"error": "Administrator access required"}, status=status.HTTP_403_FORBIDDEN)

    try:
        cat = DocumentCategory.objects.get(id=category_id)
    except DocumentCategory.DoesNotExist:
        return Response({"error": "Document type not found"}, status=status.HTTP_404_NOT_FOUND)

    reqs = request.data.get("required_for_programs", [])
    if not isinstance(reqs, list):
        return Response({"error": "required_for_programs must be a list"}, status=status.HTTP_400_BAD_REQUEST)

    cat.required_for_programs = reqs
    # keep the legacy is_required flag roughly in sync for any old readers
    cat.is_required = bool(reqs)
    cat.save(update_fields=["required_for_programs", "is_required"])
    return Response({"id": str(cat.id), "name": cat.name, "required_for_programs": cat.required_for_programs})
