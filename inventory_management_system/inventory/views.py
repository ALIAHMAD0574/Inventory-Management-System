from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product, Warehouse, Stock, StockMovement
from .serializers import (
    CategorySerializer, ProductSerializer, WarehouseSerializer, 
    StockSerializer, StockMovementSerializer
)
from core.permissions import RoleBasedPermission

class BaseTenantViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    filter_backends = [DjangoFilterBackend]

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

class CategoryViewSet(BaseTenantViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filterset_fields = ['is_active']

class ProductViewSet(BaseTenantViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filterset_fields = ['category', 'is_active']

class WarehouseViewSet(BaseTenantViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    filterset_fields = ['is_active']

class StockViewSet(BaseTenantViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    filterset_fields = ['product', 'warehouse']

class StockMovementViewSet(BaseTenantViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    filterset_fields = ['stock', 'movement_type']
