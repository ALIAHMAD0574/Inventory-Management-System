from rest_framework import serializers
from .models import Supplier, Customer, PurchaseOrder, SalesOrder, OrderItem
from inventory.models import Warehouse

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['tenant']

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['tenant']

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price']

    def validate(self, data):
        product = data.get('product')
        unit_price = data.get('unit_price')
        
        if unit_price < product.price:
            raise serializers.ValidationError(
                f"Unit price for {product.name} must be greater than or equal to its base price ({product.price})"
            )
            
        # Check purchase price for sales orders
        # Note: we need to check if this item belongs to a sales order
        # Since this serializer is nested, we can check the context or the parent serializer
        view = self.context.get('view')
        if view and hasattr(view, 'queryset') and view.queryset.model == SalesOrder:
            if unit_price < product.purchase_price:
                raise serializers.ValidationError(
                    f"Sales unit price for {product.name} must be greater than or equal to its purchase price ({product.purchase_price})"
                )
            
            # Stock availability check
            # We need to find the warehouse from the parent sales order context
            # In a create/update flow, this might be tricky, so we'll look for it in the initial data
            parent_serializer = self.parent.parent if hasattr(self, 'parent') and hasattr(self.parent, 'parent') else None
            warehouse_id = None
            if parent_serializer:
                warehouse_id = parent_serializer.initial_data.get('warehouse')
            
            if warehouse_id:
                from inventory.models import Stock
                stock = Stock.objects.filter(
                    product=product,
                    warehouse_id=warehouse_id,
                    tenant=self.context['request'].user.tenant
                ).first()
                
                available_qty = stock.quantity if stock else 0
                
                # If we're updating an item that's already COMPLETED, add back its quantity
                # But since create() handles the new items, this is mostly for existing orders.
                # Serializer validation happens before save(), so we use what's in DB for stock.
                if self.instance and self.instance.sales_order and self.instance.sales_order.status == SalesOrder.COMPLETED:
                    available_qty += self.instance.quantity
                
                requested_qty = data.get('quantity')
                if requested_qty > available_qty:
                    raise serializers.ValidationError({
                        'quantity': f"Insufficient stock for {product.name}. Available: {available_qty}, Requested: {requested_qty}"
                    })

        return data

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all(), required=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = ['id', 'order_number', 'status', 'date', 'supplier', 'supplier_name', 'warehouse', 'warehouse_name', 'total_amount', 'items']
        read_only_fields = ['tenant']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(purchase_order=purchase_order, tenant=purchase_order.tenant, **item_data)
        
        # If created as COMPLETED, update stock and purchase price
        if purchase_order.status == PurchaseOrder.COMPLETED:
            purchase_order.update_stock(old_status=None, new_status=PurchaseOrder.COMPLETED)
            for item in purchase_order.items.all():
                item.product.purchase_price = item.unit_price
                item.product.save()
            
        return purchase_order

class SalesOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all(), required=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = SalesOrder
        fields = ['id', 'order_number', 'status', 'date', 'customer', 'customer_name', 'warehouse', 'warehouse_name', 'total_amount', 'items']
        read_only_fields = ['tenant']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        sales_order = SalesOrder.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(sales_order=sales_order, tenant=sales_order.tenant, **item_data)
        
        # If created as COMPLETED, update stock
        if sales_order.status == SalesOrder.COMPLETED:
            sales_order.update_stock(old_status=None, new_status=SalesOrder.COMPLETED)
            
        return sales_order
