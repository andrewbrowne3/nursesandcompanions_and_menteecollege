# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mentee College Portal is a full-stack healthcare education platform with:
- **Backend**: Django REST API with real-time WebSocket support (Django Channels)
- **Frontend**: React dashboard with Auth0 authentication
- **Database**: SQLite3 (development), PostgreSQL ready (production)
- **Payments**: Stripe integration with PayPal support
- **Storage**: AWS S3 integration for static files

## Common Development Commands

### Backend Development (Django)
```bash
cd menteecollegewebsite
source env/bin/activate  # or env\Scripts\activate on Windows
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
python manage.py test
python manage.py collectstatic
```

### Frontend Development (React)
```bash
cd menteecollegedashboard
npm start         # Development server
npm run build     # Production build
npm test          # Run tests
```

### Environment Setup
- Multiple Python virtual environments: `env/`, `dashboardenv/`, `menteecollegeportalenv/`
- Always activate the appropriate environment before Django operations

## Architecture Overview

### Backend Structure (`menteecollegewebsite/`)
- **Main Django Apps**:
  - `mentee_college_online_school/`: Core application logic, models, views
  - `nursesexpressapi/`: API endpoints and serializers
- **WebSocket Support**: 
  - `consumers2.py`: Real-time chat functionality
  - `routing.py`: WebSocket URL routing
  - Uses Redis channel layer for WebSocket backends

### Frontend Structure (`menteecollegedashboard/`)
- **Redux Store**: Centralized state management in `src/store.js`
- **Authentication**: Auth0 integration with authentication guards
- **Key Components**: Dashboard, CourseManager, LoginButton, CourseListView
- **Routing**: React Router v6 for navigation

### Key Business Models
- **DegreeApplication**: Student applications with program selection
- **Course/Program Models**: Academic catalog management
- **PaymentSchedule**: Payment tracking and Stripe integration
- **ChatGroup/GroupMessage**: Real-time messaging system
- **PageVisit**: Analytics and conversion tracking

### API Patterns
- JWT authentication using SimpleJWT
- RESTful endpoints following Django REST Framework conventions
- CORS enabled for cross-origin requests
- Stripe payment intent creation and validation
- Real-time WebSocket connections for chat functionality

### Database Configuration
- Development: SQLite3 (`db.sqlite3`)
- Production: PostgreSQL configuration available (commented in settings)
- Migration files track schema changes

### Authentication Flow
- Frontend: Auth0 integration with React
- Backend: JWT tokens for API authentication
- WebSocket: Token-based authentication for real-time features

### Payment Processing
- Stripe integration for credit card payments
- PayPal support for alternative payments
- Discount code validation system
- Payment schedule tracking

### Real-time Features
- Django Channels with Redis backend
- WebSocket consumers for chat functionality
- GPT integration for automated assistance
- Guided questionnaire system

## Development Notes

### Environment Variables
Key settings managed through `python-decouple`:
- Database configuration
- AWS S3 credentials
- Stripe API keys
- CORS and security settings

### Static Files
- Django: Collected in `static/` directory
- React: Built assets served from `build/`
- AWS S3 integration for production file storage

### Testing
- Django: Standard Django test framework
- React: Jest and React Testing Library included

### Security Considerations
- CORS configuration for API access
- CSRF protection with trusted origins
- JWT token expiration handling
- SSL/HTTPS ready for production deployment