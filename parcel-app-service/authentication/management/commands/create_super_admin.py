from django.core.management.base import BaseCommand
from django.conf import settings
from authentication.models import AdminUser

class Command(BaseCommand):
    help = 'Create initial super admin user'
    
    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Super admin email')
        parser.add_argument('--password', type=str, help='Super admin password')
    
    def handle(self, *args, **options):
        email = options.get('email') or settings.DEFAULT_SUPER_ADMIN_EMAIL
        password = options.get('password') or settings.DEFAULT_SUPER_ADMIN_PASSWORD
        
        if not email or not password:
            self.stderr.write('Error: Email and password are required')
            return
        
        if AdminUser.objects.filter(email=email).exists():
            self.stdout.write(f'Super admin {email} already exists')
        else:
            admin = AdminUser.create_super_admin(
                email=email,
                password=password,
                first_name="Super",
                last_name="Admin"
            )
            self.stdout.write(self.style.SUCCESS(
                f'Super admin {email} created successfully'
            ))