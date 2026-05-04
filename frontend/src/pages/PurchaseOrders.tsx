import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { inventoryApi } from '../api/inventory';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

const orderItemSchema = z.object({
  product: z.string().or(z.number()),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.string().min(1, 'Unit price is required'),
});

const purchaseOrderSchema = z.object({
  supplier: z.string().min(1, 'Supplier is required').or(z.number()),
  warehouse: z.string().min(1, 'Warehouse is required').or(z.number()),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

type PurchaseOrderForm = z.infer<typeof purchaseOrderSchema>;

const PurchaseOrders: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [page, setPage] = useState(1);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['purchase-orders', page],
    queryFn: () => ordersApi.getPurchaseOrders(page),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => ordersApi.getSuppliers(1),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(1),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => inventoryApi.getProducts(1),
  });

  const orders = ordersData?.results || [];
  const suppliers = suppliersData?.results || [];
  const warehouses = warehousesData?.results || [];
  const products = productsData?.results || [];
  const totalPages = ordersData ? Math.ceil(ordersData.count / 10) : 0;

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PurchaseOrderForm>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: { items: [{ product: '', quantity: 1, unit_price: '' }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');

  const getProductInfo = (productId: string | number) => {
    return Array.isArray(products) ? products.find(p => String(p.id) === String(productId)) : null;
  };

  const createMutation = useMutation({
    mutationFn: ordersApi.createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ordersApi.deletePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Order deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete order');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      ordersApi.updatePurchaseOrder(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Order status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const handleStatusChange = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const onSubmit = (data: PurchaseOrderForm) => {
    const orderData = {
      ...data,
      supplier: data.supplier ? Number(data.supplier) : null,
      warehouse: data.warehouse ? Number(data.warehouse) : null,
      order_number: `PO-${Date.now()}`,
    };
    createMutation.mutate(orderData);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Purchase Orders</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </button>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create Purchase Order"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                {...register('supplier')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select supplier</option>
                {Array.isArray(suppliers) && suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.supplier && <p className="mt-1 text-xs text-red-500">{errors.supplier.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
              <select
                {...register('warehouse')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select warehouse</option>
                {Array.isArray(warehouses) && warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              {errors.warehouse && <p className="mt-1 text-xs text-red-500">{errors.warehouse.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Items</label>
              <button
                type="button"
                onClick={() => append({ product: '', quantity: 1, unit_price: '' })}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                + Add Item
              </button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end border-b pb-2">
                <div className="col-span-5">
                  <select
                    {...register(`items.${index}.product`)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="">Product</option>
                    {Array.isArray(products) && products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    type="number"
                    placeholder="Qty"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    {...register(`items.${index}.unit_price`)}
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                  {watchItems[index]?.product && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Min: Rs.{getProductInfo(watchItems[index].product)?.price || '0'}
                    </p>
                  )}
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            {errors.items && <p className="mt-1 text-xs text-red-500">{errors.items.message}</p>}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Order Details: ${selectedOrder?.order_number}`}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Supplier</p>
              <p className="mt-1 font-semibold text-gray-900">{selectedOrder?.supplier_name}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Warehouse</p>
              <p className="mt-1 font-semibold text-gray-900">{selectedOrder?.warehouse_name}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Date</p>
              <p className="mt-1 font-semibold text-gray-900">
                {selectedOrder?.date ? new Date(selectedOrder.date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Status</p>
              <p className="mt-1 font-semibold">
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  selectedOrder?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                  selectedOrder?.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedOrder?.status}
                </span>
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">Order Items</p>
            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedOrder?.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-gray-900 font-medium">{item.product_name}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-gray-700">Rs. {Number(item.unit_price).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-bold text-gray-900">
                        Rs. {(item.quantity * Number(item.unit_price)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-bold text-gray-900 uppercase tracking-wider">Grand Total</td>
                    <td className="px-4 py-2 text-right font-bold text-primary-600 text-sm">
                      Rs. {Number(selectedOrder?.total_amount).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-gray-500">Loading...</div>
          ) : !Array.isArray(orders) || orders.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">No purchase orders found</div>
          ) : orders.map((order) => (
            <div key={order?.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <button 
                    onClick={() => handleViewDetails(order)}
                    className="text-sm font-bold text-primary-600 hover:underline"
                  >
                    {order?.order_number || 'N/A'}
                  </button>
                  <p className="text-xs text-gray-500 mt-0.5">{order?.supplier_name || 'Unknown'}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <select
                    value={order?.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border-none focus:ring-0 cursor-pointer ${
                      order?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      order?.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                  <p className="text-[10px] text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {order?.date ? new Date(order.date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-gray-500 uppercase tracking-wider text-[10px] font-medium">Total Amount</p>
                  <p className="text-sm font-bold text-gray-900">Rs. {order?.total_amount || '0.00'}</p>
                </div>
                <button 
                  onClick={() => handleDelete(order.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : !Array.isArray(orders) || orders.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">No purchase orders found</td></tr>
              ) : orders.map((order) => (
                <tr key={order?.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                    <button 
                      onClick={() => handleViewDetails(order)}
                      className="text-primary-600 hover:text-primary-800 hover:underline transition-colors"
                    >
                      {order?.order_number || 'N/A'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order?.supplier_name || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order?.warehouse_name || order?.warehouse || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Rs. {order?.total_amount || '0.00'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order?.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border-none focus:ring-0 cursor-pointer ${
                        order?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                        order?.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {order?.date ? new Date(order.date).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleDelete(order.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default PurchaseOrders;
