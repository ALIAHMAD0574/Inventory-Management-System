from rest_framework import viewsets, permissions, views, response
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth, TruncYear, Coalesce
from .models import Supplier, Customer, PurchaseOrder, SalesOrder, OrderItem
from .serializers import (
    SupplierSerializer, CustomerSerializer, 
    PurchaseOrderSerializer, SalesOrderSerializer
)
from core.permissions import RoleBasedPermission

class BaseTenantViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

class SupplierViewSet(BaseTenantViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

class CustomerViewSet(BaseTenantViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class PurchaseOrderViewSet(BaseTenantViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer

class SalesOrderViewSet(BaseTenantViewSet):
    queryset = SalesOrder.objects.all()
    serializer_class = SalesOrderSerializer

class AnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'day') # day, week, month, year
        tenant = request.user.tenant

        # Truncate based on period
        trunc_func = {
            'day': TruncDay,
            'week': TruncWeek,
            'month': TruncMonth,
            'year': TruncYear
        }.get(period, TruncDay)

        # Calculate Revenue and Profit/Loss for completed sales orders
        # We use product.purchase_price to calculate COGS
        
        analytics_data = OrderItem.objects.filter(
            sales_order__status='COMPLETED',
            sales_order__is_deleted=False,
            is_deleted=False,
            tenant=tenant
        ).annotate(
            date=trunc_func('sales_order__date'),
            revenue=ExpressionWrapper(F('quantity') * F('unit_price'), output_field=DecimalField()),
            # Use Coalesce to handle cases where purchase_price might be null, default to 0
            cogs=ExpressionWrapper(F('quantity') * Coalesce(F('product__purchase_price'), 0.0, output_field=DecimalField()), output_field=DecimalField()),
        ).annotate(
            profit=ExpressionWrapper(F('revenue') - F('cogs'), output_field=DecimalField())
        ).values('date').annotate(
            total_revenue=Sum('revenue'),
            total_cogs=Sum('cogs'),
            total_profit=Sum('profit')
        ).order_by('date')

        return response.Response(list(analytics_data))
