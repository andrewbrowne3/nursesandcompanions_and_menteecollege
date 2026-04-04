
from multiprocessing import AuthenticationError
from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect
from .models import User,  Course_section, Course, Course_section,Course
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login, authenticate, logout 
from django.shortcuts import redirect, get_object_or_404
from .decorators import authenticated_user_requirement, allowed_users
from sqlalchemy import create_engine
from django.http import JsonResponse
from django.core import serializers
import json
from django.urls import reverse
from django.shortcuts import render






#engine = 

#this is how to do form responses manually without using django forms/form.is_valid 
def loginPage(request):
    #page = 'login'
    if request.user.is_authenticated:
        return redirect('Home')
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']

        try:
            user = User.object.get() #manually checking if username is in the database
        except:
            print('Username does does not exist') 

        user= authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user) #this is what officially sets the browsers cookies and starts a "session" you can see session_id in the backend, fo in admin panel, inspect page, go to application, go to storage, go to cookies, look for sessionid, django is going to look for that in the database and see if youre logged in. Django uses sessions but you can change this

        else:
            print('Username or password is incorrect')
            
    return render(request, 'Homepage/login_register.html')

def logoutPage(request):
    logout(request) #this method is just going to delete the session id and remove the cookies that are saved for that user. this why if you delete your history all your logged in pages get removed
    return redirect('login')

#def registerUser(request):
 #   form = UserCreationForm()
  #  page = 'register' #set page variable to login in the login view above and variable switches to register variable via a link referencing a url that points to this view triggering the if then statement in the login page
   # context = {'page':page, 'form':form}
    #return render(request, 'Homepage/login_register.html', context)

@authenticated_user_requirement
@allowed_users(allowed_roles = ['Emily_Interface'])
def EmilyInterface(request):
    return render(request, 'Homepage/Emily_interface.html') #show a list of students and the courses they are taking, show the list of courses, show the list of course sections under each course


def Homepage(request):
    title = "Mentee College"
    meta_description = "CNA certification school for Phlebotomy, Medical Billing and Coding, Patient Care, EKG, Ultrasound and all Nurses Aide related training."
    return render(request,'Homepage/index.html', {'title':title })

def Application(request):
    form_diploma = DiplomaApplicationForm()
    form_certificate = CertificateApplicationForm()
    form_associates = AssociatesApplicationForm()

    title = "Mentee College"
    submitted = False

    if request.method == 'POST':
        form_type = request.POST.get('form_type')

        if form_type == 'diploma':
            form_diploma = DiplomaApplicationForm(request.POST)
            if form_diploma.is_valid():
                form_diploma.save()
            else:
                print(f"Application Errors: {form_diploma.errors}")
            return HttpResponseRedirect('?submitted=True')

        elif form_type == 'certificate':
            form_certificate = CertificateApplicationForm(request.POST)
            if form_certificate.is_valid():
                form_certificate.save()
            else:
                print(f"Application Errors: {form_certificate.errors}")
                #for some reason now that I connected the paypal buttons to the system I cannot
            return HttpResponseRedirect('?submitted=True')

        elif form_type == 'associates':
            form_associates = AssociatesApplicationForm(request.POST)
            if form_associates.is_valid():
                form_associates.save()
            else:
                print(f"Application Errors: {form_associates.errors}")
            return HttpResponseRedirect('?submitted=True')

    else:
        form_diploma = DiplomaApplicationForm()
        form_certificate = CertificateApplicationForm()
        form_associates = AssociatesApplicationForm()
        if 'submitted' in request.GET:
            submitted = True
   
    
    context = {
        'form_certificate': form_certificate,
        'form_associates': form_associates,
        'form_diploma': form_diploma,
        'title': title
    }
    return render(request, 'Homepage/form.html', context)

