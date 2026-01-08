import React, { useState, useEffect } from "react";
import Sidebar from '../../components/sidebar';
import { ShoppingCart, X, Minus, Plus, ShoppingBag, CheckCircle, Facebook, Trophy, ArrowRight, Package, Eye } from "lucide-react"; 

interface MarketItem {
    item_id: number;
    item_name: string;
    description: string;
    price: number;
    image_url: string;
    stock_quantity: number;
}

interface CartItem extends MarketItem {
    cartQuantity: number;
}

interface ReceiptData {
    order_id: number;
    receipt_number: string;
    recipient_name: string;
    total: number;
    date: string;
}

const MarketPage: React.FC = () => {
    const [items, setItems] = useState<MarketItem[]>([]);
    
    const [cart, setCart] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('eos_cart');
        return saved ? JSON.parse(saved) : [];
    });

    const [loading, setLoading] = useState<boolean>(true);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    
    // New State for View Details Modal
    const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

    const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]); 
    const [recipientName, setRecipientName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);

    const API_BASE = "http://localhost:3000/api/market";
    const USER_TOKEN = localStorage.getItem('token'); 
    const FB_PAGE_LINK = "https://facebook.com/YOUR_OFFICIAL_PAGE"; 

    useEffect(() => {
        localStorage.setItem('eos_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch(`${API_BASE}/items`);
                const data = await res.json();
                setItems(data);
                setLoading(false);
            } catch (e) { console.error(e); }
        };
        fetchItems();
    }, []);

    const addToCart = (e: React.MouseEvent, item: MarketItem) => {
        e.stopPropagation(); 
        setCart(prev => {
            const existing = prev.find(i => i.item_id === item.item_id);
            if (existing) {
                return prev.map(i => i.item_id === item.item_id 
                    ? { ...i, cartQuantity: Math.min(i.cartQuantity + 1, i.stock_quantity) } 
                    : i);
            }
            return [...prev, { ...item, cartQuantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (itemId: number) => {
        setCart(prev => prev.filter(i => i.item_id !== itemId));
    };

    const updateCartQuantity = (itemId: number, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.item_id === itemId) {
                const newQty = i.cartQuantity + delta;
                return newQty > 0 && newQty <= i.stock_quantity ? { ...i, cartQuantity: newQty } : i;
            }
            return i;
        }));
    };

    const handleBuyNow = (e: React.MouseEvent, item: MarketItem) => {
        e.stopPropagation();
        if (!USER_TOKEN) { alert("Please Login first."); return; }
        setCheckoutItems([{ ...item, cartQuantity: 1 }]);
        setRecipientName(""); 
        setIsCheckoutOpen(true);
    };

    const handleCheckoutCart = () => {
        if (!USER_TOKEN) { alert("Please Login first."); return; }
        if (cart.length === 0) return;
        setCheckoutItems(cart);
        setRecipientName("");
        setIsCartOpen(false);
        setIsCheckoutOpen(true);
    };

    const handlePlaceOrder = async () => {
        if (!recipientName.trim()) { alert("Please enter your name to claim the order."); return; }

        try {
            setIsSubmitting(true);
            const payload = {
                items: checkoutItems.map(i => ({ item_id: i.item_id, quantity: i.cartQuantity })),
                recipient_name: recipientName
            };

            const res = await fetch(`${API_BASE}/place-order`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${USER_TOKEN}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setReceipt(data.receipt);
            setCart([]); 
            localStorage.removeItem('eos_cart'); 
            setIsCheckoutOpen(false);
            
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPayment = checkoutItems.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

    return (
        <div className="flex min-h-screen bg-[#1a1917] text-[#e0e0e0] font-sans overflow-x-hidden">
            <Sidebar />     
            
            <main className="flex-1 flex flex-col p-6 md:p-12 relative">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#2c4dbd]/5 via-transparent to-transparent pointer-events-none" />
                
                <header className="w-full max-w-8xl mx-auto mb-16 flex items-center justify-between relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="h-px w-8 bg-[#e63e3e]" />
                            <span className="text-[#e63e3e] text-xs font-bold tracking-[0.2em] uppercase">Official Store</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tight">
                            EOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2c4dbd] via-[#8c457d] to-[#e63e3e]">MARKET</span>
                        </h1>
                    </div>
                    
                    <button 
                        onClick={() => setIsCartOpen(true)} 
                        className="group relative bg-[#262522] h-14 w-14 rounded-2xl border border-white/5 hover:border-[#e63e3e] flex items-center justify-center transition-all duration-300 shadow-xl hover:shadow-[#e63e3e]/20"
                    >
                        <ShoppingCart className="text-white w-6 h-6 group-hover:scale-110 transition-transform" />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-[#e63e3e] text-white text-[10px] font-bold w-6 h-6 rounded-lg flex items-center justify-center border-2 border-[#1a1917] shadow-lg animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </header>

                <div className="w-full max-w-8xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24 relative z-10">
                    {loading ? (
                        [...Array(8)].map((_, i) => (
                            <div key={i} className="bg-[#262522] aspect-[3/4] rounded-3xl animate-pulse border border-white/5" />
                        ))
                    ) : (
                        items.map((item) => (
                            <div 
                                key={item.item_id} 
                                onClick={() => setSelectedItem(item)}
                                className="group bg-[#262522] rounded-3xl overflow-hidden border border-white/5 hover:border-[#e63e3e]/30 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-2xl flex flex-col h-full cursor-pointer relative"
                            >
                                <div className="absolute top-4 left-4 z-20 flex gap-2">
                                    {item.stock_quantity <= 5 && (
                                        <div className="bg-[#e63e3e]/90 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                            Low Stock
                                        </div>
                                    )}
                                </div>

                                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="bg-black/50 backdrop-blur p-2 rounded-full text-white">
                                        <Eye size={16} />
                                    </div>
                                </div>

                                <div className="aspect-square w-full bg-[#1e1d1b] relative overflow-hidden">
                                    <img 
                                        src={item.image_url} 
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                                        alt={item.item_name} 
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300'; }} 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#262522] via-transparent to-transparent opacity-60" />
                                </div>

                                <div className="p-6 flex flex-col flex-1 relative bg-[#262522]">
                                    <div className="flex-1 mb-6">
                                        <div className="flex justify-between items-start gap-4 mb-2">
                                            <h3 className="text-white font-bold text-lg leading-tight line-clamp-1 h-6 overflow-hidden group-hover:text-[#e63e3e] transition-colors" title={item.item_name}>
                                                {item.item_name}
                                            </h3>
                                        </div>
                                        <p className="text-gray-500 text-xs line-clamp-2 h-8 overflow-hidden leading-relaxed">
                                            {item.description}
                                        </p>
                                        <div className="mt-3">
                                            <span className="text-[#2c4dbd] font-black text-xl whitespace-nowrap">₱{item.price.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-2 mt-auto">
                                        <button 
                                            onClick={(e) => addToCart(e, item)}
                                            className="col-span-2 bg-[#312e2b] text-gray-300 py-3.5 rounded-xl font-bold text-xs hover:bg-white hover:text-black transition-all border border-white/5 uppercase tracking-wide flex items-center justify-center gap-2 group/btn active:scale-95"
                                        >
                                            <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" /> Cart
                                        </button>
                                        <button 
                                            onClick={(e) => handleBuyNow(e, item)}
                                            className="col-span-3 bg-gradient-to-r from-[#2c4dbd] to-[#e63e3e] text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-[#2c4dbd]/20 hover:shadow-[#e63e3e]/40 hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                                        >
                                            Buy Now <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* --- CART DRAWER --- */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
                    <div className="relative bg-[#1a1917] w-full max-w-md h-full flex flex-col border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="p-8 border-b border-white/5 bg-[#21201d] flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                    <ShoppingBag className="text-[#e63e3e]" /> Your Cart
                                </h2>
                                <p className="text-gray-500 text-xs mt-1 font-medium">{cart.length} items selected</p>
                            </div>
                            <button onClick={() => setIsCartOpen(false)} className="bg-[#312e2b] p-2 rounded-lg hover:bg-white hover:text-black transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-6">
                                    <div className="w-24 h-24 bg-[#262522] rounded-full flex items-center justify-center border border-white/5">
                                        <Package size={40} className="opacity-20" />
                                    </div>
                                    <p className="text-sm font-medium uppercase tracking-widest">Your cart is empty</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.item_id} className="group bg-[#262522] p-4 rounded-2xl flex gap-4 border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="w-20 h-20 bg-[#1e1d1b] rounded-xl flex items-center justify-center p-2 overflow-hidden">
                                            <img src={item.image_url} className="w-full h-full object-cover rounded-lg" alt={item.item_name} />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <h3 className="text-white font-bold text-sm line-clamp-1">{item.item_name}</h3>
                                                <p className="text-[#2c4dbd] font-bold text-sm mt-0.5">₱{item.price.toLocaleString()}</p>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <div className="flex items-center bg-[#1a1917] rounded-lg border border-white/5">
                                                    <button onClick={() => updateCartQuantity(item.item_id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#312e2b] rounded-l-lg transition-colors"><Minus size={12}/></button>
                                                    <span className="text-xs font-bold text-white px-2 w-6 text-center">{item.cartQuantity}</span>
                                                    <button onClick={() => updateCartQuantity(item.item_id, 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#312e2b] rounded-r-lg transition-colors"><Plus size={12}/></button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.item_id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-wide bg-red-500/10 px-2 py-1 rounded">Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-8 bg-[#21201d] border-t border-white/5 space-y-4 z-10">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Subtotal</span>
                                    <span className="text-2xl font-black text-white">
                                        ₱{cart.reduce((sum, i) => sum + (i.price * i.cartQuantity), 0).toLocaleString()}
                                    </span>
                                </div>
                                <button 
                                    onClick={handleCheckoutCart}
                                    className="w-full bg-gradient-to-r from-[#2c4dbd] to-[#e63e3e] text-white py-4 rounded-xl font-black text-sm tracking-widest shadow-lg shadow-[#2c4dbd]/20 hover:brightness-110 active:scale-95 transition-all flex justify-center items-center gap-2"
                                >
                                    PROCEED TO CHECKOUT <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- PRODUCT DETAILS MODAL --- */}
            {selectedItem && (
                <div className="fixed inset-0 z-[60] flex justify-center items-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setSelectedItem(null)} />
                    <div className="relative bg-[#21201d] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setSelectedItem(null)} 
                            className="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded-full text-white hover:bg-white hover:text-black transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-full md:w-1/2 bg-[#1a1917] p-8 flex items-center justify-center relative">
                             <div className="absolute inset-0 bg-gradient-to-br from-[#2c4dbd]/10 to-transparent" />
                             <img 
                                src={selectedItem.image_url} 
                                className="max-w-full max-h-[50vh] object-contain drop-shadow-2xl relative z-10" 
                                alt={selectedItem.item_name} 
                            />
                        </div>

                        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
                            <div className="mb-auto">
                                <div className="flex gap-2 mb-4">
                                     <span className="bg-[#2c4dbd]/10 text-[#2c4dbd] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-[#2c4dbd]/20">
                                        Official Item
                                     </span>
                                     {selectedItem.stock_quantity <= 5 && (
                                        <span className="bg-[#e63e3e]/10 text-[#e63e3e] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-[#e63e3e]/20">
                                            Low Stock: {selectedItem.stock_quantity} left
                                        </span>
                                     )}
                                </div>
                                
                                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
                                    {selectedItem.item_name}
                                </h2>
                                
                                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#2c4dbd] to-[#e63e3e] mb-6">
                                    ₱{selectedItem.price.toLocaleString()}
                                </p>

                                <div className="prose prose-invert prose-sm max-w-none text-gray-400 mb-8">
                                    <p>{selectedItem.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/5">
                                <button 
                                    onClick={(e) => { addToCart(e, selectedItem); setSelectedItem(null); }}
                                    className="bg-[#312e2b] text-white py-4 rounded-xl font-bold text-sm hover:bg-white hover:text-black transition-all border border-white/10 uppercase tracking-wide"
                                >
                                    Add to Cart
                                </button>
                                <button 
                                    onClick={(e) => { handleBuyNow(e, selectedItem); setSelectedItem(null); }}
                                    className="bg-gradient-to-r from-[#2c4dbd] to-[#e63e3e] text-white py-4 rounded-xl font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide"
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CHECKOUT CONFIRM MODAL --- */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 z-[70] flex justify-center items-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsCheckoutOpen(false)} />
                    <div className="relative bg-[#21201d] w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <div className="bg-[#262522] p-6 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Trophy className="text-[#e63e3e] w-5 h-5" /> Confirm Order
                            </h2>
                            <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-8">
                            <div className="text-center mb-8">
                                <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-2">Total Amount Payable</p>
                                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#2c4dbd] to-[#e63e3e]">
                                    ₱{totalPayment.toLocaleString()}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                                    Recipient Name
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Enter full name for claiming..." 
                                        className="w-full bg-[#1a1917] border border-white/10 rounded-xl p-4 pl-5 text-white outline-none focus:border-[#2c4dbd] focus:ring-1 focus:ring-[#2c4dbd] transition-all placeholder-gray-700"
                                        value={recipientName}
                                        onChange={(e) => setRecipientName(e.target.value)}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#e63e3e] animate-pulse" />
                                </div>
                                <p className="text-[10px] text-gray-500 leading-relaxed px-1">
                                    * Please ensure the name matches your valid ID for verification upon claiming.
                                </p>
                            </div>

                            <button 
                                onClick={handlePlaceOrder}
                                disabled={isSubmitting}
                                className="mt-8 w-full bg-white text-black py-4 rounded-xl font-black text-sm tracking-widest hover:bg-[#e63e3e] hover:text-white hover:shadow-lg hover:shadow-[#e63e3e]/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="animate-pulse">PROCESSING...</span>
                                ) : (
                                    <>PLACE ORDER <CheckCircle size={16} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- RECEIPT MODAL --- */}
            {receipt && (
                <div className="fixed inset-0 z-[80] flex justify-center items-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" />
                    <div className="relative bg-[#f8f9fa] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                        <div className="relative bg-[#1a1917] p-8 text-center overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2c4dbd] via-[#e63e3e] to-[#2c4dbd]" />
                            <div className="relative z-10">
                                <div className="bg-[#2c4dbd] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#2c4dbd]/40">
                                    <CheckCircle className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tight">ORDER CONFIRMED</h2>
                                <p className="text-gray-400 text-xs mt-2 uppercase tracking-wide">Thank you for purchasing</p>
                            </div>
                        </div>

                        <div className="p-8 relative">
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Receipt No.</span>
                                    <span className="font-mono font-bold text-gray-800 text-sm">{receipt.receipt_number}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Date Issued</span>
                                    <span className="font-bold text-gray-800 text-sm">{receipt.date}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Recipient</span>
                                    <span className="font-bold text-gray-800 text-sm uppercase">{receipt.recipient_name}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-900 font-black uppercase text-xs tracking-widest">Total Paid</span>
                                    <span className="font-black text-[#2c4dbd] text-2xl">₱{receipt.total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-gray-100 rounded-xl p-4 text-center mb-6 border border-gray-200">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Next Steps</p>
                                <a 
                                    href={FB_PAGE_LINK} 
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 bg-[#1877F2] text-white px-4 py-3 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    <Facebook size={16} /> Send Receipt to Facebook
                                </a>
                            </div>

                            <button 
                                onClick={() => setReceipt(null)} 
                                className="w-full text-gray-400 py-2 text-[10px] font-bold uppercase tracking-widest hover:text-gray-800 transition-colors"
                            >
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketPage;