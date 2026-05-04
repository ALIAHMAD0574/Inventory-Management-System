from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, Role
from .serializers import UserSerializer, RoleSerializer
from core.permissions import RoleBasedPermission

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        # Already filtered by TenantManager in the model, but let's be explicit if needed
        return User.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        # Set tenant from the current user
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]
