import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory';
import { ArrowLeftRight, Package, Warehouse as WarehouseIcon, AlertCircle } from 'lucide-react';
import Pagination from '../components/Pagination';

const Stock: React.FC = () => {
  const [stockPage, setStockPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);

  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ['stocks', stockPage],
    queryFn: () => inventoryApi.getStock(stockPage),
  });

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['movements', movementPage],
    queryFn: () => inventoryApi.getStockMovements(movementPage),
  });

  const stocks = stocksData?.results || [];
  const movements = movementsData?.results || [];
  const totalStockPages = stocksData ? Math.ceil(stocksData.count / 10) : 0;
  const totalMovementPages = movementsData ? Math.ceil(movementsData.count / 10) : 0;

  return (
    <div className="space-y-8">
      {/* Stock Levels */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Current Stock Levels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stocksLoading ? (
            <div className="col-span-full text-center py-10 text-gray-500">Loading stock levels...</div>
          ) : !Array.isArray(stocks) || stocks.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500">No stock data available</div>
          ) : (
            stocks.map((stock) => (
              <div key={stock?.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Package className="h-4 w-4 mr-1" />
                      {stock?.product_name || 'Unknown Product'}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <WarehouseIcon className="h-4 w-4 mr-1" />
                      {stock?.warehouse_name || 'N/A'}
                    </div>
                  </div>
                  {stock?.quantity <= stock?.min_stock_level && (
                    <div className="bg-red-100 p-2 rounded-full">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{stock?.quantity || 0}</p>
                    <p className="text-xs text-gray-500">Min: {stock?.min_stock_level || 0}</p>
                  </div>
                  <div className={`text-sm font-medium ${
                    stock?.quantity <= stock?.min_stock_level ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {stock?.quantity <= stock?.min_stock_level ? 'Low Stock' : 'In Stock'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <Pagination
          currentPage={stockPage}
          totalPages={totalStockPages}
          onPageChange={setStockPage}
          isLoading={stocksLoading}
        />
      </div>

      {/* Stock Movements */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Stock Movements</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {movementsLoading ? (
              <div className="p-6 text-center text-sm text-gray-500">Loading movements...</div>
            ) : !Array.isArray(movements) || movements.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">No recent movements</div>
            ) : (
              movements.map((movement) => (
                <div key={movement?.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{movement?.product_name || 'Unknown'}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{movement?.warehouse_name || 'N/A'}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      movement?.movement_type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {movement?.movement_type || 'UNKNOWN'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="text-xs space-y-1">
                      <p className="text-gray-500 uppercase tracking-wider text-[10px] font-medium">Date</p>
                      <p className="text-gray-900 font-medium">
                        {movement?.created_at ? new Date(movement.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 uppercase tracking-wider text-[10px] font-medium">Quantity</p>
                      <p className={`text-sm font-bold ${
                        movement?.movement_type === 'IN' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement?.movement_type === 'IN' ? '+' : '-'}{movement?.quantity || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movementsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Loading movements...</td>
                  </tr>
                ) : !Array.isArray(movements) || movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No recent movements</td>
                  </tr>
                ) : (
                  movements.map((movement) => (
                    <tr key={movement?.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement?.created_at ? new Date(movement.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {movement?.product_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement?.warehouse_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          movement?.movement_type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          <ArrowLeftRight className="h-3 w-3 mr-1" />
                          {movement?.movement_type || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {movement?.movement_type === 'IN' ? '+' : '-'}{movement?.quantity || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement?.reference_number || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={movementPage}
            totalPages={totalMovementPages}
            onPageChange={setMovementPage}
            isLoading={movementsLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Stock;
