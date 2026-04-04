"""
Script to create initial organizations for the calendar application.
Run with:
python manage.py shell < create_organizations.py
"""

from mentee_college_online_school.models import Organization, CalendarCategory

def create_organizations():
    # List of organizations to create
    organizations = [
        {
            'name': 'MenteeCollege',
            'description': 'Mentee College Organization'
        },
        {
            'name': 'NursesAndCompanions',
            'description': 'Nurses And Companions Organization'
        }
    ]
    
    created_count = 0
    for org_data in organizations:
        org, created = Organization.objects.get_or_create(
            name=org_data['name'],
            defaults={'description': org_data['description']}
        )
        
        if created:
            created_count += 1
            print(f'Created organization: {org.name}')
        else:
            print(f'Organization already exists: {org.name}')
            
        # Create default categories for each organization
        categories = [
            {'name': 'Academic', 'color': '#3788d8'},
            {'name': 'Financial', 'color': '#28a745'},
            {'name': 'Exams', 'color': '#dc3545'},
            {'name': 'Recruiting', 'color': '#6610f2'},
            {'name': 'General', 'color': '#ffc107'}
        ]
        
        cat_count = 0
        for cat_data in categories:
            cat, cat_created = CalendarCategory.objects.get_or_create(
                organization=org,
                name=cat_data['name'],
                defaults={'color': cat_data['color']}
            )
            
            if cat_created:
                cat_count += 1
                print(f'Created category: {cat.name} for {org.name}')
        
        print(f'Created {cat_count} categories for {org.name}')
    
    print(f'Created {created_count} organizations total')

# Run the function when script is executed
create_organizations() 