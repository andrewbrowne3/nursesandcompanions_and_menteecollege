from datetime import datetime

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User

from .models import (
    CalendarCategory,
    CalendarEvent,
    Organization,
)


@require_http_methods(["GET"])
def get_calendar_events(request):
    """
    API endpoint to get calendar events based on filters
    """
    # Get query parameters
    organization_id = request.GET.get("organization", None)
    category_id = request.GET.get("category", None)
    priority = request.GET.get("priority", None)
    status = request.GET.get("status", None)
    start_date_str = request.GET.get("start", None)
    end_date_str = request.GET.get("end", None)

    # Parse date strings to datetime objects if provided
    start_date = (
        datetime.strptime(start_date_str, "%Y-%m-%d") if start_date_str else None
    )
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d") if end_date_str else None

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
        organization_name = event.organization.name if event.organization else "N/A"
        category_name = event.category.name if event.category else "N/A"

        # Create event object for FullCalendar
        calendar_event = {
            "id": str(event.id),
            "title": event.title,
            "start": event.start_datetime.isoformat(),
            "end": event.end_datetime.isoformat() if event.end_datetime else None,
            "allDay": event.all_day,
            "extendedProps": {
                "organization": organization_name,
                "organizationId": str(event.organization.id) if event.organization else None,
                "category": category_name,
                "categoryId": str(event.category.id) if event.category else None,
                "location": event.location,
                "event_type": event.event_type,
                "priority": event.priority,
                "status": event.status,
                "description": event.description,
                "is_recurring": event.is_recurring,
                "recurrence_pattern": event.recurrence_pattern
                if event.is_recurring
                else None,
            },
        }

        # Add some color based on event type or priority
        if event.priority == "critical":
            calendar_event["backgroundColor"] = "#6610f2"
        elif event.priority == "high":
            calendar_event["backgroundColor"] = "#dc3545"
        elif event.priority == "medium":
            calendar_event["backgroundColor"] = "#ffc107"
        elif event.priority == "low":
            calendar_event["backgroundColor"] = "#28a745"

        # Add to the list
        calendar_events.append(calendar_event)

    return JsonResponse(calendar_events, safe=False)


@require_http_methods(["GET"])
def get_calendar_categories(request):
    """
    API endpoint to get calendar categories
    """
    organization_id = request.GET.get("organization", None)

    # Base queryset
    categories = CalendarCategory.objects.all()

    # Apply organization filter if provided
    if organization_id:
        categories = categories.filter(organization_id=organization_id)

    # Format categories
    category_list = []
    for category in categories:
        category_list.append(
            {
                "id": str(category.id),
                "name": category.name,
                "organization": category.organization.name,
                "organization_id": str(category.organization.id),
                "color": category.color,
            }
        )

    return JsonResponse(category_list, safe=False)


@require_http_methods(["GET"])
def get_organizations(request):
    """
    API endpoint to get organizations
    """
    organizations = Organization.objects.all()

    org_list = []
    for org in organizations:
        org_list.append(
            {"id": str(org.id), "name": org.name, "description": org.description}
        )

    return JsonResponse(org_list, safe=False)


