# MenteeCollege Calendar System

This document provides an overview of the calendar system implementation for MenteeCollege and NursesAndCompanions.

## Features

- Organization-specific calendars for MenteeCollege and NursesAndCompanions
- Categorization of events (Academic, Financial, Recruiting, etc.)
- Support for different event types (goals, checkpoints, deadlines, meetings, classes, exams)
- Priority levels (low, medium, high, critical)
- Status tracking (planned, in progress, completed, delayed, cancelled)
- Recurring events functionality
- Custom colors and styling
- Filtering by organization, category, priority, and status
- Mobile-responsive design

## Models

The calendar system uses the following Django models:

1. **Organization** - Represents either MenteeCollege or NursesAndCompanions
2. **CalendarCategory** - Event categories with color coding
3. **CalendarEvent** - The main event model with all details
4. **EventAttendee** - Tracks who is attending events
5. **EventReminder** - Set reminders for upcoming events
6. **EventAttachment** - Attach files to events

## Frontend Implementation

The calendar is implemented using:
- HTML/CSS for structure and styling
- FullCalendar.js (v5.10.1) for the calendar functionality
- Bootstrap for responsive layout
- AJAX for API communication

## API Endpoints

The following API endpoints are available:

### Read Endpoints:
- `/api/calendar-events/` - Get calendar events with optional filtering
- `/api/calendar-categories/` - Get all calendar categories
- `/api/organizations/` - Get all organizations

### Write Endpoints (Login Required):
- `/api/calendar-events/create/` - Create a new calendar event
- `/api/calendar-events/update/<uuid:event_id>/` - Update an existing event
- `/api/calendar-events/delete/<uuid:event_id>/` - Delete an event

## Access

The calendar page is accessible at `/calendar.html` but is not included in the main navigation. Users must navigate directly to this URL.

## Setup Instructions

1. Ensure the database migrations are applied:
   ```
   python manage.py migrate
   ```

2. Create initial categories (if needed):
   ```python
   # Example code to create categories
   from mentee_college_online_school.models import Organization, CalendarCategory
   
   mentee_college = Organization.objects.get(name='MenteeCollege')
   
   CalendarCategory.objects.create(
       organization=mentee_college,
       name='Academic',
       color='#3788d8',
       description='Academic events like classes and exams'
   )
   
   CalendarCategory.objects.create(
       organization=mentee_college,
       name='Financial',
       color='#28a745',
       description='Financial deadlines and payment dates'
   )
   ```

3. Access the calendar at: `https://yourdomain.com/calendar.html`

## Future Enhancements

Possible future enhancements include:
- User-specific calendars
- Calendar sharing functionality
- Email notifications for events
- Calendar export (iCal, Google Calendar)
- More detailed recurring event patterns
- Integration with other systems (e.g., course schedules) 