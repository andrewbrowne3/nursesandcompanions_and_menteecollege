from django.core.management.base import BaseCommand
from mentee_college_online_school.models import Organization

class Command(BaseCommand):
    help = 'Create initial organizations for calendar'

    def handle(self, *args, **options):
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
        
        # Create organizations if they don't exist
        count = 0
        for org_data in organizations:
            org, created = Organization.objects.get_or_create(
                name=org_data['name'],
                defaults={'description': org_data['description']}
            )
            
            if created:
                count += 1
                self.stdout.write(self.style.SUCCESS(f'Created organization: {org.name}'))
            else:
                self.stdout.write(f'Organization already exists: {org.name}')
        
        self.stdout.write(self.style.SUCCESS(f'Created {count} organizations')) 