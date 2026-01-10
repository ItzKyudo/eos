import { useEffect, useState } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import { Filter, CheckCircle, Clock, XCircle, Eye, Package, User, MapPin, Phone } from 'lucide-react';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Use localhost for local development since the new route is not deployed yet
  const API_URL = 'https://eos-server.onrender.com';
  // const API_URL = 'https://eos-server.onrender.com';

  useEffect(() => {
    fetch(`${API_URL}/api/admin/orders`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => { setOrders(data); setLoading(false); })
      .catch(err => console.error(err));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-medium"><CheckCircle size={12} /> Completed</span>;
      case 'pending':
        return <span className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full text-xs font-medium"><Clock size={12} /> Pending</span>;
      default:
        return <span className="flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-medium"><XCircle size={12} /> {status}</span>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Filter size={16} /> Filter Status
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading orders...</td></tr>
              ) : orders.map((order: any) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">#{order.order_id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {order.users?.username || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.order_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    ₱{Number(order.total_amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Order #{selectedOrder.order_id}</h3>
                  <p className="text-xs text-gray-500">{new Date(selectedOrder.order_date).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6">

              {/* Customer & Recipient Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <User size={16} /> Customer Info
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-500">Username:</p>
                    <p className="font-medium text-gray-900">{selectedOrder.users?.username || 'N/A'}</p>
                    <p className="text-gray-500 mt-2">Email:</p>
                    <p className="font-medium text-gray-900">{selectedOrder.users?.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <MapPin size={16} /> Delivery Details
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-500">Recipient:</p>
                    <p className="font-medium text-gray-900">{selectedOrder.recipient_name || 'N/A'}</p>
                    <p className="text-gray-500 mt-2 flex items-center gap-1"><Phone size={12} /> Contact:</p>
                    <p className="font-medium text-gray-900">{selectedOrder.contact_no || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Items Purchased</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.order_items?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {item.items?.image_url && (
                                <img src={item.items.image_url} alt="" className="w-8 h-8 rounded object-cover bg-gray-200" />
                              )}
                              <span className="font-medium text-gray-900">{item.items?.item_name || 'Unknown Item'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-600">₱{Number(item.items?.price || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            ₱{(Number(item.items?.price || 0) * item.quantity).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold text-gray-900">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right">Total Amount:</td>
                        <td className="px-4 py-3 text-right text-blue-600">₱{Number(selectedOrder.total_amount).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageOrders;