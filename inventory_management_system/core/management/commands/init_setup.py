from django.core.management.base import BaseCommand
from django.db import transaction
from tenants.models import Tenant
from users.models import User, Role

class Command(BaseCommand):
    help = 'Initializes a tenant, roles, and an admin user. Can be run multiple times to add more tenants.'

    def add_arguments(self, parser):
        parser.add_argument('--tenant', type=str, default='Default Corp', help='Name of the tenant')
        parser.add_argument('--subdomain', type=str, default='default', help='Subdomain for the tenant')
        parser.add_argument('--username', type=str, default='admin', help='Admin username for this tenant')
        parser.add_argument('--password', type=str, default='admin123', help='Admin password for this tenant')
        parser.add_argument('--email', type=str, default='admin@example.com', help='Admin email for this tenant')

    @transaction.atomic
    def handle(self, *args, **options):
        tenant_name = options['tenant']
        subdomain = options['subdomain']
        admin_username = options['username']
        admin_password = options['password']
        admin_email = options['email']

        self.stdout.write(f"Starting setup for tenant: {tenant_name}...")

        # 1. Create Roles (Global)
        roles = [Role.ADMIN, Role.MANAGER, Role.VIEWER]
        for role_name in roles:
            Role.objects.get_or_create(name=role_name)

        # 2. Create the Tenant
        tenant, created = Tenant.objects.get_or_create(
            subdomain=subdomain,
            defaults={'name': tenant_name}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Tenant "{tenant_name}" created with subdomain "{subdomain}".'))
        else:
            self.stdout.write(f'Tenant with subdomain "{subdomain}" already exists.')

        # 3. Create the Admin User for this Tenant
        if not User.objects.filter(username=admin_username, tenant=tenant).exists():
            admin_role = Role.objects.get(name=Role.ADMIN)
            User.objects.create_user(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                tenant=tenant,
                role=admin_role,
                is_staff=True
            )
            self.stdout.write(self.style.SUCCESS(f'Admin user "{admin_username}" created for "{tenant_name}".'))
        else:
            self.stdout.write(f'Admin user "{admin_username}" already exists for this tenant.')

        self.stdout.write(self.style.SUCCESS(f"Setup complete for {tenant_name}!"))
