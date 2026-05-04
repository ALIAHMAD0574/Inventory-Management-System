from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta
from inventory.models import Product, Stock
from orders.models import PurchaseOrder, SalesOrder

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        
        # Basic counts
        total_products = Product.objects.filter(tenant=tenant, is_deleted=False).count()
        total_purchase_orders = PurchaseOrder.objects.filter(tenant=tenant, is_deleted=False).count()
        total_sales_orders = SalesOrder.objects.filter(tenant=tenant, is_deleted=False).count()
        
        # Total stock quantity
        total_stock_quantity = Stock.objects.filter(tenant=tenant, is_deleted=False).aggregate(
            total=Sum('quantity')
        )['total'] or 0
        
        # Low stock alerts
        low_stock_count = Stock.objects.filter(
            tenant=tenant, 
            is_deleted=False,
            quantity__lte=F('min_stock_level')
        ).count()
        
        # Monthly data for the last 6 months
        today = timezone.now()
        months = []
        chart_data = []
        
        for i in range(5, -1, -1):
            start_date = (today - timedelta(days=i*30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i == 0:
                end_date = today
            else:
                end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
            
            month_name = start_date.strftime('%b')
            
            sales_total = SalesOrder.objects.filter(
                tenant=tenant,
                is_deleted=False,
                date__range=(start_date, end_date)
            ).count() # Or use sum of total_amount if preferred, but count is simpler for now
            
            purchase_total = PurchaseOrder.objects.filter(
                tenant=tenant,
                is_deleted=False,
                date__range=(start_date, end_date)
            ).count()
            
            chart_data.append({
                'name': month_name,
                'sales': sales_total,
                'purchase': purchase_total
            })

        # Recent activities
        recent_sales = SalesOrder.objects.filter(tenant=tenant, is_deleted=False).order_by('-date')[:5]
        recent_orders_data = []
        for order in recent_sales:
            recent_orders_data.append({
                'id': f"#SO-{order.id}",
                'entity': order.customer.name if order.customer else "Unknown",
                'amount': float(order.total_amount),
                'status': order.status,
                'date': order.date.strftime('%Y-%m-%d')
            })

        return Response({
            'total_products': total_products,
            'total_purchase_orders': total_purchase_orders,
            'total_sales_orders': total_sales_orders,
            'total_stock_quantity': total_stock_quantity,
            'low_stock_count': low_stock_count,
            'chart_data': chart_data,
            'recent_orders': recent_orders_data
        })
