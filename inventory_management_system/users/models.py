from django.db import models
from django.contrib.auth.models import AbstractUser
from core.models import TenantModel

class Role(models.Model):
    ADMIN = 'admin'
    MANAGER = 'manager'
    VIEWER = 'viewer'
    
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (MANAGER, 'Manager'),
        (VIEWER, 'Viewer'),
    ]
    
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.get_name_display()

class User(AbstractUser, TenantModel):
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, related_name='users')
    phone = models.CharField(max_length=15, blank=True)
    
    # Required for AbstractUser
    REQUIRED_FIELDS = ['email', 'tenant_id']

    def __str__(self):
        return f"{self.username} ({self.tenant.name})"

    @property
    def is_admin(self):
        return self.role and self.role.name == Role.ADMIN

    @property
    def is_manager(self):
        return self.role and self.role.name == Role.MANAGER

    @property
    def is_viewer(self):
        return self.role and self.role.name == Role.VIEWER
