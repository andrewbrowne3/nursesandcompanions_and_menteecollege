from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from datetime import datetime, timedelta
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import (
    Organization,
    CalendarCategory,
    CalendarEvent,
    EventAttendee,
    EventReminder,
    EventAttachment
)

@require_http_methods(["GET"])
def get_calendar_events(request):
    """
    API endpoint to get calendar events based on filters
    """
    # Get query parameters
    organization_id = request.GET.get('organization', None)
    category_id = request.GET.get('category', None)
    priority = request.GET.get('priority', None)
    status = request.GET.get('status', None)
    start_date_str = request.GET.get('start', None)
    end_date_str = request.GET.get('end', None)
    
    # Parse date strings to datetime objects if provided
    start_date = datetime.strptime(start_date_str, '%Y-%m-%d') if start_date_str else None
    end_date = datetime.strptime(end_date_str, '%Y-%m-%d') if end_date_str else None
    
    # Base queryset
    events = CalendarEvent.objects.all()
    
    # Apply filters
    if organization_id:
        events = events.filter(organization_id=organization_id)
    
    if category_id:
        events = events.filter(category_id=category_id)
    
    if priority:
        events = events.filter(priority=priority)
    
    if status:
        events = events.filter(status=status)
    
    if start_date:
        events = events.filter(end_datetime__gte=start_date)
    
    if end_date:
        events = events.filter(start_datetime__lte=end_date)
    
    # Format events for FullCalendar
    calendar_events = []
    for event in events:
        # Get organization and category name
        organization_name = event.organization.name if event.organization else 'N/A'
        category_name = event.category.name if event.category else 'N/A'
        
        # Create event object for FullCalendar
        calendar_event = {
            'id': str(event.id),
            'title': event.title,
            'start': event.start_datetime.isoformat(),
            'end': event.end_datetime.isoformat() if event.end_datetime else None,
            'allDay': event.all_day,
            'extendedProps': {
                'organization': organization_name,
                'category': category_name,
                'location': event.location,
                'event_type': event.event_type,
                'priority': event.priority,
                'status': event.status,
                'description': event.description,
                'is_recurring': event.is_recurring,
                'recurrence_pattern': event.recurrence_pattern if event.is_recurring else None,
            }
        }
        
        # Add some color based on event type or priority
        if event.priority == 'critical':
            calendar_event['backgroundColor'] = '#6610f2'
        elif event.priority == 'high':
            calendar_event['backgroundColor'] = '#dc3545'
        elif event.priority == 'medium':
            calendar_event['backgroundColor'] = '#ffc107'
        elif event.priority == 'low':
            calendar_event['backgroundColor'] = '#28a745'
        
        # Add to the list
        calendar_events.append(calendar_event)
    
    return JsonResponse(calendar_events, safe=False)

@require_http_methods(["GET"])
def get_calendar_categories(request):
    """
    API endpoint to get calendar categories
    """
    organization_id = request.GET.get('organization', None)
    
    # Base queryset
    categories = CalendarCategory.objects.all()
    
    # Apply organization filter if provided
    if organization_id:
        categories = categories.filter(organization_id=organization_id)
    
    # Format categories
    category_list = []
    for category in categories:
        category_list.append({
            'id': str(category.id),
            'name': category.name,
            'organization': category.organization.name,
            'color': category.color
        })
    
    return JsonResponse(category_list, safe=False)

@require_http_methods(["GET"])
def get_organizations(request):
    """
    API endpoint to get organizations
    """
    organizations = Organization.objects.all()
    
    org_list = []
    for org in organizations:
        org_list.append({
            'id': str(org.id),
            'name': org.name,
            'description': org.description
        })
    
    return JsonResponse(org_list, safe=False)

