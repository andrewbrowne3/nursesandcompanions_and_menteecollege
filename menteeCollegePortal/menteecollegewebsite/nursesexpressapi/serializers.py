from rest_framework import serializers
from mentee_college_online_school.models import (
    Course, DiplomaApplication, CertificateApplication, AssociatesApplication,
    Student, PaymentSchedule, Enrollment, Application
)
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
import json


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

# Enhanced Course serializer with more detailed validation
class CourseDetailSerializer(serializers.ModelSerializer):
    """
    Detailed Course serializer for CRUD operations with validation.
    """
    class Meta:
        model = Course
        fields = '__all__'
        
    def validate_name(self, value):
        """Validate the course name field"""
        if value not in dict(Course._meta.get_field('name').choices):
            raise serializers.ValidationError(f"Invalid course name. Choose from: {dict(Course._meta.get_field('name').choices).keys()}")
        return value
        
    def validate_credit_hours(self, value):
        """Validate credit hours is positive"""
        if value < 1:
            raise serializers.ValidationError("Credit hours must be at least 1")
        return value
        
    def validate(self, data):
        """Validate the entire data object"""
        # Add any cross-field validations here if needed
        return data

class DiplomaApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiplomaApplication
        fields = '__all__'

class CertificateApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificateApplication
        fields = '__all__'

class AssociatesApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssociatesApplication
        fields = '__all__'


class ApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for the new unified Application model.
    SSN is accepted but NOT saved to database - only included in email.
    """
    ssn = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Application
        fields = '__all__'
        extra_kwargs = {
            # Make LPN/Diploma-only fields optional
            'prerequisite_courses': {'required': False},
            'entrance_exam_status': {'required': False},
            'entrance_exam_date': {'required': False},
            'cna_year_completed': {'required': False},
            'cna_license_number': {'required': False},
            'cna_expiration_date': {'required': False},
        }

    def create(self, validated_data):
        # Remove SSN before saving (it's only for email)
        validated_data.pop('ssn', None)
        return super().create(validated_data)

    def to_internal_value(self, data):
        # Store SSN temporarily for email use
        self._ssn = data.get('ssn', '')
        return super().to_internal_value(data)


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField(read_only=True)
    isAdmin = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id','username','email', 'name', 'isAdmin']
    
    def get_name(self, obj):
        name = obj.first_name
        if name == '':
            name = obj.email

        return name
    
    def get_isAdmin(self, obj):
        return obj.is_staff
    


class UserSerializerWithToken(UserSerializer):
    token = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User 
        fields = ['id','username','email', 'name', 'isAdmin','token']

  
    def get_token(self, obj):
        token = RefreshToken.for_user(obj)
        return str(token.access_token)
    
class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = '__all__'



class StudentSerializer(serializers.ModelSerializer):
    # Define a SerializerMethodField for course enrollments
    course_enrollment_names = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'  # Adjust as needed, including 'course_enrollment_names'

    def get_course_enrollment_names(self, obj):
        """
        This method retrieves course names for each of the student's course enrollments.
        """
        # Retrieve the Course instances associated with this student
        courses = obj.course_enrollments.all()
        # Extract and return the course names
        return [course.name for course in courses]