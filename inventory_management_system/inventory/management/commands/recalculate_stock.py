from django.core.management.base import BaseCommand
from inventory.models import Stock, StockMovement
from orders.models import PurchaseOrder, SalesOrder
from django.db.models import Sum

class Command(BaseCommand):
    help = 'Recalculates stock quantities based on completed orders'

    def handle(self, *args, **options):
        self.stdout.write("Starting stock recalculation...")
        
        # Reset all stock quantities to 0
        Stock.objects.all().update(quantity=0)
        self.stdout.write("Reset all stock quantities to 0.")

        # Recalculate from Purchase Orders
        completed_pos = PurchaseOrder.objects.filter(status=PurchaseOrder.COMPLETED)
        for po in completed_pos:
            for item in po.items.all():
                stock, _ = Stock.objects.get_or_create(
                    product=item.product,
                    warehouse=po.warehouse,
                    tenant=po.tenant,
                    defaults={'quantity': 0}
                )
                stock.quantity += item.quantity
                stock.save()
        self.stdout.write(f"Processed {completed_pos.count()} completed Purchase Orders.")

        # Recalculate from Sales Orders
        completed_sos = SalesOrder.objects.filter(status=SalesOrder.COMPLETED)
        for so in completed_sos:
            for item in so.items.all():
                stock, _ = Stock.objects.get_or_create(
                    product=item.product,
                    warehouse=so.warehouse,
                    tenant=so.tenant,
                    defaults={'quantity': 0}
                )
                stock.quantity -= item.quantity
                stock.save()
        self.stdout.write(f"Processed {completed_sos.count()} completed Sales Orders.")

        self.stdout.write(self.style.SUCCESS("Stock recalculation completed successfully."))