@login_required
@require_http_methods(["POST"])
def create_calendar_event(request):
    """
    API endpoint to create a calendar event
    """
    # Extract form data
    title = request.POST.get('title')
    organization_id = request.POST.get('organization')
    category_id = request.POST.get('category', None)
    start_datetime_str = request.POST.get('start_datetime')
    end_datetime_str = request.POST.get('end_datetime')
    all_day = request.POST.get('all_day', 'false').lower() == 'true'
    location = request.POST.get('location', '')
    event_type = request.POST.get('event_type', 'other')
    priority = request.POST.get('priority', 'medium')
    status = request.POST.get('status', 'planned')
    description = request.POST.get('description', '')
    is_recurring = request.POST.get('is_recurring', 'false').lower() == 'true'
    recurrence_pattern = request.POST.get('recurrence_pattern', '')
    
    # Parse datetime strings
    start_datetime = datetime.strptime(start_datetime_str, '%Y-%m-%dT%H:%M')
    end_datetime = datetime.strptime(end_datetime_str, '%Y-%m-%dT%H:%M') if end_datetime_str else None
    
    # Get related objects
    organization = get_object_or_404(Organization, id=organization_id)
    category = get_object_or_404(CalendarCategory, id=category_id) if category_id else None
    
    # Create the event
    event = CalendarEvent.objects.create(
        title=title,
        organization=organization,
        category=category,
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        all_day=all_day,
        location=location,
        event_type=event_type,
        priority=priority,
        status=status,
        description=description,
        is_recurring=is_recurring,
        recurrence_pattern=recurrence_pattern,
        created_by=request.user
    )
    
    # Return the created event
    return JsonResponse({
        'id': str(event.id),
        'title': event.title,
        'message': 'Event created successfully'
    })

@login_required
@require_http_methods(["POST"])
def update_calendar_event(request, event_id):
    """
    API endpoint to update a calendar event
    """
    event = get_object_or_404(CalendarEvent, id=event_id)
    
    # Extract form data
    title = request.POST.get('title', event.title)
    organization_id = request.POST.get('organization', None)
    category_id = request.POST.get('category', None)
    start_datetime_str = request.POST.get('start_datetime', None)
    end_datetime_str = request.POST.get('end_datetime', None)
    all_day = request.POST.get('all_day', str(event.all_day)).lower() == 'true'
    location = request.POST.get('location', event.location)
    event_type = request.POST.get('event_type', event.event_type)
    priority = request.POST.get('priority', event.priority)
    status = request.POST.get('status', event.status)
    description = request.POST.get('description', event.description)
    is_recurring = request.POST.get('is_recurring', str(event.is_recurring)).lower() == 'true'
    recurrence_pattern = request.POST.get('recurrence_pattern', event.recurrence_pattern)
    
    # Update related objects if provided
    if organization_id:
        event.organization = get_object_or_404(Organization, id=organization_id)
    
    if category_id:
        event.category = get_object_or_404(CalendarCategory, id=category_id)
    
    # Parse datetime strings if provided
    if start_datetime_str:
        event.start_datetime = datetime.strptime(start_datetime_str, '%Y-%m-%dT%H:%M')
    
    if end_datetime_str:
        event.end_datetime = datetime.strptime(end_datetime_str, '%Y-%m-%dT%H:%M')
    
    # Update other fields
    event.title = title
    event.all_day = all_day
    event.location = location
    event.event_type = event_type
    event.priority = priority
    event.status = status
    event.description = description
    event.is_recurring = is_recurring
    event.recurrence_pattern = recurrence_pattern
    
    # Save the event
    event.save()
    
    # Return success message
    return JsonResponse({
        'id': str(event.id),
        'message': 'Event updated successfully'
    })

@login_required
@require_http_methods(["POST"])
def delete_calendar_event(request, event_id):
    """
    API endpoint to delete a calendar event
    """
    event = get_object_or_404(CalendarEvent, id=event_id)
    
    # Delete the event
    event.delete()
    
    # Return success message
    return JsonResponse({
        'message': 'Event deleted successfully'
    }) 