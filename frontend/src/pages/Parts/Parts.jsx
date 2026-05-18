import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingCart, Search, Filter, X } from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/Button/Button';
import Badge from '../../components/Badge/Badge';
import Modal from '../../components/Modal/Modal';
import './Parts.css';

const Parts = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: '',
        min_price: '',
        max_price: ''
    });

    const [selectedPart, setSelectedPart] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    
    // Cart State
    const [cartItem, setCartItem] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [shippingAddress, setShippingAddress] = useState('');
    const [deliveryOption, setDeliveryOption] = useState('standard');
    const [isOrdering, setIsOrdering] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(null);

    const fetchParts = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.category) queryParams.append('category', filters.category);
            if (filters.min_price) queryParams.append('min_price', filters.min_price);
            if (filters.max_price) queryParams.append('max_price', filters.max_price);
            
            const res = await api.get(`/parts?${queryParams.toString()}`);
            setParts(res.data.data);
        } catch (err) {
            toast.error('Failed to load parts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParts();
    }, [filters]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleAddToCart = (part) => {
        setCartItem(part);
        setQuantity(1);
        setSelectedPart(null);
        setIsCartOpen(true);
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setIsOrdering(true);
        try {
            const res = await api.post('/orders', {
                part_id: cartItem.id,
                quantity,
                shipping_address: shippingAddress,
                delivery_option: deliveryOption
            });
            setOrderSuccess(res.data.data);
            toast.success('Order placed successfully!');
            // Update local stock
            setParts(parts.map(p => p.id === cartItem.id ? { ...p, stock: p.stock - quantity } : p));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to place order');
        } finally {
            setIsOrdering(false);
        }
    };

    const closeCart = () => {
        setIsCartOpen(false);
        setCartItem(null);
        setOrderSuccess(null);
    };

    return (
        <div className="parts-page">
            <div className="page-header">
                <div>
                    <h1>Marketplace</h1>
                    <p className="text-muted">Find replacement parts for your devices.</p>
                </div>
                <Button variant="secondary" onClick={() => setIsCartOpen(true)}>
                    <ShoppingCart size={18} /> Cart {cartItem ? '(1)' : '(0)'}
                </Button>
            </div>

            <div className="parts-layout">
                <div className="parts-sidebar">
                    <div className="filter-card">
                        <h3 className="flex-align-center gap-2 mb-4"><Filter size={18} /> Filters</h3>
                        
                        <div className="form-group mb-4">
                            <label>Search</label>
                            <div className="search-input">
                                <Search size={16} className="search-icon" />
                                <input 
                                    type="text" 
                                    name="search"
                                    className="form-control" 
                                    placeholder="Search parts..." 
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label>Category</label>
                            <div className="radio-group">
                                <label className="radio-item">
                                    <input type="radio" name="category" value="" checked={filters.category === ''} onChange={handleFilterChange} />
                                    All Categories
                                </label>
                                <label className="radio-item">
                                    <input type="radio" name="category" value="Mobile" checked={filters.category === 'Mobile'} onChange={handleFilterChange} />
                                    Mobile
                                </label>
                                <label className="radio-item">
                                    <input type="radio" name="category" value="Computers" checked={filters.category === 'Computers'} onChange={handleFilterChange} />
                                    Computers
                                </label>
                                <label className="radio-item">
                                    <input type="radio" name="category" value="Home Appliances" checked={filters.category === 'Home Appliances'} onChange={handleFilterChange} />
                                    Home Appliances
                                </label>
                                <label className="radio-item">
                                    <input type="radio" name="category" value="Networking" checked={filters.category === 'Networking'} onChange={handleFilterChange} />
                                    Networking
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Price Range</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="number" name="min_price" className="form-control" placeholder="Min" value={filters.min_price} onChange={handleFilterChange} />
                                <input type="number" name="max_price" className="form-control" placeholder="Max" value={filters.max_price} onChange={handleFilterChange} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="parts-main">
                    {loading ? (
                        <div>Loading parts...</div>
                    ) : parts.length === 0 ? (
                        <div className="empty-state text-center p-8">
                            <p>No parts found matching your criteria.</p>
                            <Button variant="ghost" onClick={() => setFilters({ search: '', category: '', min_price: '', max_price: '' })}>Clear Filters</Button>
                        </div>
                    ) : (
                        <div className="parts-grid">
                            {parts.map(part => (
                                <div key={part.id} className="part-card" onClick={() => setSelectedPart(part)}>
                                    <div className="part-image">
                                        <img src={part.image_url} alt={part.name} />
                                        {part.stock <= 5 && part.stock > 0 && <Badge variant="warning" className="stock-badge">Low Stock</Badge>}
                                        {part.stock === 0 && <Badge variant="danger" className="stock-badge">Out of Stock</Badge>}
                                    </div>
                                    <div className="part-info">
                                        <Badge variant="neutral" className="mb-2">{part.category}</Badge>
                                        <h3 className="part-title">{part.name}</h3>
                                        <p className="part-price">${part.price.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={!!selectedPart} onClose={() => setSelectedPart(null)} title={selectedPart?.name}>
                {selectedPart && (
                    <div className="part-detail">
                        <img src={selectedPart.image_url} alt={selectedPart.name} className="part-detail-img mb-4" />
                        <div className="mb-4">
                            <Badge variant="primary">{selectedPart.category}</Badge>
                            <span className="ms-2 font-medium">${selectedPart.price.toFixed(2)}</span>
                        </div>
                        <p className="mb-4">{selectedPart.description}</p>
                        <div className="mb-4">
                            <strong>Compatible Models:</strong>
                            <p className="text-muted text-sm">{JSON.parse(selectedPart.compatible_models_json).join(', ')}</p>
                        </div>
                        <div className="mb-6">
                            <strong>Stock:</strong> {selectedPart.stock} available
                        </div>
                        <Button 
                            variant="primary" 
                            className="w-full" 
                            disabled={selectedPart.stock === 0}
                            onClick={() => handleAddToCart(selectedPart)}
                        >
                            {selectedPart.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                    </div>
                )}
            </Modal>

            {/* Cart Drawer */}
            {isCartOpen && (
                <div className="cart-drawer-overlay" onClick={closeCart}>
                    <div className="cart-drawer" onClick={e => e.stopPropagation()}>
                        <div className="cart-header">
                            <h2>Shopping Cart</h2>
                            <button className="btn-icon" onClick={closeCart}><X size={20} /></button>
                        </div>
                        
                        <div className="cart-body">
                            {orderSuccess ? (
                                <div className="text-center p-4">
                                    <div style={{ color: 'var(--color-success)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                                        <ShoppingCart size={48} />
                                    </div>
                                    <h3 className="mb-2">Order Placed!</h3>
                                    <p className="text-muted mb-4">Your order ID is <strong>{orderSuccess.id}</strong></p>
                                    <Button variant="primary" className="w-full mb-2" onClick={() => { closeCart(); window.location.href = `/app/orders/${orderSuccess.id}`; }}>
                                        View Order
                                    </Button>
                                    <Button variant="ghost" className="w-full" onClick={closeCart}>Continue Shopping</Button>
                                </div>
                            ) : cartItem ? (
                                <form onSubmit={handlePlaceOrder}>
                                    <div className="cart-item mb-6">
                                        <img src={cartItem.image_url} alt={cartItem.name} />
                                        <div className="cart-item-info">
                                            <h4>{cartItem.name}</h4>
                                            <p className="text-muted">${cartItem.price.toFixed(2)}</p>
                                            <div className="quantity-control mt-2">
                                                <label className="text-sm me-2">Qty:</label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max={cartItem.stock} 
                                                    value={quantity}
                                                    onChange={e => setQuantity(Number(e.target.value))}
                                                    className="form-control"
                                                    style={{ width: '80px', padding: '0.25rem' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group mb-4">
                                        <label>Shipping Address</label>
                                        <textarea 
                                            className="form-control" 
                                            rows="3" 
                                            required 
                                            value={shippingAddress}
                                            onChange={e => setShippingAddress(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="form-group mb-6">
                                        <label>Delivery Option</label>
                                        <div className="radio-group">
                                            <label className="radio-item">
                                                <input type="radio" name="delivery" value="standard" checked={deliveryOption === 'standard'} onChange={e => setDeliveryOption(e.target.value)} />
                                                Standard (3-5 days)
                                            </label>
                                            <label className="radio-item">
                                                <input type="radio" name="delivery" value="express" checked={deliveryOption === 'express'} onChange={e => setDeliveryOption(e.target.value)} />
                                                Express (1-2 days) - +$10.00
                                            </label>
                                        </div>
                                    </div>

                                    <div className="cart-summary mb-6">
                                        <div className="flex-between mb-2">
                                            <span>Subtotal</span>
                                            <span>${(cartItem.price * quantity).toFixed(2)}</span>
                                        </div>
                                        <div className="flex-between mb-2">
                                            <span>Shipping</span>
                                            <span>{deliveryOption === 'express' ? '$10.00' : 'Free'}</span>
                                        </div>
                                        <div className="flex-between font-bold pt-2 border-top">
                                            <span>Total</span>
                                            <span>${((cartItem.price * quantity) + (deliveryOption === 'express' ? 10 : 0)).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <Button type="submit" variant="primary" className="w-full" loading={isOrdering}>
                                        Place Order
                                    </Button>
                                </form>
                            ) : (
                                <div className="text-center p-8 text-muted">
                                    <ShoppingCart size={48} className="mb-4 opacity-50 mx-auto d-block" />
                                    <p>Your cart is empty.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Parts;
