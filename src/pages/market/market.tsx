import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/sidebar';
import { ShoppingCart, X, Minus, Plus, ShoppingBag, CheckCircle, ArrowRight, Package, CreditCard, Wallet, Truck, ChevronRight, History, ScrollText, Printer, Download } from "lucide-react";
import html2canvas from 'html2canvas';

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
    payment_method: string;
}

interface OrderItem {
    quantity: number;
    items: {
        item_name: string;
        price: number;
        image_url: string;
    }
}

interface OrderHistoryItem {
    order_id: number;
    receipt_no: number;
    recipient_name: string;
    contact_no: string;
    status: string;
    total_amount: number;
    order_date: string;
    payment_method: string; // Ensure this is returned from DB or remove if not
    order_items: OrderItem[];
}

const MarketPage: React.FC = () => {
    const [items, setItems] = useState<MarketItem[]>([]);

    // Persistent Cart
    const [cart, setCart] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('eos_cart');
        return saved ? JSON.parse(saved) : [];
    });

    const [loading, setLoading] = useState<boolean>(true);
    const [isCartOpen, setIsCartOpen] = useState(false); // Controls the Drawer/Modal

    // Stepper State inside the Cart/Checkout Modal
    // 1 = Cart View, 2 = Checkout Form, 3 = Payment, 4 = Success
    const [checkoutStep, setCheckoutStep] = useState<number>(1);

    // Receipt Ref for printing/saving
    const receiptRef = useRef<HTMLDivElement>(null);

    // Selected Item for Details Modal
    const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

    // Checkout Form Data
    const [recipientName, setRecipientName] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>(""); // 'card', 'gcash', 'maya'

    // Card Mock Data
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCVC, setCardCVC] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);

    // Orders History State
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [isOrdersOpen, setIsOrdersOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);

    const API_BASE = "https://eos-server.onrender.com/api/market";
    const USER_TOKEN = localStorage.getItem('token');

    useEffect(() => {
        localStorage.setItem('eos_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch(`${API_BASE}/items`);
                const data = await res.json();
                if (Array.isArray(data)) setItems(data);
                setLoading(false);
            } catch (e) { console.error(e); setLoading(false); }
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
        setCheckoutStep(1); // Reset to cart view
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

    const handleNextStep = () => {
        if (checkoutStep === 1) {
            if (cart.length === 0) return;
            if (!USER_TOKEN) { alert("Please Login to checkout."); return; }
            setCheckoutStep(2);
        } else if (checkoutStep === 2) {
            if (!recipientName || !contactNumber) {
                alert("Please fill in all shipping details.");
                return;
            }
            setCheckoutStep(3);
        }
    };

    const handlePlaceOrder = async () => {
        if (!paymentMethod) { alert("Please select a payment method."); return; }

        // Mock Validation for Card
        if (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCVC)) {
            alert("Please enter valid card details."); return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                items: cart.map(i => ({ item_id: i.item_id, quantity: i.cartQuantity })),
                recipient_name: recipientName,
                contact_no: contactNumber,
                payment_method: paymentMethod
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
            setCheckoutStep(4); // Success Step (or just show receipt modal)

        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchOrders = async () => {
        if (!USER_TOKEN) { alert("Please login to view orders."); return; }
        try {
            const res = await fetch(`${API_BASE}/my-orders`, {
                headers: { 'Authorization': `Bearer ${USER_TOKEN}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setOrders(data);
                setIsOrdersOpen(true);
            }
        } catch (e) { console.error(e); alert("Failed to fetch orders."); }
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);


    // --- ACTIONS ---
    const handlePrint = () => {
        window.print();
    };

    const handleDownloadImage = async () => {
        if (!receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: '#1a1917',
                scale: 2
            } as any);
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `Receipt-${receipt?.receipt_number || selectedOrder?.receipt_no || 'EOS'}.png`;
            link.click();
        } catch (err) {
            console.error("Failed to save receipt image", err);
            alert("Failed to save image.");
        }
    };

    // --- RENDER HELPERS ---
    const renderCartStep = () => (
        <div className="flex flex-col h-full">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <ShoppingBag className="text-[#e63e3e]" /> Your Cart
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {cart.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Your cart is empty</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.item_id} className="bg-[#262522] p-4 rounded-xl flex gap-4 border border-white/5">
                            <img src={item.image_url} className="w-16 h-16 object-cover rounded-lg bg-gray-800" alt={item.item_name} />
                            <div className="flex-1">
                                <h4 className="text-white font-bold text-sm line-clamp-1">{item.item_name}</h4>
                                <p className="text-[#2c4dbd] font-bold text-xs">₱{item.price.toLocaleString()}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center bg-[#1a1917] rounded-lg border border-white/5">
                                        <button onClick={() => updateCartQuantity(item.item_id, -1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white"><Minus size={10} /></button>
                                        <span className="text-xs font-bold text-white px-2">{item.cartQuantity}</span>
                                        <button onClick={() => updateCartQuantity(item.item_id, 1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white"><Plus size={10} /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.item_id)} className="text-[10px] text-red-500 hover:text-red-400 uppercase font-bold">Remove</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {cart.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-gray-400 text-xs font-bold uppercase">Total</span>
                        <span className="text-2xl font-black text-white">₱{cartTotal.toLocaleString()}</span>
                    </div>
                    <button onClick={handleNextStep} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
                        Checkout <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );

    const renderCheckoutFormStep = () => (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setCheckoutStep(1)} className="text-gray-400 hover:text-white"><ChevronRight size={20} className="rotate-180" /></button>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Truck className="text-[#e63e3e]" /> Order Info
                </h3>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Recipient Name</label>
                    <input
                        type="text"
                        className="w-full bg-[#262522] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#2c4dbd]"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Full Name"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Number</label>
                    <input
                        type="text"
                        className="w-full bg-[#262522] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#2c4dbd]"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="0912 345 6789"
                    />
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
                <button onClick={handleNextStep} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
                    Proceed to Payment <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );

    const renderPaymentStep = () => (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setCheckoutStep(2)} className="text-gray-400 hover:text-white"><ChevronRight size={20} className="rotate-180" /></button>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Wallet className="text-[#e63e3e]" /> Payment
                </h3>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                <p className="text-sm text-gray-400 mb-4">Select a payment method:</p>

                {/* GCash */}
                <label className={`block p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'gcash' ? 'bg-[#2c4dbd]/10 border-[#2c4dbd]' : 'bg-[#262522] border-white/5 hover:border-white/20'}`}>
                    <div className="flex items-center gap-3">
                        <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'gcash'} onChange={() => setPaymentMethod('gcash')} />
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">GCash</div>
                        <div>
                            <div className="font-bold text-white">GCash</div>
                            <div className="text-xs text-gray-500">Scan QR or Login</div>
                        </div>
                        {paymentMethod === 'gcash' && <CheckCircle className="ml-auto text-[#2c4dbd]" size={20} />}
                    </div>
                </label>

                {/* PayMaya */}
                <label className={`block p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'maya' ? 'bg-[#2c4dbd]/10 border-[#2c4dbd]' : 'bg-[#262522] border-white/5 hover:border-white/20'}`}>
                    <div className="flex items-center gap-3">
                        <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'maya'} onChange={() => setPaymentMethod('maya')} />
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">Maya</div>
                        <div>
                            <div className="font-bold text-white">Maya</div>
                            <div className="text-xs text-gray-500">Wallet / Bank</div>
                        </div>
                        {paymentMethod === 'maya' && <CheckCircle className="ml-auto text-[#2c4dbd]" size={20} />}
                    </div>
                </label>

                {/* Credit Card */}
                <label className={`block p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'card' ? 'bg-[#2c4dbd]/10 border-[#2c4dbd]' : 'bg-[#262522] border-white/5 hover:border-white/20'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-white"><CreditCard size={20} /></div>
                        <div>
                            <div className="font-bold text-white">Credit / Debit Card</div>
                            <div className="text-xs text-gray-500">Visa, Mastercard</div>
                        </div>
                        {paymentMethod === 'card' && <CheckCircle className="ml-auto text-[#2c4dbd]" size={20} />}
                    </div>

                    {paymentMethod === 'card' && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3 animate-in fade-in">
                            <input type="text" placeholder="Card Number" className="w-full bg-[#1a1917] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#2c4dbd]" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="MM/YY" className="w-full bg-[#1a1917] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#2c4dbd]" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} />
                                <input type="text" placeholder="CVC" className="w-full bg-[#1a1917] border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-[#2c4dbd]" value={cardCVC} onChange={e => setCardCVC(e.target.value)} />
                            </div>
                        </div>
                    )}
                </label>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Total to Pay</span>
                    <span className="text-xl font-black text-white">₱{cartTotal.toLocaleString()}</span>
                </div>
                <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#2c4dbd] to-[#e63e3e] hover:brightness-110 text-white py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                    {isSubmitting ? 'Processing...' : `Pay Now ₱${cartTotal.toLocaleString()}`}
                </button>
            </div>
        </div>
    );

    const renderReceipt = () => {
        if (!receipt) return null;
        return (
            <div className="flex flex-col h-full animate-in zoom-in-95 duration-300 items-center justify-center text-center p-4">
                <div ref={receiptRef} className="w-full bg-[#1a1917] p-4 rounded-xl">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/20 mx-auto">
                        <CheckCircle size={40} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Order Confirmed!</h2>
                    <p className="text-gray-400 text-sm mb-8">Thank you for your purchase.</p>

                    <div className="w-full bg-[#262522] rounded-xl p-6 border border-white/5 space-y-3 mb-6">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Receipt No.</span> <span className="text-white font-mono">{receipt.receipt_number}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span> <span className="text-white">{receipt.date}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Method</span> <span className="text-white uppercase">{receipt.payment_method || paymentMethod}</span></div>
                        <div className="flex justify-between text-sm border-t border-white/10 pt-3 mt-3"><span className="text-gray-500 font-bold">Total Paid</span> <span className="text-[#2c4dbd] font-black">₱{receipt.total.toLocaleString()}</span></div>
                    </div>
                </div>

                <div className="flex gap-2 w-full mb-4">
                    <button onClick={handlePrint} className="flex-1 bg-[#262522] text-gray-300 py-3 rounded-xl border border-white/5 hover:border-white hover:text-white transition-all text-sm font-bold flex items-center justify-center gap-2">
                        <Printer size={16} /> Print
                    </button>
                    <button onClick={handleDownloadImage} className="flex-1 bg-[#262522] text-gray-300 py-3 rounded-xl border border-white/5 hover:border-white hover:text-white transition-all text-sm font-bold flex items-center justify-center gap-2">
                        <Download size={16} /> Save
                    </button>
                </div>

                <button onClick={() => { setIsCartOpen(false); setReceipt(null); setCheckoutStep(1); }} className="text-gray-400 hover:text-white font-bold text-sm">Close</button>
            </div>
        )
    };

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

                    <div className="flex gap-4">
                        <button
                            onClick={() => { setIsCartOpen(true); setCheckoutStep(1); }}
                            className="group relative bg-[#262522] h-14 w-14 rounded-2xl border border-white/5 hover:border-[#e63e3e] flex items-center justify-center transition-all duration-300 shadow-xl hover:shadow-[#e63e3e]/20"
                        >
                            <ShoppingCart className="text-white w-6 h-6 group-hover:scale-110 transition-transform" />
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-[#e63e3e] text-white text-[10px] font-bold w-6 h-6 rounded-lg flex items-center justify-center border-2 border-[#1a1917] shadow-lg animate-bounce">
                                    {cart.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={fetchOrders}
                            className="group relative bg-[#262522] h-14 px-6 rounded-2xl border border-white/5 hover:border-[#2c4dbd] flex items-center justify-center gap-3 transition-all duration-300 shadow-xl hover:shadow-[#2c4dbd]/20"
                            title="My Orders"
                        >
                            <History className="text-white w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-gray-300 group-hover:text-white transition-colors">My Orders</span>
                        </button>
                    </div>
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
                                        <h3 className="text-white font-bold text-lg leading-tight line-clamp-1 h-6 overflow-hidden group-hover:text-[#e63e3e] transition-colors">{item.item_name}</h3>
                                        <div className="mt-3"><span className="text-[#2c4dbd] font-black text-xl">₱{item.price.toLocaleString()}</span></div>
                                    </div>
                                    <button
                                        onClick={(e) => addToCart(e, item)}
                                        className="w-full bg-[#312e2b] text-gray-300 py-3.5 rounded-xl font-bold text-xs hover:bg-white hover:text-black transition-all border border-white/5 uppercase tracking-wide flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* --- RIGHT DRAWER / MODAL FOR CHECKOUT FLOW --- */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
                    <div className="relative bg-[#1a1917] w-full max-w-md h-full flex flex-col border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 bg-[#21201d] flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                                    {checkoutStep === 1 && "Shopping Cart"}
                                    {checkoutStep === 2 && "Checkout Details"}
                                    {checkoutStep === 3 && "Secure Payment"}
                                    {checkoutStep === 4 && "Order Complete"}
                                </h2>
                                {/* Progress Dots */}
                                {checkoutStep < 4 && (
                                    <div className="flex gap-2 mt-2">
                                        <div className={`h-1 rounded-full transition-all ${checkoutStep >= 1 ? 'w-8 bg-[#e63e3e]' : 'w-2 bg-gray-700'}`} />
                                        <div className={`h-1 rounded-full transition-all ${checkoutStep >= 2 ? 'w-8 bg-[#e63e3e]' : 'w-2 bg-gray-700'}`} />
                                        <div className={`h-1 rounded-full transition-all ${checkoutStep >= 3 ? 'w-8 bg-[#e63e3e]' : 'w-2 bg-gray-700'}`} />
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setIsCartOpen(false)} className="bg-[#312e2b] p-2 rounded-lg hover:bg-white hover:text-black transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden p-6 relative">
                            {checkoutStep === 1 && renderCartStep()}
                            {checkoutStep === 2 && renderCheckoutFormStep()}
                            {checkoutStep === 3 && renderPaymentStep()}
                            {checkoutStep === 4 && renderReceipt()}
                        </div>
                    </div>
                </div>
            )}

            {/* --- ORDERS DRAWER --- */}
            {isOrdersOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOrdersOpen(false)} />
                    <div className="relative bg-[#1a1917] w-full max-w-md h-full flex flex-col border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-white/5 bg-[#21201d] flex justify-between items-center z-10">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <ScrollText size={18} /> My Orders
                            </h2>
                            <button onClick={() => { setIsOrdersOpen(false); setSelectedOrder(null); }} className="bg-[#312e2b] p-2 rounded-lg hover:bg-white hover:text-black transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 pr-2 custom-scrollbar">
                            {selectedOrder ? (
                                <div className="animate-in slide-in-from-right duration-300">
                                    <button onClick={() => setSelectedOrder(null)} className="mb-4 text-sm text-[#2c4dbd] font-bold flex items-center gap-1 hover:underline">
                                        <ChevronRight className="rotate-180" size={16} /> Back to List
                                    </button>

                                    <div ref={receiptRef} className="w-full bg-[#262522] rounded-xl p-6 border border-white/5 space-y-4">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-blue-500/20 text-[#2c4dbd] rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Package size={32} />
                                            </div>
                                            <h3 className="text-xl font-black text-white">Order Details</h3>
                                            <p className="text-gray-500 text-xs uppercase tracking-wide">#{selectedOrder.receipt_no || selectedOrder.order_id}</p>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-white/10">
                                            {selectedOrder.order_items.map((oi, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-gray-800 overflow-hidden">
                                                            <img src={oi.items?.image_url} className="w-full h-full object-cover" />
                                                        </div>
                                                        <span className="text-gray-300">
                                                            <span className="text-white font-bold">{oi.quantity}x</span> {oi.items?.item_name || "Item"}
                                                        </span>
                                                    </div>
                                                    <span className="text-white font-mono">₱{(oi.items?.price * oi.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-4 mt-2 border-t border-white/10 space-y-2">
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span> <span className="text-yellow-500 font-bold uppercase text-xs px-2 py-0.5 bg-yellow-500/10 rounded">{selectedOrder.status}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span> <span className="text-white">{new Date(selectedOrder.order_date).toLocaleDateString()}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span> <span className="text-[#2c4dbd] font-black text-lg">₱{selectedOrder.total_amount.toLocaleString()}</span></div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full mt-4">
                                        <button onClick={handlePrint} className="flex-1 bg-[#262522] text-gray-300 py-3 rounded-xl border border-white/5 hover:border-white hover:text-white transition-all text-sm font-bold flex items-center justify-center gap-2">
                                            <Printer size={16} /> Print
                                        </button>
                                        <button onClick={handleDownloadImage} className="flex-1 bg-[#262522] text-gray-300 py-3 rounded-xl border border-white/5 hover:border-white hover:text-white transition-all text-sm font-bold flex items-center justify-center gap-2">
                                            <Download size={16} /> Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                orders.length === 0 ? (
                                    <div className="text-center text-gray-500 py-10 opacity-50">
                                        <History size={48} className="mx-auto mb-4" />
                                        <p>No past orders found.</p>
                                    </div>
                                ) : (
                                    orders.map(order => (
                                        <div
                                            key={order.order_id}
                                            onClick={() => setSelectedOrder(order)}
                                            className="bg-[#262522] p-4 rounded-xl border border-white/5 hover:border-[#2c4dbd]/50 cursor-pointer transition-all hover:bg-[#2c2b28] group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="text-white font-bold text-sm">Order #{order.receipt_no || order.order_id}</h4>
                                                    <span className="text-xs text-gray-500">{new Date(order.order_date).toLocaleDateString()}</span>
                                                </div>
                                                <span className="text-[#2c4dbd] font-black text-sm">₱{order.total_amount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className="flex -space-x-2">
                                                    {order.order_items.map((oi, i) => i < 3 && (
                                                        <div key={i} className="w-6 h-6 rounded-full bg-gray-800 border border-[#262522] overflow-hidden">
                                                            <img src={oi.items?.image_url} className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                    {order.order_items.length > 3 && (
                                                        <div className="w-6 h-6 rounded-full bg-gray-700 border border-[#262522] flex items-center justify-center text-[8px] text-white">+{order.order_items.length - 3}</div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] uppercase font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded group-hover:bg-yellow-500 group-hover:text-black transition-colors">{order.status}</span>
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- PRODUCT DETAILS MODAL --- */}
            {selectedItem && (
                <div className="fixed inset-0 z-[60] flex justify-center items-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setSelectedItem(null)} />
                    <div className="relative bg-[#21201d] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded-full text-white hover:bg-white hover:text-black transition-colors">
                            <X size={20} />
                        </button>
                        <div className="w-full md:w-1/2 bg-[#1a1917] p-8 flex items-center justify-center relative">
                            <img src={selectedItem.image_url} className="max-w-full max-h-[50vh] object-contain drop-shadow-2xl relative z-10" alt={selectedItem.item_name} />
                        </div>
                        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
                            <div className="mb-auto">
                                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">{selectedItem.item_name}</h2>
                                <p className="text-3xl font-black text-[#2c4dbd] mb-6">₱{selectedItem.price.toLocaleString()}</p>
                                <p className="text-gray-400 mb-8">{selectedItem.description}</p>
                            </div>
                            <button onClick={(e) => { addToCart(e, selectedItem); setSelectedItem(null); }} className="bg-[#312e2b] text-white py-4 rounded-xl font-bold text-sm hover:bg-white hover:text-black transition-all border border-white/10 uppercase tracking-wide">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketPage;