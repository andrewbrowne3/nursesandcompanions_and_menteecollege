from rest_framework import serializers
from .models import (
    Cohort, DocumentCategory, StudentDocument, 
    StudentDocumentAcknowledgment, Student
)


class DocumentCategorySerializer(serializers.ModelSerializer):
    document_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentCategory
        fields = ['id', 'name', 'description', 'document_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_document_count(self, obj):
        return obj.documents.count()


class CohortSerializer(serializers.ModelSerializer):
    program_name = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cohort
        fields = [
            'id', 'academic_year', 'cohort_number', 'program_type',
            'program_name', 'start_date', 'end_date', 
            'is_active', 'student_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_program_name(self, obj):
        return obj.get_program_name()
    
    def get_student_count(self, obj):
        return obj.students.count()


class StudentDocumentSerializer(serializers.ModelSerializer):
    cohort_details = CohortSerializer(source='cohort', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    acknowledgment_count = serializers.SerializerMethodField()
    scope_display = serializers.CharField(source='get_scope_display', read_only=True)
    assigned_students = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentDocument
        fields = [
            'id', 'title', 'description', 'category', 'category_name',
            'cohort', 'cohort_details', 'scope', 'scope_display', 'file', 'file_name', 'file_type',
            'file_size', 'file_size_mb', 's3_key', 's3_url', 
            'download_url', 'extracted_text', 'preview_text', 'page_count',
            'is_public', 'is_mandatory', 'requires_signature', 
            'uploaded_by', 'uploaded_by_name', 'uploaded_at', 'updated_at',
            'valid_until', 'acknowledgment_count', 'assigned_students'
        ]
        read_only_fields = [
            'id', 'file_name', 'file_type', 'file_size', 's3_key', 
            's3_url', 'extracted_text', 'preview_text', 'page_count',
            'uploaded_by', 'uploaded_at', 'updated_at'
        ]
    
    def get_file_size_mb(self, obj):
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return 0
    
    def get_download_url(self, obj):
        if obj.s3_key:
            # Return the API endpoint for generating presigned download URL
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/documents/{obj.id}/download/')
        return None
    
    def get_acknowledgment_count(self, obj):
        return obj.acknowledgments.count()
    
    def get_assigned_students(self, obj):
        """Get list of assigned students with their names"""
        if obj.scope == 'individual':
            students = obj.students.all()
            student_list = [
                {
                    'id': str(student.id),
                    'username': student.username,
                    'full_name': f"{student.first_name} {student.last_name}".strip() or student.username,
                    'email': student.user.email if student.user else ''
                }
                for student in students
            ]
            # Debug logging
            if student_list:
                print(f"Document '{obj.title}' has {len(student_list)} assigned students: {[s['username'] for s in student_list]}")
            else:
                print(f"Document '{obj.title}' (individual) has NO assigned students!")
            return student_list
        return []


class StudentDocumentUploadSerializer(serializers.Serializer):
    """Serializer for handling file uploads"""
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.UUIDField(required=False, allow_null=True)
    cohort_id = serializers.UUIDField(required=False, allow_null=True)  # Optional for program/general scope
    scope = serializers.ChoiceField(
        choices=['individual', 'cohort', 'program', 'general'],
        default='cohort'
    )
    file = serializers.FileField(required=False)
    filename = serializers.CharField(max_length=255, required=False)
    content_type = serializers.CharField(max_length=100, required=False)
    is_public = serializers.BooleanField(default=True)
    is_mandatory = serializers.BooleanField(default=False)
    requires_signature = serializers.BooleanField(default=False)
    valid_until = serializers.DateTimeField(required=False, allow_null=True)
    student_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True
    )
    student_username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate that cohort_id is provided for cohort/individual scope"""
        scope = data.get('scope', 'cohort')
        cohort_id = data.get('cohort_id')
        
        if scope in ['cohort', 'individual'] and not cohort_id:
            raise serializers.ValidationError(
                "cohort_id is required for cohort and individual scope documents"
            )
        
        return data


class StudentDocumentAcknowledgmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    document_title = serializers.CharField(source='document.title', read_only=True)
    
    class Meta:
        model = StudentDocumentAcknowledgment
        fields = [
            'id', 'document', 'document_title', 'student', 
            'student_name', 'acknowledged_at', 'ip_address', 'signature'
        ]
        read_only_fields = ['id', 'acknowledged_at', 'ip_address']


class BulkDocumentAssignSerializer(serializers.Serializer):
    """Serializer for bulk assigning documents to students"""
    document_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=True
    )
    student_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=True
    )
    action = serializers.ChoiceField(choices=['assign', 'remove'])


class DocumentFilterSerializer(serializers.Serializer):
    """Serializer for document filtering parameters"""
    academic_year = serializers.CharField(required=False)
    cohort_number = serializers.IntegerField(required=False)
    program_type = serializers.ChoiceField(
        choices=[('certificate', 'Certificate'), ('diploma', 'Diploma'), ('associates', 'Associates')],
        required=False
    )
    category_id = serializers.UUIDField(required=False)
    is_mandatory = serializers.BooleanField(required=False)
    is_public = serializers.BooleanField(required=False)
    search = serializers.CharField(required=False, allow_blank=True)