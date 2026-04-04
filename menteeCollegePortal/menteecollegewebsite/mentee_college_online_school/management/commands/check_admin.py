from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Check if a user has admin privileges'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to check')

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
            
            self.stdout.write(f'User: {user.username}')
            self.stdout.write(f'Email: {user.email}')
            self.stdout.write(f'is_staff: {user.is_staff}')
            self.stdout.write(f'is_superuser: {user.is_superuser}')
            self.stdout.write(f'is_active: {user.is_active}')
            
            if user.is_staff:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ {username} has admin privileges')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'✗ {username} does NOT have admin privileges')
                )
                
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User "{username}" does not exist')
            )