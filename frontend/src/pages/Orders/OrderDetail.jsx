import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CreditCard, Wallet, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import './Orders.css';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Payment State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.get(`/orders/${id}`);
                setOrder(res.data.data);
            } catch (err) {
                toast.error('Failed to load order');
                navigate('/app/orders');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, navigate]);

    const handlePayment = async () => {
        setIsProcessing(true);
        setPaymentResult(null);
        
        try {
            const res = await api.post('/payments', { order_id: Number(id), method: paymentMethod });
            setPaymentResult({ success: true, data: res.data.data });
            setOrder({ ...order, status: 'paid', payment: res.data.data });
        } catch (err) {
            setPaymentResult({ success: false, message: err.response?.data?.message || 'Payment failed' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!order) return null;

    return (
        <div className="order-detail-page">
            <button className="btn-icon mb-4" onClick={() => navigate('/app/orders')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowLeft size={16} /> Back to Orders
            </button>
            
            <div className="page-header">
                <div>
                    <h1>Order #{order.id}</h1>
                    <p className="text-muted">Placed on {new Date(order.created_at).toLocaleString()}</p>
                </div>
                <Badge variant={
                    order.status === 'paid' ? 'success' :
                    order.status === 'shipped' ? 'info' :
                    order.status === 'cancelled' ? 'danger' : 'warning'
                }>
                    {order.status}
                </Badge>
            </div>

            <div className="order-content">
                <div className="order-main-info card">
                    <h3>Items</h3>
                    <div className="order-item mt-4">
                        <img src={order.part_image} alt={order.part_name} className="order-item-img" />
                        <div className="order-item-details">
                            <h4>{order.part_name}</h4>
                            <p className="text-muted">${order.part_price.toFixed(2)} x {order.quantity}</p>
                        </div>
                        <div className="order-item-total font-bold">
                            ${(order.part_price * order.quantity).toFixed(2)}
                        </div>
                    </div>
                    
                    <div className="order-summary-box mt-6">
                        <div className="flex-between mb-2">
                            <span className="text-muted">Subtotal</span>
                            <span>${(order.part_price * order.quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex-between mb-2">
                            <span className="text-muted">Shipping ({order.delivery_option})</span>
                            <span>{order.delivery_option === 'express' ? '$10.00' : 'Free'}</span>
                        </div>
                        <div className="flex-between font-bold text-lg pt-2 border-top">
                            <span>Total</span>
                            <span>${order.total_price.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="order-side-info">
                    <div className="card mb-6">
                        <h3>Shipping Details</h3>
                        <p className="mt-4 text-muted whitespace-pre-wrap">{order.shipping_address}</p>
                        <div className="mt-4">
                            <strong>Shopify Order ID:</strong><br/>
                            <span className="text-sm text-muted">{order.shopify_order_id}</span>
                        </div>
                    </div>

                    <div className="card">
                        <h3>Payment</h3>
                        {order.status === 'pending' ? (
                            <div className="mt-4 text-center">
                                <p className="text-muted mb-4">Awaiting payment to process your order.</p>
                                <Button variant="primary" className="w-full" onClick={() => setIsPaymentModalOpen(true)}>
                                    Pay Now
                                </Button>
                            </div>
                        ) : order.payment ? (
                            <div className="mt-4">
                                <div className="payment-receipt">
                                    <div className="flex-between mb-2">
                                        <span className="text-muted">Method</span>
                                        <span className="capitalize">{order.payment.method}</span>
                                    </div>
                                    <div className="flex-between mb-2">
                                        <span className="text-muted">Transaction ID</span>
                                        <span className="text-sm">{order.payment.mock_transaction_id || 'N/A'}</span>
                                    </div>
                                    <div className="flex-between">
                                        <span className="text-muted">Status</span>
                                        <Badge variant={order.payment.status === 'success' ? 'success' : 'danger'}>{order.payment.status}</Badge>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-4 text-muted text-center">Payment information unavailable.</p>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={isPaymentModalOpen} onClose={() => {
                if (!isProcessing) {
                    setIsPaymentModalOpen(false);
                    setPaymentResult(null);
                }
            }} title="Complete Payment">
                {paymentResult ? (
                    paymentResult.success ? (
                        <div className="text-center py-6">
                            <CheckCircle size={64} className="text-success mx-auto mb-4" />
                            <h2 className="mb-2">Payment Successful!</h2>
                            <p className="text-muted mb-6">Your order has been paid and is being processed.</p>
                            <Button onClick={() => setIsPaymentModalOpen(false)} className="w-full">Close</Button>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <XCircle size={64} className="text-danger mx-auto mb-4" />
                            <h2 className="mb-2">Payment Declined</h2>
                            <p className="text-muted mb-6">{paymentResult.message}</p>
                            <Button onClick={() => setPaymentResult(null)} variant="primary" className="w-full mb-2">Try Again</Button>
                            <Button onClick={() => setIsPaymentModalOpen(false)} variant="ghost" className="w-full">Cancel</Button>
                        </div>
                    )
                ) : (
                    <div className="payment-form">
                        <p className="text-center text-lg font-bold mb-6">Total: ${order.total_price.toFixed(2)}</p>
                        
                        <div className="payment-methods mb-6">
                            <label className={`method-card ${paymentMethod === 'card' ? 'active' : ''}`}>
                                <input type="radio" name="payment_method" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="hidden" />
                                <CreditCard size={24} />
                                <span>Credit Card</span>
                            </label>
                            <label className={`method-card ${paymentMethod === 'wallet' ? 'active' : ''}`}>
                                <input type="radio" name="payment_method" value="wallet" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} className="hidden" />
                                <Wallet size={24} />
                                <span>Digital Wallet</span>
                            </label>
                        </div>

                        {isProcessing ? (
                            <div className="processing-state text-center py-4">
                                <ProgressBar value={100} className="mb-4 processing-bar" />
                                <p className="text-muted pulse-animation">Contacting payment gateway...</p>
                            </div>
                        ) : (
                            <Button variant="primary" className="w-full" onClick={handlePayment}>
                                Confirm Payment
                            </Button>
                        )}
                        
                        <p className="text-xs text-muted text-center mt-4">
                            Note: This is a simulated environment. Payments have a 10% chance to fail.
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default OrderDetail;
