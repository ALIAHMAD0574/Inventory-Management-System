from django.db import models
from django.utils import timezone
import threading

_thread_locals = threading.local()

def get_current_tenant():
    return getattr(_thread_locals, 'tenant', None)

def set_current_tenant(tenant):
    _thread_locals.tenant = tenant

class TenantManager(models.Manager):
    def get_queryset(self):
        tenant = get_current_tenant()
        queryset = super().get_queryset()
        if tenant:
            return queryset.filter(tenant=tenant)
        return queryset

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class TenantSoftDeleteManager(TenantManager, SoftDeleteManager):
    def get_queryset(self):
        tenant = get_current_tenant()
        queryset = super(TenantManager, self).get_queryset().filter(is_deleted=False)
        if tenant:
            return queryset.filter(tenant=tenant)
        return queryset

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def hard_delete(self):
        super().delete()

    class Meta:
        abstract = True

class TenantModel(BaseModel):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name="%(class)ss")
    
    objects = TenantManager()

    class Meta:
        abstract = True

class TenantSoftDeleteModel(TenantModel, SoftDeleteModel):
    objects = TenantSoftDeleteManager()

    class Meta:
        abstract = True
