from .models import  Course, Enrollment
from django import forms


"""class DiplomaApplicationForm(forms.ModelForm):
    class Meta: 
        model = DiplomaApplication
        fields = fields = ['diploma_program','first_name', 'last_name', 'phone_number','email','DOB', 'home_address', 'city', 'degrees_held', 
                  'how_did_you_hear_about_us', 'gender', 'medical_background', 
                  'interest', 'disability_or_ailment', 'signature']
class CertificateApplicationForm(forms.ModelForm):
    Certificate = forms.ModelChoiceField(queryset=Course.objects.filter(is_certificate_course=True))

    class Meta:
        model = CertificateApplication
        fields = [ 'Certificate','first_name', 'last_name', 'phone_number','email','DOB', 'home_address', 'city', 'degrees_held', 
                  'how_did_you_hear_about_us', 'gender', 'medical_background', 
                  'interest', 'disability_or_ailment', 'signature']

class AssociatesApplicationForm(forms.ModelForm):
    class Meta:
        model = AssociatesApplication
        fields = ['associates_program','first_name', 'last_name', 'phone_number','email','DOB', 'home_address', 'city', 'degrees_held', 
                  'how_did_you_hear_about_us', 'gender', 'medical_background', 
                  'interest', 'disability_or_ailment', 'signature']

class EnrollmentForm(forms.ModelForm):
    

    class Meta:
        model = Enrollment
        fields = ['course_section', 'year', 'semester']"""
