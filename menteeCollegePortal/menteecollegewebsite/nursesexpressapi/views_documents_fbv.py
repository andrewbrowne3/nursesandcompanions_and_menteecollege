import os

from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404
from mentee_college_online_school.models import (
    Cohort,
    DocumentCategory,
    Student,
    StudentDocument,
    StudentDocumentAcknowledgment,
)
from mentee_college_online_school.s3_utils import S3DocumentManager
from mentee_college_online_school.serializers_documents import (
    CohortSerializer,
    DocumentCategorySerializer,
    StudentDocumentAcknowledgmentSerializer,
    StudentDocumentSerializer,
    StudentDocumentUploadSerializer,
)
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


# COHORT VIEWS
@api_view(["GET", "POST"])
def cohorts_list_create(request):
    """List all cohorts or create a new one"""
    print(f"=== COHORTS VIEW CALLED: {request.method} ===")
    if request.method == "GET":
        queryset = Cohort.objects.all()

        # Filter by query parameters
        academic_year = request.GET.get("academic_year")
        program_type = request.GET.get("program_type")
        is_active = request.GET.get("is_active")

        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        if program_type:
            queryset = queryset.filter(program_type=program_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        queryset = queryset.order_by("-academic_year", "cohort_number")

        # Pagination
        page = request.GET.get("page", 1)
        paginator = Paginator(queryset, 20)
        cohorts = paginator.get_page(page)

        serializer = CohortSerializer(cohorts, many=True)

        return Response(
            {
                "results": serializer.data,
                "count": paginator.count,
                "next": cohorts.has_next(),
                "previous": cohorts.has_previous(),
            }
        )

    elif request.method == "POST":
        # Only admins can create cohorts
        if not request.user.is_staff:
            return Response(
                {"error": "Only administrators can create cohorts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CohortSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
def cohort_detail(request, pk):
    """Retrieve, update or delete a cohort"""
    cohort = get_object_or_404(Cohort, pk=pk)

    if request.method == "GET":
        serializer = CohortSerializer(cohort)
        return Response(serializer.data)

    elif request.method == "PUT":
        # Only admins can update cohorts
        if not request.user.is_staff:
            return Response(
                {"error": "Only administrators can update cohorts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CohortSerializer(cohort, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        # Only admins can delete cohorts
        if not request.user.is_staff:
            return Response(
                {"error": "Only administrators can delete cohorts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        cohort.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# DOCUMENT CATEGORY VIEWS
@api_view(["GET", "POST"])
def document_categories_list_create(request):
    """List all document categories or create a new one"""
    print(f"=== CATEGORIES VIEW CALLED: {request.method} ===")
    if request.method == "GET":
        categories = DocumentCategory.objects.all().order_by("name")
        serializer = DocumentCategorySerializer(categories, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        # Only admins can create categories
        if not request.user.is_staff:
            return Response(
                {"error": "Only administrators can create categories"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = DocumentCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
def document_category_detail(request, pk):
    """Retrieve, update or delete a document category"""
    category = get_object_or_404(DocumentCategory, pk=pk)

    if request.method == "GET":
        serializer = DocumentCategorySerializer(category)
        return Response(serializer.data)

    elif request.method == "PUT":
        # Only admins can update categories
        if not request.user.is_staff:
            return Response(
                {"error": "Only administrators can update categories"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = DocumentCategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        # Only admins can delete categories
        if not request.user.is_staff:
            return Response(
                {"error": "Only administrators can delete categories"},
                status=status.HTTP_403_FORBIDDEN,
            )

        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# DOCUMENT VIEWS
@api_view(["GET", "POST"])
def documents_list_create(request):
    """List all documents or create a new one"""
    print(f"=== DOCUMENTS VIEW CALLED: {request.method} ===")
    print(f"User: {request.user}")
    print(f"Is authenticated: {request.user.is_authenticated}")
    if request.method == "GET":
        user = request.user
        queryset = StudentDocument.objects.all().prefetch_related('students', 'students__user')

        # If not admin, only show documents they have access to
        if not user.is_staff:
            try:
                student = Student.objects.get(user=user)
                # Show public cohort documents or documents assigned to them
                queryset = queryset.filter(
                    Q(cohort=student.cohort, is_public=True) | Q(students=student)
                ).distinct()
            except Student.DoesNotExist:
                return Response([], status=status.HTTP_200_OK)

        # Apply filters
        academic_year = request.GET.get("academic_year")
        cohort_number = request.GET.get("cohort_number")
        program_type = request.GET.get("program_type")
        category_id = request.GET.get("category_id")
        is_mandatory = request.GET.get("is_mandatory")
        is_public = request.GET.get("is_public")
        search = request.GET.get("search")
        student_name = request.GET.get("student_name")  # New filter for student names

        if academic_year:
            queryset = queryset.filter(cohort__academic_year=academic_year)
        if cohort_number:
            queryset = queryset.filter(cohort__cohort_number=cohort_number)
        if program_type:
            queryset = queryset.filter(cohort__program_type=program_type)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if is_mandatory:
            queryset = queryset.filter(is_mandatory=is_mandatory.lower() == "true")
        if is_public:
            queryset = queryset.filter(is_public=is_public.lower() == "true")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(file_name__icontains=search)
            )
        
        # Filter by student name (first name, last name, or username)
        if student_name:
            queryset = queryset.filter(
                Q(students__first_name__icontains=student_name)
                | Q(students__last_name__icontains=student_name)
                | Q(students__username__icontains=student_name)
            ).distinct()

        queryset = queryset.order_by("-uploaded_at")

        # Pagination
        page = request.GET.get("page", 1)
        paginator = Paginator(queryset, 20)
        documents = paginator.get_page(page)

        serializer = StudentDocumentSerializer(
            documents, many=True, context={"request": request}
        )

        return Response(
            {
                "results": serializer.data,
                "count": paginator.count,
                "next": documents.has_next(),
                "previous": documents.has_previous(),
            }
        )

    elif request.method == "POST":
        # Only admins can create documents
        if not request.user.is_staff:
            return Response(
                {"error": "Only administrators can upload documents"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Handle file upload with S3 integration
        upload_serializer = StudentDocumentUploadSerializer(data=request.data)
        upload_serializer.is_valid(raise_exception=True)
        data = upload_serializer.validated_data

        # Get cohort (optional for program/general scope)
        cohort = None
        if data.get("cohort_id"):
            cohort = get_object_or_404(Cohort, id=data["cohort_id"])

        # Create document instance
        document = StudentDocument(
            title=data["title"],
            description=data.get("description", ""),
            scope=data.get("scope", "cohort"),
            cohort=cohort,
            is_public=data.get("is_public", True),
            is_mandatory=data.get("is_mandatory", False),
            requires_signature=data.get("requires_signature", False),
            valid_until=data.get("valid_until"),
            uploaded_by=request.user,
        )

        # Set category if provided
        if data.get("category_id"):
            document.category_id = data["category_id"]

        # Handle file upload
        s3_manager = S3DocumentManager()

        if "file" in request.FILES:
            # Direct file upload
            file = request.FILES["file"]

            # Validate file type
            if not s3_manager.validate_file_type(file.name):
                return Response(
                    {
                        "error": "Invalid file type. Allowed types: PDF, DOCX, DOC, XLSX, XLS, PPTX, TXT, JPG, JPEG, PNG"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate file size
            if not s3_manager.validate_file_size(file.size):
                return Response(
                    {"error": "File too large. Maximum size is 50MB."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Save document to get ID
            document.save()

            # Generate S3 key and upload
            s3_key = s3_manager.generate_s3_key(
                cohort, file.name, str(document.id), document.scope
            )
            s3_url = s3_manager.upload_file_to_s3(file, s3_key, file.content_type)

            # Update document with S3 info
            document.file_name = file.name
            document.file_type = os.path.splitext(file.name)[1].lower()[1:]
            document.file_size = file.size
            document.s3_key = s3_key
            document.s3_url = s3_url
            document.save()

        else:
            # Save document for presigned URL upload
            document.save()

        # Assign to specific students if provided
        if data.get("student_ids"):
            students = Student.objects.filter(id__in=data["student_ids"])
            document.students.set(students)
        elif data.get("student_username"):
            # Handle assignment by username
            try:
                student = Student.objects.get(username=data["student_username"])
                document.students.set([student])
                print(f"Assigned document '{document.title}' to student '{student.username}' (ID: {student.id})")
                print(f"Document now has {document.students.count()} assigned students")
            except Student.DoesNotExist:
                return Response(
                    {"error": f"Student with username '{data['student_username']}' not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Refresh document from database to get the updated students relationship
        document.refresh_from_db()
        
        serializer = StudentDocumentSerializer(document, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def document_detail(request, pk):
    """Retrieve, update or delete a document"""
    document = get_object_or_404(StudentDocument, pk=pk)

    if request.method == "GET":
        serializer = StudentDocumentSerializer(document, context={"request": request})
        return Response(serializer.data)

    elif request.method == "PUT":
        # Only admins can update documents
        if not request.user.is_staff:
            return Response(
                {"error": "Only administrators can update documents"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = StudentDocumentSerializer(
            document, data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        # Only admins can delete documents
        if not request.user.is_staff:
            return Response(
                {"error": "Only administrators can delete documents"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Delete from S3 if exists
        if document.s3_key:
            s3_manager = S3DocumentManager()
            try:
                s3_manager.delete_file_from_s3(document.s3_key)
            except Exception as e:
                # Log error but continue with deletion
                print(f"Error deleting from S3: {e}")

        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def document_download(request, pk):
    """Generate presigned download URL"""
    document = get_object_or_404(StudentDocument, pk=pk)

    # Check permissions
    user = request.user
    if not user.is_staff:
        try:
            student = Student.objects.get(user=user)
            # Check if student has access
            if not (
                (document.cohort == student.cohort and document.is_public)
                or document.students.filter(id=student.id).exists()
            ):
                return Response(
                    {"error": "You do not have permission to download this document"},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except Student.DoesNotExist:
            return Response(
                {"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND
            )

    if not document.s3_key:
        return Response(
            {"error": "Document file not found"}, status=status.HTTP_404_NOT_FOUND
        )

    s3_manager = S3DocumentManager()
    try:
        download_url = s3_manager.get_presigned_download_url(
            document.s3_key,
            expires_in=3600,  # 1 hour
            filename=document.file_name,
        )
        return Response(
            {
                "download_url": download_url,
                "filename": document.file_name,
                "expires_in": 3600,
            }
        )
    except Exception as e:
        return Response(
            {"error": f"Error generating download URL: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# DOCUMENT ACKNOWLEDGMENT VIEWS
@api_view(["GET", "POST"])
def document_acknowledgments_list_create(request):
    """List all acknowledgments or create a new one"""
    if request.method == "GET":
        user = request.user
        queryset = StudentDocumentAcknowledgment.objects.all()

        # If not admin, only show their own acknowledgments
        if not user.is_staff:
            try:
                student = Student.objects.get(user=user)
                queryset = queryset.filter(student=student)
            except Student.DoesNotExist:
                return Response([], status=status.HTTP_200_OK)

        # Apply filters
        document_id = request.GET.get("document_id")
        student_id = request.GET.get("student_id")

        if document_id:
            queryset = queryset.filter(document_id=document_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        acknowledgments = queryset.order_by("-acknowledged_at")
        serializer = StudentDocumentAcknowledgmentSerializer(acknowledgments, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        # Get student profile
        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response(
                {"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = StudentDocumentAcknowledgmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student=student)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "DELETE"])
def document_acknowledgment_detail(request, pk):
    """Retrieve or delete an acknowledgment"""
    acknowledgment = get_object_or_404(StudentDocumentAcknowledgment, pk=pk)

    if request.method == "GET":
        serializer = StudentDocumentAcknowledgmentSerializer(acknowledgment)
        return Response(serializer.data)

    elif request.method == "DELETE":
        acknowledgment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