def get_courses_by_program(request):
    selected_program_ids = request.GET.getlist('programs[]')  # Retrieve the program IDs as a list
    print("Selected program IDs:", selected_program_ids)

    # Filter out any empty strings or invalid UUIDs from the program IDs
    selected_program_ids = [program_id for program_id in selected_program_ids if program_id]
    print("Filtered program IDs:", selected_program_ids)

    courses = Course.objects.filter(programs__id__in=selected_program_ids)  # Retrieve the associated courses
    print("Courses:", courses)

    courses_list = [{"id": str(course.id), "name": course.name} for course in courses]  # Convert courses to a list of dictionaries
    print(courses_list)
    return JsonResponse(courses_list, safe=False)

# Create your views here.
"""
def CreateUser(request):
    print(request)
    #form = UserCreationForm()
    title = "UserCreation"
    submitted = False
    if request.method == 'POST':
        form = UserCreationForm(request.POST) 
        if form.is_valid():
            print("Valid")
            form.save()
        else:
            print(f"invalid u bitch. {form.errors}")
        return HttpResponseRedirect('Home')
    else:
        form = UserCreationForm
        if 'submitted' in request.GET:
            submitted = True
    student_list = ["andrew", "kyle", "bitchass"]
    context = {'form':form, 'title': title, 'data':student_list}
    return render(request,'Homepage/form2.html', context)
"""

def get_certificate_course_sections(request, course_id):
    course = get_object_or_404(Course, id=course_id, is_certificate_course=True)
    course_sections = Course_section.objects.filter(course=course)

    data = [{"id": cs.id, "name": cs.name} for cs in course_sections]
    return JsonResponse(data, safe=False)



def get_program_courses(request, program_type, program_id=None):
    if program_type == 'certificate':
        courses = Course.objects.filter(is_certificate_course=True)
    else:
        # Fetch the appropriate model based on the program_type
        if program_type == 'associates':
            program = get_object_or_404(AssociatesProgram, id=program_id)
        elif program_type == 'diploma':
            program = get_object_or_404(DiplomaProgram, id=program_id)
        else:
            return JsonResponse({"error": "Invalid program type."}, status=400)

        courses = Course.objects.filter(programs=program)

    course_data = [{"id": course.id, "name": course.name} for course in courses]
    return JsonResponse(course_data, safe=False)



def get_course_sections(request, course_id):
    # Fetch the course sections for a particular course
    course = get_object_or_404(Course, id=course_id)
    sections = Course_section.objects.filter(course=course)
    section_data = [{"id": section.id, "name": section.name} for section in sections]
    return JsonResponse(section_data, safe=False)

def courseregister(request):
    if request.method == "POST":
        form = EnrollmentForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('success')
    else:
        form = EnrollmentForm()
        associates_programs = AssociatesProgram.objects.all()
        diploma_programs = DiplomaProgram.objects.all()
        certificate_courses = Course.objects.filter(is_certificate_course=True)
    return render(request, 'Homepage/registration.html', {'Enrollment_Form': form, 'associates_programs': associates_programs, 'diploma_programs': diploma_programs, 'certificate_courses': certificate_courses})



def get_programs_for_type(request):
    program_type = request.GET.get('programType', None)
    if program_type == "associates":
        programs = list(AssociatesProgram.objects.values('id', 'name'))
    elif program_type == "diploma":
        programs = list(DiplomaProgram.objects.values('id', 'name'))
    elif program_type == "certificate":
        programs = list(Course.objects.filter(certificate=True).values('id', 'name'))
    else:
        programs = []

    return JsonResponse({'programs': programs}, safe=False)

def get_diploma_program_course_sections(request, program_id):
    program = get_object_or_404(DiplomaProgram, id=program_id)
    courses = program.courses.all()

    course_sections = []
    for course in courses:
        course_sections.extend(list(Course_section.objects.filter(Course=course)))

    data = [{"id": cs.id, "name": cs.Course.name} for cs in course_sections]
    return JsonResponse(data, safe=False)

def get_associates_program_course_sections(request, program_id):
    program = get_object_or_404(AssociatesProgram, id=program_id)
    courses = program.courses.all()

    course_sections = []
    for course in courses:
        course_sections.extend(list(Course_section.objects.filter(Course=course)))

    data = [{"id": cs.id, "name": cs.Course.name} for cs in course_sections]
    return JsonResponse(data, safe=False)