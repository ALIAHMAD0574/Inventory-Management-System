| Module          | Resource        | Viewset Type            | Status                          |
|----------------|-----------------|-------------------------|---------------------------------|
| Users          | User            | ModelViewSet            | Full CRUD                       |
| Users          | Role            | ReadOnlyModelViewSet    | Read-Only (system-defined)      |
| Inventory      | Category        | ModelViewSet            | Full CRUD                       |
| Inventory      | Product         | ModelViewSet            | Full CRUD                       |
| Inventory      | Warehouse       | ModelViewSet            | Full CRUD                       |
| Inventory      | Stock           | ModelViewSet            | Full CRUD                       |
| Inventory      | StockMovement   | ModelViewSet            | Full CRUD                       |
| Orders         | Supplier        | ModelViewSet            | Full CRUD                       |
| Orders         | Customer        | ModelViewSet            | Full CRUD                       |
| Orders         | PurchaseOrder   | ModelViewSet            | Full CRUD                       |
| Orders         | SalesOrder      | ModelViewSet            | Full CRUD                       |