@csrf_exempt
@require_http_methods(["POST"])
def create_calendar_event(request):
    """
    API endpoint to create a calendar event
    """
    try:
        import json
        from django.contrib.auth.models import User
        
        # Check content type to determine how to parse the data
        content_type = request.META.get('CONTENT_TYPE', '').lower()
        
        if 'application/json' in content_type:
            # Parse JSON data
            data = json.loads(request.body)
            title = data.get("title")
            organization_name_or_id = data.get("organization")
            category_id = data.get("category")
            start_datetime_str = data.get("start_datetime")
            end_datetime_str = data.get("end_datetime")
            all_day = data.get("all_day", False)
            location = data.get("location", "")
            event_type = data.get("event_type", "other")
            priority = data.get("priority", "medium")
            status = data.get("status", "planned")
            description = data.get("description", "")
            is_recurring = data.get("is_recurring", False)
            recurrence_pattern = data.get("recurrence_pattern", "")
            created_by_username = data.get("created_by")
            
            # Convert string boolean to actual boolean if necessary
            if isinstance(all_day, str):
                all_day = all_day.lower() == "true"
            if isinstance(is_recurring, str):
                is_recurring = is_recurring.lower() == "true"
        else:
            # Extract form data
            data = request.POST
            title = request.POST.get("title")
            organization_name_or_id = request.POST.get("organization")
            category_id = request.POST.get("category", None)
            start_datetime_str = request.POST.get("start_datetime")
            end_datetime_str = request.POST.get("end_datetime")
            all_day = request.POST.get("all_day", "false").lower() == "true"
            location = request.POST.get("location", "")
            event_type = request.POST.get("event_type", "other")
            priority = request.POST.get("priority", "medium")
            status = request.POST.get("status", "planned")
            description = request.POST.get("description", "")
            is_recurring = request.POST.get("is_recurring", "false").lower() == "true"
            recurrence_pattern = request.POST.get("recurrence_pattern", "")
            created_by_username = request.POST.get("created_by")

        # Parse datetime strings
        start_datetime = datetime.strptime(start_datetime_str, "%Y-%m-%dT%H:%M")
        end_datetime = (
            datetime.strptime(end_datetime_str, "%Y-%m-%dT%H:%M")
            if end_datetime_str
            else None
        )

        # Get organization by name or id
        try:
            # First try to get by ID
            organization = get_object_or_404(Organization, id=organization_name_or_id)
        except Exception:
            # If that fails, try to get by name
            try:
                organization = get_object_or_404(Organization, name=organization_name_or_id)
            except Exception as org_error:
                # If organization doesn't exist, create it
                if isinstance(organization_name_or_id, str) and organization_name_or_id:
                    organization = Organization.objects.create(
                        name=organization_name_or_id,
                        description=f"Auto-created organization for {organization_name_or_id}"
                    )
                else:
                    raise ValueError(f"Invalid organization: {organization_name_or_id}. Error: {str(org_error)}")

        # Get category
        category = None
        if category_id:
            try:
                category = get_object_or_404(CalendarCategory, id=category_id)
            except Exception as cat_error:
                # If it fails, try to get the first category for this organization
                categories = CalendarCategory.objects.filter(organization=organization)
                if categories.exists():
                    category = categories.first()
                else:
                    # Create a default category
                    category = CalendarCategory.objects.create(
                        organization=organization,
                        name="General",
                        color="#3788d8",
                        description="Default category"
                    )
        
        # Try to get the user by username if provided, otherwise use the request.user
        created_by = None
        if created_by_username:
            try:
                created_by = User.objects.get(username=created_by_username)
            except User.DoesNotExist:
                # If user doesn't exist, use request.user as fallback
                created_by = request.user
        else:
            created_by = request.user

        # Create the event
        event = CalendarEvent.objects.create(
            title=title,
            organization=organization,
            category=category,
            start_datetime=start_datetime,
            end_datetime=end_datetime or start_datetime,  # Use start_datetime as fallback
            all_day=all_day,
            location=location,
            event_type=event_type,
            priority=priority,
            status=status,
            description=description,
            is_recurring=is_recurring,
            recurrence_pattern=recurrence_pattern,
            created_by=created_by,
        )

        # Return the created event
        return JsonResponse(
            {
                "id": str(event.id),
                "title": event.title,
                "message": "Event created successfully",
            }
        )
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        
        # Debug response with error details
        content_type = request.META.get('CONTENT_TYPE', '').lower()
        if 'application/json' in content_type:
            try:
                data = json.loads(request.body)
            except:
                data = {"error": "Could not parse JSON data"}
            
            debug_data = {
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": error_traceback,
                "request_data": data,
                "content_type": content_type
            }
        else:
            debug_data = {
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": error_traceback,
                "request_data": {
                    "title": request.POST.get("title"),
                    "organization": request.POST.get("organization"),
                    "category_id": request.POST.get("category"),
                    "start_datetime": request.POST.get("start_datetime"),
                    "end_datetime": request.POST.get("end_datetime"),
                    "all_day": request.POST.get("all_day"),
                    "location": request.POST.get("location"),
                    "event_type": request.POST.get("event_type"),
                    "priority": request.POST.get("priority"),
                    "status": request.POST.get("status"),
                    "is_recurring": request.POST.get("is_recurring"),
                    "recurrence_pattern": request.POST.get("recurrence_pattern"),
                    "created_by": request.POST.get("created_by"),
                },
                "content_type": content_type
            }
        
        print(f"ERROR in create_calendar_event: {debug_data}")
        return JsonResponse({"status": "error", "debug_info": debug_data}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def update_calendar_event(request, event_id):
    """
    API endpoint to update a calendar event
    """
    try:
        import json
        event = get_object_or_404(CalendarEvent, id=event_id)
        
        # Check content type to determine how to parse the data
        content_type = request.META.get('CONTENT_TYPE', '').lower()
        
        if 'application/json' in content_type:
            # Parse JSON data
            data = json.loads(request.body)
            title = data.get("title", event.title)
            organization_id = data.get("organization")
            category_id = data.get("category")
            start_datetime_str = data.get("start_datetime")
            end_datetime_str = data.get("end_datetime")
            all_day = data.get("all_day", event.all_day)
            location = data.get("location", event.location)
            event_type = data.get("event_type", event.event_type)
            priority = data.get("priority", event.priority)
            status = data.get("status", event.status)
            description = data.get("description", event.description)
            is_recurring = data.get("is_recurring", event.is_recurring)
            recurrence_pattern = data.get("recurrence_pattern", event.recurrence_pattern)
            
            # Convert string boolean to actual boolean if necessary
            if isinstance(all_day, str):
                all_day = all_day.lower() == "true"
            if isinstance(is_recurring, str):
                is_recurring = is_recurring.lower() == "true"
        else:
            # Extract form data
            title = request.POST.get("title", event.title)
            organization_id = request.POST.get("organization", None)
            category_id = request.POST.get("category", None)
            start_datetime_str = request.POST.get("start_datetime", None)
            end_datetime_str = request.POST.get("end_datetime", None)
            all_day = request.POST.get("all_day", str(event.all_day)).lower() == "true"
            location = request.POST.get("location", event.location)
            event_type = request.POST.get("event_type", event.event_type)
            priority = request.POST.get("priority", event.priority)
            status = request.POST.get("status", event.status)
            description = request.POST.get("description", event.description)
            is_recurring = (
                request.POST.get("is_recurring", str(event.is_recurring)).lower() == "true"
            )
            recurrence_pattern = request.POST.get(
                "recurrence_pattern", event.recurrence_pattern
            )

        # Update related objects if provided
        if organization_id:
            event.organization = get_object_or_404(Organization, id=organization_id)

        if category_id:
            event.category = get_object_or_404(CalendarCategory, id=category_id)

        # Parse datetime strings if provided
        if start_datetime_str:
            event.start_datetime = datetime.strptime(start_datetime_str, "%Y-%m-%dT%H:%M")

        if end_datetime_str:
            event.end_datetime = datetime.strptime(end_datetime_str, "%Y-%m-%dT%H:%M")

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
        return JsonResponse({"id": str(event.id), "message": "Event updated successfully"})
    except Exception as e:
        # Debug response with error details
        content_type = request.META.get('CONTENT_TYPE', '').lower()
        debug_data = {
            "error": str(e),
            "error_type": type(e).__name__,
            "content_type": content_type
        }
        return JsonResponse({"status": "error", "debug_info": debug_data}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def delete_calendar_event(request, event_id):
    """
    API endpoint to delete a calendar event
    """
    try:
        event = get_object_or_404(CalendarEvent, id=event_id)

        # Delete the event
        event.delete()

        # Return success message
        return JsonResponse({"message": "Event deleted successfully"})
    except Exception as e:
        # Debug response with error details
        debug_data = {
            "error": str(e),
            "error_type": type(e).__name__,
        }
        return JsonResponse({"status": "error", "debug_info": debug_data}, status=400)
