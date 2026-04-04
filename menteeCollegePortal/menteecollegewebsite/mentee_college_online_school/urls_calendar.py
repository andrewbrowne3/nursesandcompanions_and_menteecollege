from django.urls import path
from . import views_calendar

urlpatterns = [
    # Read endpoints
    path('api/calendar-events/', views_calendar.get_calendar_events, name='get_calendar_events'),
    path('api/calendar-categories/', views_calendar.get_calendar_categories, name='get_calendar_categories'),
    path('api/organizations/', views_calendar.get_organizations, name='get_organizations'),
    
    # Write endpoints (login required)
    path('api/calendar-events/create/', views_calendar.create_calendar_event, name='create_calendar_event'),
    path('api/calendar-events/update/<uuid:event_id>/', views_calendar.update_calendar_event, name='update_calendar_event'),
    path('api/calendar-events/delete/<uuid:event_id>/', views_calendar.delete_calendar_event, name='delete_calendar_event'),
] 