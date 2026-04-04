from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone
from django import forms
from .models import *
from .s3_utils import S3DocumentManager


class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'CRN','id',)  # Add other fields as needed

class PageVisitAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'page_path', 'ip_address', 'city','region', 'country', 'time_spent', 'timestamp','longitude','latitude','referrer_url')
    list_filter = ('country', 'region', 'timestamp')  # Filter by country, region, and timestamp
    search_fields = ('session_id', 'ip_address', 'page_path', 'city')  # Enable search
    ordering = ('-timestamp',)  # Order by most recent visits
    date_hierarchy = 'timestamp'  # Enable date drill-down

class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'organization', 'category', 'event_type', 'start_datetime', 'end_datetime', 'status', 'priority')
    list_filter = ('organization', 'category', 'event_type', 'status', 'priority', 'is_recurring')
    search_fields = ('title', 'description', 'location')
    date_hierarchy = 'start_datetime'
    ordering = ('-start_datetime',)

class EventAttendeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'response_status', 'is_organizer')
    list_filter = ('response_status', 'is_organizer')
    search_fields = ('user__username', 'event__title')

class EventReminderAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'remind_at', 'reminder_method', 'reminder_sent')
    list_filter = ('reminder_method', 'reminder_sent')
    search_fields = ('event__title', 'user__username')
    date_hierarchy = 'remind_at'

class CalendarCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'color')
    list_filter = ('organization',)
    search_fields = ('name', 'description')

class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name', 'description')

class EventAttachmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'event', 'uploaded_by', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('title', 'event__title')
    date_hierarchy = 'uploaded_at'

# Register existing models
admin.site.register(PageVisit, PageVisitAdmin)
admin.site.register(Course, CourseAdmin)
# Register your models here.
#admin.site.register(DiplomaApplication)
admin.site.register(Student)
admin.site.register(ChatGroup)
admin.site.register(GroupMessage)
admin.site.register(Lecturer)
admin.site.register(DiscountCode)
admin.site.register(Address)
admin.site.register(Payment_method)
admin.site.register(Course_Schedule)
admin.site.register(Course_section)
admin.site.register(DiplomaApplication)
admin.site.register(CertificateApplication)
admin.site.register(AssociatesApplication)
#admin.site.register(CertificateApplication)
#admin.site.register(AssociatesApplication)
admin.site.register(AssociatesProgram)
admin.site.register(DiplomaProgram)
admin.site.register(CertificateProgram)
admin.site.register(PaymentSchedule)
admin.site.register(Payment)

# Register calendar models
admin.site.register(Organization, OrganizationAdmin)
admin.site.register(CalendarCategory, CalendarCategoryAdmin)
admin.site.register(CalendarEvent, CalendarEventAdmin)
admin.site.register(EventAttendee, EventAttendeeAdmin)
admin.site.register(EventReminder, EventReminderAdmin)
admin.site.register(EventAttachment, EventAttachmentAdmin)

# Cohort and Document Management Admin Classes
class CohortForm(forms.ModelForm):    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        current_year = timezone.now().year
        
        # Generate some suggested academic years
        suggestions = []
        for i in range(-1, 4):  # Last year to 3 years ahead
            year = current_year + i
            suggestions.append(f"{year}-{year + 1}")
        
        self.fields['academic_year'].help_text = (
            f"Enter academic year range (e.g., 2024-2025). "
            f"Common options: {', '.join(suggestions)}"
        )
    
    academic_year = forms.CharField(
        max_length=9,
        label="Academic Year Range",
        widget=forms.TextInput(attrs={
            'placeholder': '2024-2025',
            'pattern': '\\d{4}-\\d{4}',
            'title': 'Enter year range in format: 2024-2025',
            'style': 'width: 150px; font-family: monospace;'
        })
    )
    
    class Meta:
        model = Cohort
        fields = '__all__'
    
    def clean_academic_year(self):
        academic_year = self.cleaned_data['academic_year']
        
        # Validate format
        if not academic_year:
            raise forms.ValidationError("Academic year is required.")
        
        # Check if it matches the expected format
        parts = academic_year.split('-')
        if len(parts) != 2:
            raise forms.ValidationError("Academic year must be in format: 2024-2025")
        
        try:
            start_year = int(parts[0])
            end_year = int(parts[1])
        except ValueError:
            raise forms.ValidationError("Both parts must be valid years (e.g., 2024-2025)")
        
        # Validate that end year is start year + 1
        if end_year != start_year + 1:
            raise forms.ValidationError("End year must be exactly one year after start year (e.g., 2024-2025)")
        
        # Validate reasonable year range
        current_year = timezone.now().year
        if start_year < 2020 or start_year > current_year + 10:
            raise forms.ValidationError(f"Start year should be between 2020 and {current_year + 10}")
        
        return academic_year
