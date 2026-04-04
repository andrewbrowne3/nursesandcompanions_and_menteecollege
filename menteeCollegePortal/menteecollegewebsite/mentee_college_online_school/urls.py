from django.urls import path
from . import views 
from ..nursesexpressapi import viewscookies

urlpatterns = [
    #path('register/', views.registerUser, name='register'),
    path('login/', views.loginPage, name='login'),
    path('logout/', views.logoutPage, name='logout'),
    path('', views.Homepage, name="Home" ),
    path('enrollment/', views.Application, name="application"),
    path('registration/', views.courseregister, name="registration"),
    path('get_courses_by_program/', views.get_courses_by_program, name='get_courses_by_program'),
    path('Emily_interface', views.EmilyInterface, name="Emily_interface" ),
     path('courses_for_program/<int:program_id>/', views.get_courses_by_program, name='courses_for_program'),
    path('sections_for_course/<int:course_id>/', views.get_course_sections, name='sections_for_course'),
    path('get_programs_for_type/', views.get_programs_for_type, name='get_programs_for_type'),

    #path('get_certificate_courses_sections/', views.get_certificate_course_sections, name='get_certificate_courses'),
    #path('get_diploma_program_course_sections/<str:program_id>/', views.get_diploma_program_course_sections, name='get_diploma_program_course_sections'),
    #path('get_associates_program_course_sections/<str:program_id>/', views.get_associates_program_course_sections, name='get_associates_program_course_sections'),
]
    #path('createuser', views.CreateUser, name="createuser")

