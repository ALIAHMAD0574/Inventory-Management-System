from rest_framework import permissions

class RoleBasedPermission(permissions.BasePermission):
    """
    Custom permission for Role-Based Access Control.
    - Admin: Full Access
    - Manager: View, Create, Update
    - Viewer: View Only
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_admin:
            return True

        if request.user.is_manager:
            # Managers can do anything except DELETE
            return request.method != 'DELETE'

        if request.user.is_viewer:
            # Viewers can only do safe methods
            return request.method in permissions.SAFE_METHODS

        return False

class IsSameTenant(permissions.BasePermission):
    """
    Ensure the object belongs to the user's tenant.
    This is a secondary check as the Manager already filters by tenant.
    """
    def has_object_permission(self, request, view, obj):
        return obj.tenant == request.user.tenant
