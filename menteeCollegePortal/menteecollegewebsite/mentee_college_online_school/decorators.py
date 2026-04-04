from django.http import HttpResponse
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework import status
from functools import wraps

def authenticated_user_requirement(view_func):
    def wrapper_func(request, *args, **kwargs):
        if request.user.is_authenticated:
            return view_func(request, *args, **kwargs)
        else:
            return HttpResponse('Please sign in to view this page')
    
    return wrapper_func 


def login(view_func):
    def wrapper_func(request, *args, **kwargs):
        if request.user.is_authenticated:
            return HttpResponse('Please sign in to view this page') 
        else:
            return view_func(request, *args, **kwargs)
    
    return wrapper_func 


def allowed_users(allowed_roles=[]):
    def decorator(view_func):
        def wrapper_func(request, *args, **kwargs):
                group = None
                if request.user.groups.exists():
                    group = request.user.groups.all()[0].name

                if group in allowed_roles: 
                    return view_func(request, *args, **kwargs)
                else:
                    return HttpResponse('You are not authorized to view this page')
        return wrapper_func
    return decorator


def admin_required(view_func):
    """
    Decorator for API views that require admin/staff privileges
    """
    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin privileges required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return view_func(self, request, *args, **kwargs)
    
    return wrapper 