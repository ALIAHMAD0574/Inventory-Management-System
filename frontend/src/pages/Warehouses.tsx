import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory';
import { Plus, Warehouse as WarehouseIcon, MapPin, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

const warehouseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  is_active: z.boolean(),
});

type WarehouseForm = z.infer<typeof warehouseSchema>;

const Warehouses: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);
  const [page, setPage] = useState(1);

  const { data: warehousesData, isLoading } = useQuery({
    queryKey: ['warehouses', page],
    queryFn: () => inventoryApi.getWarehouses(page),
  });

  const warehouses = warehousesData?.results || [];
  const totalPages = warehousesData ? Math.ceil(warehousesData.count / 10) : 0;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseForm>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: { is_active: true },
  });

  const createMutation = useMutation({
    mutationFn: inventoryApi.createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse created successfully');
      handleCloseModal();
    },
    onError: () => {
      toast.error('Failed to create warehouse');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => inventoryApi.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse updated successfully');
      handleCloseModal();
    },
    onError: () => {
      toast.error('Failed to update warehouse');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inventoryApi.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete warehouse');
    },
  });

  const onSubmit = (data: WarehouseForm) => {
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    reset({
      name: warehouse.name,
      location: warehouse.location,
      is_active: warehouse.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
    reset({
      name: '',
      location: '',
      is_active: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Warehouses</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </button>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Warehouse name"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              {...register('location')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Warehouse location"
            />
            {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location.message}</p>}
          </div>
          <div className="flex items-center">
            <input
              {...register('is_active')}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Active</label>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-10">Loading warehouses...</div>
        ) : !Array.isArray(warehouses) || warehouses.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">No warehouses found</div>
        ) : warehouses.map((warehouse) => (
          <div key={warehouse.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center text-lg font-bold text-gray-900">
                <WarehouseIcon className="h-5 w-5 mr-2 text-primary-600" />
                {warehouse.name}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                warehouse.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {warehouse.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-1" />
              {warehouse.location}
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button 
                onClick={() => handleEdit(warehouse)}
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button 
                onClick={() => handleDelete(warehouse.id)}
                className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Warehouses;
