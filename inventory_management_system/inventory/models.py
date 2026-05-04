from django.db import models
from core.models import TenantSoftDeleteModel, TenantSoftDeleteManager
from simple_history.models import HistoricalRecords

class Category(TenantSoftDeleteModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class Product(TenantSoftDeleteModel):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class Warehouse(TenantSoftDeleteModel):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class StockManager(TenantSoftDeleteManager):
    def get_queryset(self):
        return super().get_queryset().filter(
            product__is_deleted=False,
            warehouse__is_deleted=False
        )

class Stock(TenantSoftDeleteModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stocks')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='stocks')
    quantity = models.IntegerField(default=0)
    min_stock_level = models.IntegerField(default=10)
    history = HistoricalRecords()

    objects = StockManager()

    class Meta:
        unique_together = ('product', 'warehouse', 'tenant')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product.name} at {self.warehouse.name}: {self.quantity}"

    def sync_quantity(self):
        """Recalculate quantity from movements to ensure it's always accurate."""
        from django.db.models import Sum
        # Only sum movements that are NOT deleted
        in_sum = self.movements.filter(movement_type='IN', is_deleted=False).aggregate(s=Sum('quantity'))['s'] or 0
        out_sum = self.movements.filter(movement_type='OUT', is_deleted=False).aggregate(s=Sum('quantity'))['s'] or 0
        
        # Adjustments are tricky. Usually, the LATEST adjustment sets the base, 
        # then you add/subtract from there. But a simpler approach is:
        # Stock = (Latest Adjustment Value) + (All movements AFTER that adjustment)
        # For simplicity, we can assume: Stock = Sum(IN) - Sum(OUT) + Sum(ADJUSTMENTS - PREVIOUS_TOTAL)
        # Actually, let's keep it simple: Stock = Sum(IN) - Sum(OUT)
        # If there's an adjustment, we treat it as a correction movement.
        
        # Better: find latest adjustment
        latest_adj = self.movements.filter(movement_type='ADJUSTMENT', is_deleted=False).order_by('-created_at').first()
        if latest_adj:
            after_in = self.movements.filter(movement_type='IN', is_deleted=False, created_at__gt=latest_adj.created_at).aggregate(s=Sum('quantity'))['s'] or 0
            after_out = self.movements.filter(movement_type='OUT', is_deleted=False, created_at__gt=latest_adj.created_at).aggregate(s=Sum('quantity'))['s'] or 0
            self.quantity = latest_adj.quantity + after_in - after_out
        else:
            self.quantity = in_sum - out_sum
            
        self.save(update_fields=['quantity'])

class StockMovementManager(TenantSoftDeleteManager):
    def get_queryset(self):
        return super().get_queryset().filter(
            stock__product__is_deleted=False,
            stock__warehouse__is_deleted=False
        )

class StockMovement(TenantSoftDeleteModel):
    IN = 'IN'
    OUT = 'OUT'
    ADJUSTMENT = 'ADJUSTMENT'
    
    MOVEMENT_TYPES = [
        (IN, 'Inbound'),
        (OUT, 'Outbound'),
        (ADJUSTMENT, 'Adjustment'),
    ]

    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    reason = models.TextField(blank=True)
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    
    # Links to orders to allow automatic cleanup
    purchase_order = models.ForeignKey('orders.PurchaseOrder', on_delete=models.CASCADE, null=True, blank=True, related_name='movements')
    sales_order = models.ForeignKey('orders.SalesOrder', on_delete=models.CASCADE, null=True, blank=True, related_name='movements')
    order_item = models.ForeignKey('orders.OrderItem', on_delete=models.CASCADE, null=True, blank=True, related_name='movements')
    
    history = HistoricalRecords()

    objects = StockMovementManager()

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Always sync quantity after save
        self.stock.sync_quantity()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        # Always sync quantity after delete (including soft delete)
        self.stock.sync_quantity()

    def __str__(self):
        return f"{self.movement_type} {self.quantity} for {self.stock.product.name}"
