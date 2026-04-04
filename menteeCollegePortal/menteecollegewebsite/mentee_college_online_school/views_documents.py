from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
import os

from .models import (
    Cohort, DocumentCategory, StudentDocument, 
    StudentDocumentAcknowledgment, Student
)
from .serializers_documents import (
    CohortSerializer, DocumentCategorySerializer,
    StudentDocumentSerializer, StudentDocumentUploadSerializer,
    StudentDocumentAcknowledgmentSerializer, BulkDocumentAssignSerializer,
    DocumentFilterSerializer
)
from .s3_utils import S3DocumentManager
from .decorators import admin_required


class CohortViewSet(viewsets.ModelViewSet):
    """ViewSet for managing cohorts"""
    queryset = Cohort.objects.all()
    serializer_class = CohortSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by query parameters
        academic_year = self.request.query_params.get('academic_year')
        program_type = self.request.query_params.get('program_type')
        is_active = self.request.query_params.get('is_active')
        
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        if program_type:
            queryset = queryset.filter(program_type=program_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-academic_year', 'cohort_number')
    
    @admin_required
    def create(self, request, *args, **kwargs):
        """Only admins can create cohorts"""
        return super().create(request, *args, **kwargs)
    
    @admin_required
    def update(self, request, *args, **kwargs):
        """Only admins can update cohorts"""
        return super().update(request, *args, **kwargs)
    
    @admin_required
    def destroy(self, request, *args, **kwargs):
        """Only admins can delete cohorts"""
        return super().destroy(request, *args, **kwargs)


class DocumentCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing document categories"""
    queryset = DocumentCategory.objects.all()
    serializer_class = DocumentCategorySerializer
    permission_classes = [IsAuthenticated]
    
    @admin_required
    def create(self, request, *args, **kwargs):
        """Only admins can create categories"""
        return super().create(request, *args, **kwargs)
    
    @admin_required
    def update(self, request, *args, **kwargs):
        """Only admins can update categories"""
        return super().update(request, *args, **kwargs)
    
    @admin_required
    def destroy(self, request, *args, **kwargs):
        """Only admins can delete categories"""
        return super().destroy(request, *args, **kwargs)


class StudentDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing student documents"""
    queryset = StudentDocument.objects.all()
    serializer_class = StudentDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # If not admin, only show documents they have access to
        if not user.is_staff:
            try:
                student = Student.objects.get(user=user)
                # Show public cohort documents or documents assigned to them
                queryset = queryset.filter(
                    Q(cohort=student.cohort, is_public=True) |
                    Q(students=student)
                ).distinct()
            except Student.DoesNotExist:
                return queryset.none()
        
        # Apply filters
        filter_serializer = DocumentFilterSerializer(data=self.request.query_params)
        if filter_serializer.is_valid():
            filters = filter_serializer.validated_data
            
            if 'academic_year' in filters:
                queryset = queryset.filter(cohort__academic_year=filters['academic_year'])
            if 'cohort_number' in filters:
                queryset = queryset.filter(cohort__cohort_number=filters['cohort_number'])
            if 'program_type' in filters:
                queryset = queryset.filter(cohort__program_type=filters['program_type'])
            if 'category_id' in filters:
                queryset = queryset.filter(category_id=filters['category_id'])
            if 'is_mandatory' in filters:
                queryset = queryset.filter(is_mandatory=filters['is_mandatory'])
            if 'is_public' in filters:
                queryset = queryset.filter(is_public=filters['is_public'])
            if 'search' in filters and filters['search']:
                queryset = queryset.filter(
                    Q(title__icontains=filters['search']) |
                    Q(description__icontains=filters['search']) |
                    Q(file_name__icontains=filters['search'])
                )
        
        return queryset.order_by('-uploaded_at')
    
    @admin_required
    def create(self, request, *args, **kwargs):
        """Handle document upload with S3 integration"""
        upload_serializer = StudentDocumentUploadSerializer(data=request.data)
        upload_serializer.is_valid(raise_exception=True)
        data = upload_serializer.validated_data
        
        # Get cohort (optional for program/general scope)
        cohort = None
        if data.get('cohort_id'):
            cohort = get_object_or_404(Cohort, id=data['cohort_id'])
        
        # Create document instance
        document = StudentDocument(
            title=data['title'],
            description=data.get('description', ''),
            scope=data.get('scope', 'cohort'),
            cohort=cohort,
            uploaded_by=request.user,
            is_public=data.get('is_public', True),
            is_mandatory=data.get('is_mandatory', False),
            requires_signature=data.get('requires_signature', False),
            valid_until=data.get('valid_until')
        )
        
        # Set category if provided
        if data.get('category_id'):
            document.category_id = data['category_id']
        
        # Handle file upload
        s3_manager = S3DocumentManager()
        
        if 'file' in request.FILES:
            # Direct file upload
            file = request.FILES['file']
            
            # Validate file type
            if not s3_manager.validate_file_type(file.name):
                return Response(
                    {'error': 'Invalid file type. Allowed types: PDF, DOCX, DOC, XLSX, XLS, PPTX, TXT, JPG, JPEG, PNG'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate file size
            if not s3_manager.validate_file_size(file.size):
                return Response(
                    {'error': 'File too large. Maximum size is 50MB.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save document to get ID
            document.save()
            
            # Generate S3 key and upload
            s3_key = s3_manager.generate_s3_key(cohort, file.name, str(document.id), document.scope)
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
        if data.get('student_ids'):
            students = Student.objects.filter(id__in=data['student_ids'])
            document.students.set(students)
        
        serializer = self.get_serializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @admin_required
    def update(self, request, *args, **kwargs):
        """Only admins can update documents"""
        return super().update(request, *args, **kwargs)
    
    @admin_required
    def destroy(self, request, *args, **kwargs):
        """Delete document and remove from S3"""
        document = self.get_object()
        
        # Delete from S3 if exists
        if document.s3_key:
            s3_manager = S3DocumentManager()
            try:
                s3_manager.delete_file_from_s3(document.s3_key)
            except Exception as e:
                # Log error but continue with deletion
                print(f"Error deleting from S3: {e}")
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Generate presigned download URL"""
        document = self.get_object()
        
        # Check permissions
        user = request.user
        if not user.is_staff:
            try:
                student = Student.objects.get(user=user)
                # Check if student has access
                if not (
                    (document.cohort == student.cohort and document.is_public) or
                    document.students.filter(id=student.id).exists()
                ):
                    return Response(
                        {'error': 'You do not have permission to download this document'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Student.DoesNotExist:
                return Response(
                    {'error': 'Student profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        if not document.s3_key:
            return Response(
                {'error': 'Document file not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        s3_manager = S3DocumentManager()
        try:
            download_url = s3_manager.get_presigned_download_url(
                document.s3_key,
                expires_in=3600,  # 1 hour
                filename=document.file_name
            )
            return Response({
                'download_url': download_url,
                'filename': document.file_name,
                'expires_in': 3600
            })
        except Exception as e:
            return Response(
                {'error': f'Error generating download URL: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    @admin_required
    def get_upload_url(self, request):
        """Generate presigned upload URL for direct S3 upload"""
        serializer = StudentDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        if not data.get('filename') or not data.get('content_type'):
            return Response(
                {'error': 'filename and content_type are required for presigned upload'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        s3_manager = S3DocumentManager()
        
        # Validate file type
        if not s3_manager.validate_file_type(data['filename']):
            return Response(
                {'error': 'Invalid file type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get cohort (optional for program/general scope)
        cohort = None
        if data.get('cohort_id'):
            cohort = get_object_or_404(Cohort, id=data['cohort_id'])
        
        # Generate S3 key and presigned URL
        scope = data.get('scope', 'cohort')
        s3_key = s3_manager.generate_s3_key(cohort, data['filename'], scope=scope)
        
        try:
            upload_data = s3_manager.get_presigned_upload_url(
                s3_key,
                content_type=data['content_type']
            )
            
            return Response({
                'upload_url': upload_data['upload_url'],
                'fields': upload_data['fields'],
                's3_key': upload_data['s3_key'],
                's3_url': upload_data['s3_url']
            })
        except Exception as e:
            return Response(
                {'error': f'Error generating upload URL: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    @admin_required
    def bulk_assign(self, request):
        """Bulk assign/remove documents to/from students"""
        serializer = BulkDocumentAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        documents = StudentDocument.objects.filter(id__in=data['document_ids'])
        students = Student.objects.filter(id__in=data['student_ids'])
        
        if data['action'] == 'assign':
            for document in documents:
                document.students.add(*students)
            message = f"Assigned {documents.count()} documents to {students.count()} students"
        else:
            for document in documents:
                document.students.remove(*students)
            message = f"Removed {documents.count()} documents from {students.count()} students"
        
        return Response({'message': message})
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Student acknowledges reading a document"""
        document = self.get_object()
        
        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already acknowledged
        if StudentDocumentAcknowledgment.objects.filter(
            document=document, student=student
        ).exists():
            return Response(
                {'message': 'Document already acknowledged'},
                status=status.HTTP_200_OK
            )
        
        # Create acknowledgment
        acknowledgment = StudentDocumentAcknowledgment.objects.create(
            document=document,
            student=student,
            ip_address=self.get_client_ip(request),
            signature=request.data.get('signature', '')
        )
        
        serializer = StudentDocumentAcknowledgmentSerializer(acknowledgment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class StudentDocumentAcknowledgmentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing document acknowledgments"""
    queryset = StudentDocumentAcknowledgment.objects.all()
    serializer_class = StudentDocumentAcknowledgmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # If not admin, only show their own acknowledgments
        if not user.is_staff:
            try:
                student = Student.objects.get(user=user)
                queryset = queryset.filter(student=student)
            except Student.DoesNotExist:
                return queryset.none()
        
        # Filter by document if provided
        document_id = self.request.query_params.get('document_id')
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        
        return queryset.order_by('-acknowledged_at')