class CohortAdmin(admin.ModelAdmin):
    form = CohortForm
    list_display = ('academic_year', 'cohort_number', 'program_type', 'get_program_name', 'start_date', 'is_active', 'student_count')
    list_filter = ('program_type', 'is_active', 'start_date')  # Temporarily remove academic_year from filter
    search_fields = ('academic_year', 'cohort_number')  # Simplified search fields
    ordering = ('academic_year', 'cohort_number')  # Changed to ascending order
    date_hierarchy = 'start_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('academic_year', 'cohort_number', 'program_type', 'is_active')
        }),
        ('Program Assignment', {
            'fields': ('certificate_program', 'diploma_program', 'associates_program'),
            'description': 'Select the appropriate program based on the program type'
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        }),
    )
    
    def get_program_name(self, obj):
        return obj.get_program_name()
    get_program_name.short_description = 'Program'
    
    def student_count(self, obj):
        return obj.students.count()
    student_count.short_description = 'Students'
    
    def save_model(self, request, obj, form, change):
        # Ensure only one program is set based on program_type
        if obj.program_type == 'certificate':
            obj.diploma_program = None
            obj.associates_program = None
        elif obj.program_type == 'diploma':
            obj.certificate_program = None
            obj.associates_program = None
        elif obj.program_type == 'associates':
            obj.certificate_program = None
            obj.diploma_program = None
        super().save_model(request, obj, form, change)


class DocumentCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'document_count')
    search_fields = ('name', 'description')
    ordering = ('name',)
    
    def document_count(self, obj):
        return obj.documents.count()
    document_count.short_description = 'Documents'


class StudentDocumentAcknowledgmentInline(admin.TabularInline):
    model = StudentDocumentAcknowledgment
    extra = 0
    readonly_fields = ('student', 'acknowledged_at', 'ip_address', 'signature')
    can_delete = False


class StudentDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'scope', 'cohort', 'category', 'file_type', 'file_size_mb', 'uploaded_by', 
                   'uploaded_at', 'is_mandatory', 'download_link')
    list_filter = ('scope', 'cohort__academic_year', 'cohort__program_type', 'category', 'is_public', 
                  'is_mandatory', 'requires_signature', 'file_type')
    search_fields = ('title', 'description', 'file_name', 'cohort__academic_year')
    readonly_fields = ('file_size_mb', 's3_key', 's3_url', 'file_type', 'file_size', 
                      'page_count', 'uploaded_at', 'updated_at', 'download_link_detail')
    date_hierarchy = 'uploaded_at'
    filter_horizontal = ('students',)
    inlines = [StudentDocumentAcknowledgmentInline]
    
    fieldsets = (
        ('Document Information', {
            'fields': ('title', 'description', 'category', 'scope')
        }),
        ('Cohort Assignment', {
            'fields': ('cohort',),
            'description': 'Required for cohort/individual scoped documents'
        }),
        ('File Upload', {
            'fields': ('file',),
            'description': 'Upload file directly here (will auto-populate S3 fields below)'
        }),
        ('S3 Information (Auto-generated)', {
            'fields': ('file_name', 'file_type', 'file_size_mb', 's3_key', 's3_url', 'download_link_detail'),
            'classes': ('collapse',),
        }),
        ('Document Settings', {
            'fields': ('is_public', 'is_mandatory', 'requires_signature', 'valid_until')
        }),
        ('Student Assignment', {
            'fields': ('students',),
            'description': 'Select specific students who should have access (leave empty for all cohort students)'
        }),
        ('Document Processing', {
            'fields': ('extracted_text', 'preview_text', 'page_count'),
            'classes': ('collapse',),
        }),
        ('Metadata', {
            'fields': ('uploaded_by', 'uploaded_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    actions = ['make_mandatory', 'make_optional', 'make_public', 'make_private']
    
    def file_size_mb(self, obj):
        if obj.file_size:
            return f"{obj.file_size / (1024 * 1024):.2f} MB"
        return "N/A"
    file_size_mb.short_description = 'File Size'
    
    def download_link(self, obj):
        if obj.s3_key:
            s3_manager = S3DocumentManager()
            try:
                download_url = s3_manager.get_presigned_download_url(obj.s3_key, filename=obj.file_name)
                return format_html('<a href="{}" target="_blank">📥 Download</a>', download_url)
            except:
                return "Generate link error"
        return "No file"
    download_link.short_description = 'Download'
    
    def download_link_detail(self, obj):
        if obj.s3_key:
            s3_manager = S3DocumentManager()
            try:
                # Generate a temporary download URL
                download_url = s3_manager.get_presigned_download_url(obj.s3_key, filename=obj.file_name)
                return format_html(
                    '<a href="{}" target="_blank" class="button">📥 Download {}</a>',
                    download_url, obj.file_name or 'File'
                )
            except:
                return "Error generating download link"
        return "No file uploaded"
    download_link_detail.short_description = 'Download File'
    
    def save_model(self, request, obj, form, change):
        if not obj.uploaded_by:
            obj.uploaded_by = request.user
        
        # Handle file upload to S3
        if obj.file and hasattr(obj.file, 'file'):
            s3_manager = S3DocumentManager()
            
            # Generate S3 key
            if not obj.s3_key:
                obj.s3_key = s3_manager.generate_s3_key(
                    obj.cohort, 
                    obj.file.name,
                    str(obj.id) if obj.id else None,
                    obj.scope
                )
            
            # Upload to S3 if it's a new file
            if not change or 'file' in form.changed_data:
                try:
                    s3_url = s3_manager.upload_file_to_s3(
                        obj.file.file,
                        obj.s3_key,
                        content_type=obj.file.file.content_type if hasattr(obj.file.file, 'content_type') else None
                    )
                    obj.s3_url = s3_url
                except Exception as e:
                    self.message_user(request, f"Error uploading to S3: {str(e)}", level='ERROR')
        
        super().save_model(request, obj, form, change)
    
    def make_mandatory(self, request, queryset):
        updated = queryset.update(is_mandatory=True)
        self.message_user(request, f"{updated} documents marked as mandatory.")
    make_mandatory.short_description = "Mark selected documents as mandatory"
    
    def make_optional(self, request, queryset):
        updated = queryset.update(is_mandatory=False)
        self.message_user(request, f"{updated} documents marked as optional.")
    make_optional.short_description = "Mark selected documents as optional"
    
    def make_public(self, request, queryset):
        updated = queryset.update(is_public=True)
        self.message_user(request, f"{updated} documents marked as public.")
    make_public.short_description = "Make selected documents public to cohort"
    
    def make_private(self, request, queryset):
        updated = queryset.update(is_public=False)
        self.message_user(request, f"{updated} documents marked as private.")
    make_private.short_description = "Make selected documents private"


class StudentDocumentAcknowledgmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'document', 'acknowledged_at', 'has_signature')
    list_filter = ('acknowledged_at', 'document__cohort__academic_year', 'document__cohort__program_type')
    search_fields = ('student__first_name', 'student__last_name', 'document__title')
    readonly_fields = ('student', 'document', 'acknowledged_at', 'ip_address', 'signature')
    date_hierarchy = 'acknowledged_at'
    
    def has_signature(self, obj):
        return bool(obj.signature)
    has_signature.boolean = True
    has_signature.short_description = 'Signed'


# Update Student Admin to show cohort
class StudentAdminUpdated(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'username', 'cohort', 'on_payment_plan')
    list_filter = ('cohort__academic_year', 'cohort__program_type', 'on_payment_plan')
    search_fields = ('first_name', 'last_name', 'username')
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('user', 'first_name', 'last_name', 'username', 'DOB')
        }),
        ('Academic Information', {
            'fields': ('cohort', 'course_enrollments', 'enrolled_certificate_programs', 
                      'enrolled_diploma_programs', 'enrolled_associates_programs')
        }),
        ('Applications', {
            'fields': ('diploma_applications', 'certificate_applications', 'associates_applications')
        }),
        ('Financial', {
            'fields': ('on_payment_plan',)
        }),
        ('Contact', {
            'fields': ('address',)
        }),
    )

# Register new models
try:
    admin.site.unregister(Cohort)
except admin.sites.NotRegistered:
    pass
admin.site.register(Cohort, CohortAdmin)
admin.site.register(DocumentCategory, DocumentCategoryAdmin)
admin.site.register(StudentDocument, StudentDocumentAdmin)
admin.site.register(StudentDocumentAcknowledgment, StudentDocumentAcknowledgmentAdmin)

