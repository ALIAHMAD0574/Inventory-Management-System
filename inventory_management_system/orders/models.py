from django.db import models
from django.core.exceptions import ValidationError
from core.models import TenantSoftDeleteModel
from simple_history.models import HistoricalRecords

class Contact(TenantSoftDeleteModel):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    history = HistoricalRecords(inherit=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']

class Supplier(Contact):
    def __str__(self):
        return f"Supplier: {self.name}"

class Customer(Contact):
    def __str__(self):
        return f"Customer: {self.name}"

class Order(TenantSoftDeleteModel):
    PENDING = 'PENDING'
    COMPLETED = 'COMPLETED'
    CANCELLED = 'CANCELLED'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (COMPLETED, 'Completed'),
        (CANCELLED, 'Cancelled'),
    ]

    order_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    date = models.DateTimeField(auto_now_add=True)
    warehouse = models.ForeignKey('inventory.Warehouse', on_delete=models.SET_NULL, null=True, related_name='%(class)s_orders')
    history = HistoricalRecords(inherit=True)

    @property
    def total_amount(self):
        return sum(item.quantity * item.unit_price for item in self.items.all())

    def update_stock(self, old_status, new_status):
        from inventory.models import Stock, StockMovement
        
        # Transition TO Completed: Create movements
        if new_status == self.COMPLETED and old_status != self.COMPLETED:
            for item in self.items.all():
                stock, _ = Stock.objects.get_or_create(
                    product=item.product,
                    warehouse=self.warehouse,
                    tenant=self.tenant,
                    defaults={'quantity': 0}
                )
                
                is_purchase = isinstance(self, PurchaseOrder)
                movement_type = StockMovement.IN if is_purchase else StockMovement.OUT
                reason = f"{'Purchase' if is_purchase else 'Sales'} Order {self.order_number}: Completed"
                
                # Create the movement and link it
                StockMovement.objects.create(
                    stock=stock,
                    movement_type=movement_type,
                    quantity=item.quantity,
                    reason=reason,
                    tenant=self.tenant,
                    purchase_order=self if is_purchase else None,
                    sales_order=self if not is_purchase else None,
                    order_item=item
                )
        
        # Transition FROM Completed: Delete the movements created by this order
        elif old_status == self.COMPLETED and new_status != self.COMPLETED:
            # Collect affected stock objects BEFORE deleting movements
            affected_stocks = [m.stock for m in self.movements.all()]
            self.movements.all().delete()
            # Manually trigger sync for each affected stock
            for stock in affected_stocks:
                stock.sync_quantity()

    def delete(self, *args, **kwargs):
        # Collect affected stock objects BEFORE deleting movements
        affected_stocks = [m.stock for m in self.movements.all()]
        self.movements.all().delete()
        super().delete(*args, **kwargs)
        # Manually trigger sync for each affected stock
        for stock in affected_stocks:
            stock.sync_quantity()

    class Meta:
        abstract = True
        ordering = ['-date']

class PurchaseOrder(Order):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_orders')
    
    def __str__(self):
        return f"PO: {self.order_number} from {self.supplier.name}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_status = None
        if not is_new:
            old_status = PurchaseOrder.objects.get(pk=self.pk).status

        super().save(*args, **kwargs)

        if not is_new and self.status != old_status:
            self.update_stock(old_status, self.status)
            # If order is completed, update the purchase price
            if self.status == self.COMPLETED:
                for item in self.items.all():
                    item.product.purchase_price = item.unit_price
                    item.product.save()

class SalesOrder(Order):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='sales_orders')
    
    def __str__(self):
        return f"SO: {self.order_number} to {self.customer.name}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_status = None
        if not is_new:
            old_status = SalesOrder.objects.get(pk=self.pk).status

        super().save(*args, **kwargs)

        if not is_new and self.status != old_status:
            self.update_stock(old_status, self.status)

class OrderItem(TenantSoftDeleteModel):
    product = models.ForeignKey('inventory.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Generic foreign key for PO or SO
    purchase_order = models.ForeignKey(PurchaseOrder, null=True, blank=True, on_delete=models.CASCADE, related_name='items')
    sales_order = models.ForeignKey(SalesOrder, null=True, blank=True, on_delete=models.CASCADE, related_name='items')

    def clean(self):
        super().clean()
        if self.unit_price < self.product.price:
            raise ValidationError(
                f"Unit price for {self.product.name} must be greater than or equal to its base price ({self.product.price})"
            )
        
        if self.sales_order and self.unit_price < self.product.purchase_price:
            raise ValidationError(
                f"Sales unit price for {self.product.name} must be greater than or equal to its purchase price ({self.product.purchase_price})"
            )
        
        # Stock check for Sales Orders
        if self.sales_order:
            from inventory.models import Stock
            # Get the warehouse from the parent sales order
            warehouse = self.sales_order.warehouse
            if warehouse:
                stock = Stock.objects.filter(
                    product=self.product,
                    warehouse=warehouse,
                    tenant=self.tenant
                ).first()
                
                available_qty = stock.quantity if stock else 0
                
                # If we are UPDATING an item that is already COMPLETED, 
                # we need to account for its own quantity which is already subtracted
                if self.pk and self.sales_order.status == self.sales_order.COMPLETED:
                    old_item = OrderItem.objects.get(pk=self.pk)
                    available_qty += old_item.quantity
                
                if self.quantity > available_qty:
                    raise ValidationError({
                        'quantity': f"Insufficient stock for {self.product.name} at {warehouse.name}. "
                                    f"Available: {available_qty}, Requested: {self.quantity}"
                    })

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Collect affected stock objects BEFORE deleting movements
        affected_stocks = [m.stock for m in self.movements.all()]
        # Delete associated movements
        self.movements.all().delete()
        super().delete(*args, **kwargs)
        # Manually trigger sync for each affected stock
        for stock in affected_stocks:
            stock.sync_quantity()

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
