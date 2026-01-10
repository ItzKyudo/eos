import { useEffect, useState, useCallback, useRef } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import supabase from '../../config/supabase';
import Swal from 'sweetalert2';
import {
    Search,
    Plus,
    Trash2,
    Edit2,
    CheckCircle,
    XCircle,
    Loader,
    Package,
    Upload
} from 'lucide-react';

interface MarketItem {
    item_id: number;
    item_name: string;
    description: string;
    price: number;
    image_url: string;
    stock_quantity: number;
}

interface ItemFormData {
    item_name: string;
    description: string;
    price: string; // Handle as string in input, convert to number on submit
    stock_quantity: string;
    image_url: string;
}

const ManageMarket = () => {
    const [items, setItems] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MarketItem | null>(null);
    const [formData, setFormData] = useState<ItemFormData>({
        item_name: '',
        description: '',
        price: '',
        stock_quantity: '',
        image_url: ''
    });

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const API_URL = 'https://eos-server.onrender.com'; // Make sure this matches your environment

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/market/admin/items`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                setItems(data);
            } else {
                console.error("Fetch failed:", data);
                setItems([]);
            }
        } catch (error) {
            console.error("Network error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('items')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('items').getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));

        } catch (error: any) {
            console.error('Upload Error:', error);
            Swal.fire('Upload Failed', error.message || 'Could not upload image', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    // Filter items based on search
    const filteredItems = items.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (item?: MarketItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                item_name: item.item_name,
                description: item.description,
                price: item.price.toString(),
                stock_quantity: item.stock_quantity.toString(),
                image_url: item.image_url
            });
        } else {
            setEditingItem(null);
            setFormData({
                item_name: '',
                description: '',
                price: '',
                stock_quantity: '',
                image_url: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setIsUploading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.item_name || !formData.price || !formData.stock_quantity) {
            Swal.fire('Error', 'Please fill in all required fields', 'error');
            return;
        }

        const payload = {
            ...formData,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity)
        };

        try {
            const token = localStorage.getItem('token');
            const url = editingItem
                ? `${API_URL}/api/market/items/${editingItem.item_id}`
                : `${API_URL}/api/market/items`;

            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: editingItem ? 'Updated!' : 'Created!',
                    text: `Item has been ${editingItem ? 'updated' : 'added'} successfully.`,
                    timer: 1500,
                    showConfirmButton: false
                });
                handleCloseModal();
                fetchItems();
            } else {
                Swal.fire('Error', data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Network error occurred', 'error');
        }
    };

    const handleDelete = async (itemId: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/market/items/${itemId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    Swal.fire(
                        'Deleted!',
                        'Item has been deleted.',
                        'success'
                    );
                    fetchItems();
                } else {
                    Swal.fire('Error', 'Failed to delete item', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Network error occurred', 'error');
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Market Management</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage store items and inventory</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search items..."
                                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
                        >
                            <Plus size={20} /> Add Item
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Item Details</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-12 text-center text-gray-400 flex justify-center items-center gap-2"><Loader className="animate-spin" /> Loading items...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan={4} className="p-12 text-center text-gray-400">No items found. Click "Add Item" to start.</td></tr>
                            ) : (
                                filteredItems.map(item => (
                                    <tr key={item.item_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50'} />
                                                    ) : (
                                                        <Package className="text-gray-400" size={24} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{item.item_name}</div>
                                                    <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{item.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700">
                                            ₱{item.price.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.stock_quantity === 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    Out of Stock
                                                </span>
                                            ) : item.stock_quantity <= 5 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                    Low: {item.stock_quantity}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    In Stock: {item.stock_quantity}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(item)}
                                                className="text-blue-500 hover:bg-blue-50 p-2 rounded transition-colors"
                                                title="Edit Item"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.item_id)}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                                                title="Delete Item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                {editingItem ? <Edit2 size={20} className="text-blue-600" /> : <Plus size={20} className="text-blue-600" />}
                                {editingItem ? 'Edit Item' : 'Add New Item'}
                            </h3>
                            <button onClick={handleCloseModal}><XCircle size={24} className="text-gray-400 hover:text-gray-600 transition-colors" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g. EOS Premium Chess Set"
                                    value={formData.item_name}
                                    onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                                    placeholder="Brief description of the item..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (₱) <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Quantity <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="0"
                                        value={formData.stock_quantity}
                                        onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Image</label>
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-2">
                                        {/* Hidden File Input */}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="w-full h-12 bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-blue-500 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                        >
                                            {isUploading ? <Loader size={20} className="animate-spin" /> : <Upload size={20} className="group-hover:scale-110 transition-transform" />}
                                            {isUploading ? 'Uploading Image...' : (formData.image_url ? 'Change Image' : 'Upload Image')}
                                        </button>

                                        {formData.image_url && (
                                            <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                                                <div className="h-48 w-full bg-gray-50 flex items-center justify-center">
                                                    <img src={formData.image_url} alt="Preview" className="h-full object-contain" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Invalid+Image+URL'} />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isUploading ? 'Uploading...' : (editingItem ? <><CheckCircle size={18} /> Save Changes</> : <><Plus size={18} /> Create Item</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageMarket;