# Re-register Student with updated admin
admin.site.unregister(Student)
admin.site.register(Student, StudentAdminUpdated)


# Survey System Admin Configuration

class SurveyQuestionInline(admin.TabularInline):
    model = SurveyQuestion
    extra = 1
    ordering = ['order']
    fields = ('order', 'question_text', 'question_type', 'choices', 'is_required')


class SurveyTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'survey_type', 'days_after_graduation', 'is_active', 'question_count', 'created_at')
    list_filter = ('survey_type', 'is_active', 'days_after_graduation')
    search_fields = ('name', 'description')
    ordering = ('days_after_graduation', 'name')
    inlines = [SurveyQuestionInline]
    
    fieldsets = (
        ('Survey Information', {
            'fields': ('name', 'survey_type', 'description')
        }),
        ('Scheduling', {
            'fields': ('days_after_graduation', 'is_active')
        }),
    )
    
    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = 'Questions'


class SurveyQuestionAdmin(admin.ModelAdmin):
    list_display = ('survey_type', 'order', 'question_text_preview', 'question_type', 'is_required')
    list_filter = ('survey_type', 'question_type', 'is_required')
    search_fields = ('question_text', 'survey_type__name')
    ordering = ('survey_type', 'order')
    
    def question_text_preview(self, obj):
        return obj.question_text[:100] + '...' if len(obj.question_text) > 100 else obj.question_text
    question_text_preview.short_description = 'Question Text'


class SurveyResponseInline(admin.TabularInline):
    model = SurveyResponse
    extra = 0
    readonly_fields = ('question', 'response_text', 'response_json', 'responded_at')
    can_delete = False


class StudentSurveyAdmin(admin.ModelAdmin):
    list_display = ('student', 'survey_type', 'status', 'assigned_date', 'due_date', 'completed_date', 'response_count')
    list_filter = ('status', 'survey_type', 'assigned_date', 'completed_date')
    search_fields = ('student__first_name', 'student__last_name', 'survey_type__name')
    readonly_fields = ('survey_token', 'assigned_date', 'completed_date')
    date_hierarchy = 'assigned_date'
    inlines = [SurveyResponseInline]
    
    fieldsets = (
        ('Survey Assignment', {
            'fields': ('student', 'survey_type', 'status')
        }),
        ('Dates', {
            'fields': ('assigned_date', 'due_date', 'sent_date', 'completed_date')
        }),
        ('Access', {
            'fields': ('survey_token',),
            'classes': ('collapse',)
        }),
    )
    
    def response_count(self, obj):
        return obj.responses.count()
    response_count.short_description = 'Responses'
    
    actions = ['mark_as_sent', 'mark_as_completed', 'extend_due_date']
    
    def mark_as_sent(self, request, queryset):
        updated = queryset.update(status='sent', sent_date=timezone.now())
        self.message_user(request, f"{updated} surveys marked as sent.")
    mark_as_sent.short_description = "Mark selected surveys as sent"
    
    def mark_as_completed(self, request, queryset):
        updated = queryset.update(status='completed', completed_date=timezone.now())
        self.message_user(request, f"{updated} surveys marked as completed.")
    mark_as_completed.short_description = "Mark selected surveys as completed"


class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'survey_type', 'question_preview', 'response_preview', 'responded_at')
    list_filter = ('student_survey__survey_type', 'responded_at', 'question__question_type')
    search_fields = ('student_survey__student__first_name', 'student_survey__student__last_name', 
                    'response_text', 'question__question_text')
    readonly_fields = ('student_survey', 'question', 'responded_at')
    date_hierarchy = 'responded_at'
    
    def student_name(self, obj):
        return f"{obj.student_survey.student.first_name} {obj.student_survey.student.last_name}"
    student_name.short_description = 'Student'
    
    def survey_type(self, obj):
        return obj.student_survey.survey_type.name
    survey_type.short_description = 'Survey'
    
    def question_preview(self, obj):
        return obj.question.question_text[:50] + '...' if len(obj.question.question_text) > 50 else obj.question.question_text
    question_preview.short_description = 'Question'
    
    def response_preview(self, obj):
        if obj.response_text:
            return obj.response_text[:100] + '...' if len(obj.response_text) > 100 else obj.response_text
        elif obj.response_json:
            return str(obj.response_json)[:50] + '...'
        return "No response"
    response_preview.short_description = 'Response'


# Employer Survey Admin Configuration

class EmployerAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'contact_person', 'email', 'phone', 'industry', 'survey_count', 'created_at')
    list_filter = ('industry', 'company_size', 'created_at')
    search_fields = ('company_name', 'contact_person', 'email')
    ordering = ('company_name',)
    
    fieldsets = (
        ('Company Information', {
            'fields': ('company_name', 'contact_person', 'industry', 'company_size')
        }),
        ('Contact Details', {
            'fields': ('email', 'phone', 'address')
        }),
    )
    
    def survey_count(self, obj):
        return obj.surveys.count()
    survey_count.short_description = 'Surveys'


class EmployerSurveyResponseInline(admin.TabularInline):
    model = EmployerSurveyResponse
    extra = 0
    readonly_fields = ('question', 'response_text', 'response_json', 'responded_at')
    can_delete = False


class EmployerSurveyAdmin(admin.ModelAdmin):
    list_display = ('student', 'employer_name', 'survey_type', 'status', 'job_title', 'assigned_date', 'completed_date', 'response_count')
    list_filter = ('status', 'survey_type', 'assigned_date', 'completed_date')
    search_fields = ('student__first_name', 'student__last_name', 'employer__company_name', 'job_title')
    readonly_fields = ('survey_token', 'assigned_date', 'completed_date')
    date_hierarchy = 'assigned_date'
    inlines = [EmployerSurveyResponseInline]
    
    fieldsets = (
        ('Survey Assignment', {
            'fields': ('student', 'employer', 'survey_type', 'status')
        }),
        ('Employment Details', {
            'fields': ('job_title', 'employment_start_date', 'notes')
        }),
        ('Dates', {
            'fields': ('assigned_date', 'due_date', 'sent_date', 'completed_date')
        }),
        ('Access', {
            'fields': ('survey_token',),
            'classes': ('collapse',)
        }),
    )
    
    def employer_name(self, obj):
        return obj.employer.company_name
    employer_name.short_description = 'Employer'
    
    def response_count(self, obj):
        return obj.responses.count()
    response_count.short_description = 'Responses'
    
    actions = ['mark_as_sent', 'mark_as_completed']
    
    def mark_as_sent(self, request, queryset):
        updated = queryset.update(status='sent', sent_date=timezone.now())
        self.message_user(request, f"{updated} employer surveys marked as sent.")
    mark_as_sent.short_description = "Mark selected surveys as sent"
    
    def mark_as_completed(self, request, queryset):
        updated = queryset.update(status='completed', completed_date=timezone.now())
        self.message_user(request, f"{updated} employer surveys marked as completed.")
    mark_as_completed.short_description = "Mark selected surveys as completed"


class EmployerSurveyResponseAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'employer_name', 'survey_type', 'question_preview', 'response_preview', 'responded_at')
    list_filter = ('employer_survey__survey_type', 'responded_at', 'question__question_type')
    search_fields = ('employer_survey__student__first_name', 'employer_survey__student__last_name',
                    'employer_survey__employer__company_name', 'response_text', 'question__question_text')
    readonly_fields = ('employer_survey', 'question', 'responded_at')
    date_hierarchy = 'responded_at'
    
    def student_name(self, obj):
        return f"{obj.employer_survey.student.first_name} {obj.employer_survey.student.last_name}"
    student_name.short_description = 'Student'
    
    def employer_name(self, obj):
        return obj.employer_survey.employer.company_name
    employer_name.short_description = 'Employer'
    
    def survey_type(self, obj):
        return obj.employer_survey.survey_type.name
    survey_type.short_description = 'Survey'
    
    def question_preview(self, obj):
        return obj.question.question_text[:50] + '...' if len(obj.question.question_text) > 50 else obj.question.question_text
    question_preview.short_description = 'Question'
    
    def response_preview(self, obj):
        if obj.response_text:
            return obj.response_text[:100] + '...' if len(obj.response_text) > 100 else obj.response_text
        elif obj.response_json:
            return str(obj.response_json)[:50] + '...'
        return "No response"
    response_preview.short_description = 'Response'


# Register Survey System Models
admin.site.register(SurveyType, SurveyTypeAdmin)
admin.site.register(SurveyQuestion, SurveyQuestionAdmin)
admin.site.register(StudentSurvey, StudentSurveyAdmin)
admin.site.register(SurveyResponse, SurveyResponseAdmin)
admin.site.register(Employer, EmployerAdmin)
admin.site.register(EmployerSurvey, EmployerSurveyAdmin)
admin.site.register(EmployerSurveyResponse, EmployerSurveyResponseAdmin)
