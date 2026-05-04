from rest_framework import serializers
from .models import Category, Product, Warehouse, Stock, StockMovement

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ['tenant']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['tenant']
        extra_kwargs = {
            'sku': {'required': False}
        }

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'
        read_only_fields = ['tenant']

class StockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = Stock
        fields = '__all__'
        read_only_fields = ['tenant']

class StockMovementSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    product_name = serializers.CharField(source='stock.product.name', read_only=True)
    warehouse_name = serializers.CharField(source='stock.warehouse.name', read_only=True)

    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['tenant', 'user']

    def create(self, validated_data):
        # Set current user as the one making the movement
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
