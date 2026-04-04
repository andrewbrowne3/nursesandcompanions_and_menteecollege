from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Make a user an admin/superuser'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to make admin')

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
            user.is_staff = True
            user.is_superuser = True
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully made "{username}" an admin user')
            )
        except User.DoesNotExist:
            # Create the user if they don't exist
            user = User.objects.create_user(
                username=username,
                email=f'{username}@menteecollege.com',
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(
                self.style.SUCCESS(f'Created and made "{username}" an admin user')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error making "{username}" admin: {str(e)}')
            )