import React, { Component } from 'react';
import styled from 'styled-components';
import { ProductConsumer } from '../context';
import { Link } from 'react-router-dom';
import Title from './Title';
import Ratings from './Ratings';
import { AuthConsumer } from '../context/AuthContext';

export default class UserDashboard extends Component {
    state = {
        orders: [],
        loading: true,
        selectedOrderForRefund: null,
        refundReason: '',
        refundMessage: '',
        isRefunding: false,
        loyaltyCodes: [],
        selectedProductForRating: null
    };

    componentDidMount() {
        this.fetchOrders();
        this.fetchLoyaltyCodes();
    }

    fetchOrders = async () => {
        const token = localStorage.getItem('glamora_token');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:5000/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const orders = await response.json();
                const parsedOrders = orders.map(o => ({
                    ...o,
                    items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
                }));
                this.setState({ orders: parsedOrders, loading: false });
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            this.setState({ loading: false });
        }
    };

    fetchLoyaltyCodes = async () => {
        const token = localStorage.getItem('glamora_token');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:5000/api/loyalty-codes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const codes = await response.json();
                this.setState({ loyaltyCodes: codes });
            }
        } catch (error) {
            console.error('Error fetching loyalty codes:', error);
        }
    };


    openRefundModal = (order) => {
        this.setState({ selectedOrderForRefund: order, refundReason: '', refundMessage: '' });
    };

    closeRefundModal = () => {
        this.setState({ selectedOrderForRefund: null, refundReason: '', refundMessage: '' });
    };

    handleRefundSubmit = async (e) => {
        e.preventDefault();
        const { selectedOrderForRefund, refundReason } = this.state;
        if (!refundReason.trim()) {
            this.setState({ refundMessage: 'Please provide a reason for the refund.' });
            return;
        }

        this.setState({ isRefunding: true });
        const token = localStorage.getItem('glamora_token');

        try {
            const response = await fetch(`http://localhost:5000/api/orders/${selectedOrderForRefund.id}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: refundReason })
            });

            const data = await response.json();
            if (response.ok) {
                this.setState({ refundMessage: 'Refund requested successfully!' });
                this.fetchOrders();
                setTimeout(this.closeRefundModal, 2000);
            } else {
                this.setState({ refundMessage: data.error || 'Failed to request refund' });
            }
        } catch (error) {
            this.setState({ refundMessage: 'Server error occurred' });
        } finally {
            this.setState({ isRefunding: false });
        }
    };

    render() {
        const { orders, loading } = this.state;

        return (
            <DashboardWrapper className="fade-in">
                <div className="container py-5">
                    <Title name="My" title="Dashboard" />

                    <div className="row stagger-children">
                        <div className="col-md-4 mb-4">
                            <div className="card dashboard-card glass-card">
                                <div className="card-body text-center">
                                    <h3 className="card-title">My Cart</h3>
                                    <ProductConsumer>
                                        {value => (
                                            <React.Fragment>
                                                <p className="display-4 text-pink">{value.cart.length}</p>
                                                <p className="text-muted">Items in cart</p>
                                                <Link to="/cart" className="btn-glamora btn-glamora-primary">
                                                    Go to Cart
                                                </Link>
                                            </React.Fragment>
                                        )}
                                    </ProductConsumer>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4 mb-4">
                            <div className="card dashboard-card glass-card">
                                <div className="card-body text-center">
                                    <h3 className="card-title">Total Orders</h3>
                                    <p className="display-4 text-pink">{orders.length}</p>
                                    <p className="text-muted">Completed orders</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4 mb-4">
                            <div className="card dashboard-card glass-card">
                                <div className="card-body text-center">
                                    <h3 className="card-title">Total Spent</h3>
                                    <p className="display-4 text-gold">
                                        ${orders.reduce((acc, order) => acc + order.total, 0).toFixed(2)}
                                    </p>
                                    <p className="text-muted">Lifetime spending</p>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="row mt-4 slide-up">
                        <div className="col-12">
                            <div className="card dashboard-card glass-card">
                                <div className="card-body d-flex align-items-center justify-content-between flex-wrap">
                                    <div>
                                        <h3 className="mb-1"><i className="fas fa-gift mr-2 text-gold"></i>Loyalty Rewards</h3>
                                        <p className="mb-0 text-muted">You have {this.state.loyaltyCodes.length} active discount codes for your next purchase.</p>
                                    </div>
                                    <div className="d-flex gap-2 flex-wrap mt-3 mt-md-0">
                                        {this.state.loyaltyCodes.length > 0 ? (
                                            this.state.loyaltyCodes.map(c => (
                                                <div key={c.id} className="loyalty-code-box">
                                                    <div className="code-text">{c.code}</div>
                                                    <small className="discount-text">10% OFF</small>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-muted font-italic">Complete more orders to earn loyalty discounts!</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NEW PURCHASE HISTORY SECTION */}
                    <div className="row mt-5 slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="col-12">
                            <h3 className="mb-4 d-flex align-items-center">
                                <i className="fas fa-history mr-3 text-pink"></i> 
                                Recently Bought
                            </h3>
                            
                            <ProductConsumer>
                                {value => {
                                    const { purchaseHistory } = value;
                                    if (loading) return <p className="text-muted">Loading purchase history...</p>;
                                    if (!purchaseHistory || purchaseHistory.length === 0) {
                                        return <div className="alert glass-card text-center py-4">You haven't bought any products yet.</div>;
                                    }
                                    
                                    // Sort by date descending
                                    const sortedHistory = [...purchaseHistory].sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
                                    
                                    return (
                                        <div className="row">
                                            {sortedHistory.map((item, index) => (
                                                <div key={`${item.orderId}-${item.productId}-${index}`} className="col-lg-6 mb-3">
                                                    <div className="history-card glass-card">
                                                        <div className="history-img-wrap">
                                                            <img src={item.img} alt={item.title} />
                                                        </div>
                                                        <div className="history-info">
                                                            <h5 className="mb-1">{item.title}</h5>
                                                            <p className="text-pink font-weight-bold mb-1">
                                                                ${item.price.toFixed(2)} <span className="text-muted font-weight-normal small ml-2">Qty: {item.count}</span>
                                                            </p>
                                                            <div className="d-flex justify-content-between align-items-center mt-2">
                                                                <small className="text-muted">
                                                                    <i className="far fa-calendar-alt mr-1"></i>
                                                                    {new Date(item.purchasedAt).toLocaleDateString()}
                                                                </small>
                                                                <button 
                                                                    className="btn-glamora btn-glamora-outline btn-sm py-1 px-3"
                                                                    onClick={() => this.setState({ selectedProductForRating: { id: item.productId, title: item.title } })}
                                                                >
                                                                    <i className="fas fa-star mr-1"></i> Rate
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }}
                            </ProductConsumer>
                        </div>
                    </div>

                    <div className="row mt-5 slide-up" style={{ animationDelay: '0.4s' }}>
                        <div className="col-12">
                            <h3 className="mb-4">Order Details</h3>
                            {loading ? (
                                <p>Loading orders...</p>
                            ) : orders.length === 0 ? (
                                <div className="alert glass-card text-center py-4">You haven't placed any orders yet.</div>
                            ) : (
                                <div className="table-responsive glass-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                    <table className="table table-hover mb-0">
                                        <thead className="thead-light">
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Date</th>
                                                <th>Items</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                                <th>Refund Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map(order => (
                                                <tr key={order.id}>
                                                    <td className="font-weight-bold">#{order.id}</td>
                                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <div className="small">
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} className="mb-1 text-muted">
                                                                    {item.count}x {item.title}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="font-weight-bold text-pink">${order.total.toFixed(2)}</td>
                                                    <td>
                                                        <span className="badge badge-glamora badge-glamora-green">
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {order.refund_status && order.refund_status !== 'none' ? (
                                                            <span className={`badge badge-glamora badge-glamora-${order.refund_status === 'approved' ? 'green' : order.refund_status === 'rejected' ? 'red' : 'gold'}`}>
                                                                {order.refund_status.toUpperCase()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted small">None</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {order.status === 'pending' || order.status === 'completed' ? (
                                                            (!order.refund_status || order.refund_status === 'none') ? (
                                                                <button 
                                                                    className="btn-glamora btn-glamora-outline btn-sm py-1 px-2"
                                                                    onClick={() => this.openRefundModal(order)}
                                                                >
                                                                    Request Refund
                                                                </button>
                                                            ) : (
                                                                <span className="text-muted small">Refund Requested</span>
                                                            )
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Refund Modal */}
                    {this.state.selectedOrderForRefund && (
                        <div className="modal fade-in" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                            <div className="modal-dialog w-100" style={{ maxWidth: '500px' }}>
                                <div className="modal-content glass-card" style={{ border: '1px solid rgba(255,255,255,0.8)' }}>
                                    <div className="modal-header border-0 pb-0">
                                        <h5 className="modal-title font-weight-bold">Request Refund for Order #{this.state.selectedOrderForRefund.id}</h5>
                                        <button type="button" className="close" onClick={this.closeRefundModal}>
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="card bg-light mb-3 border-0 rounded-lg">
                                            <div className="card-body p-3">
                                                <h6 className="card-title text-warning font-weight-bold"><i className="fas fa-info-circle mr-2"></i>Refund Policy</h6>
                                                <p className="small mb-2">Our refund policy follows a time-based deduction from the time of order:</p>
                                                <ul className="small mb-2 pl-3">
                                                    <li><strong>Within 1 day (24h):</strong> 80% refund</li>
                                                    <li><strong>Within 2 days (48h):</strong> 60% refund</li>
                                                    <li><strong>Within 1 week (7 days):</strong> 20% refund</li>
                                                    <li><strong>After 1 week:</strong> Not eligible for refund</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <form onSubmit={this.handleRefundSubmit}>
                                            <div className="form-group">
                                                <label className="font-weight-bold">Reason for Refund</label>
                                                <textarea 
                                                    className="form-control rounded-lg" 
                                                    rows="3" 
                                                    required 
                                                    value={this.state.refundReason}
                                                    onChange={(e) => this.setState({ refundReason: e.target.value })}
                                                    placeholder="Please explain why you are requesting a refund..."
                                                ></textarea>
                                            </div>
                                            {this.state.refundMessage && (
                                                <div className={`alert ${this.state.refundMessage.includes('successfully') ? 'alert-success' : 'alert-danger'} p-2 rounded-lg`}>
                                                    {this.state.refundMessage}
                                                </div>
                                            )}
                                            <div className="text-right mt-4">
                                                <button type="button" className="btn text-muted mr-3" onClick={this.closeRefundModal}>Cancel</button>
                                                <button type="submit" className="btn-glamora btn-glamora-primary" disabled={this.state.isRefunding}>
                                                    {this.state.isRefunding ? 'Submitting...' : 'Submit Request'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rating Modal */}
                    {this.state.selectedProductForRating && (
                        <div className="modal fade-in" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
                            <div className="modal-dialog w-100" style={{ maxWidth: '600px' }}>
                                <div className="modal-content glass-card" style={{ border: '1px solid rgba(255,255,255,0.8)' }}>
                                    <div className="modal-header border-0">
                                        <h5 className="modal-title font-weight-bold">Rate {this.state.selectedProductForRating.title}</h5>
                                        <button type="button" className="close" onClick={() => this.setState({ selectedProductForRating: null })}>
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body pt-0" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                        <div className="alert bg-light border-0 rounded-lg py-2 mb-4 text-center">
                                            <i className="fas fa-heart text-pink mr-2"></i>
                                            Your feedback helps others!
                                        </div>
                                        <Ratings 
                                            productId={this.state.selectedProductForRating.id} 
                                            allowAdd={true}
                                            onRatingSuccess={() => {
                                                setTimeout(() => this.setState({ selectedProductForRating: null }), 1500);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </DashboardWrapper>
        );
    }
}

const DashboardWrapper = styled.div`
    min-height: 80vh;
    
    .dashboard-card {
        border: none;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        height: 100%;
        
        &:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(212, 86, 125, 0.15);
        }
    }
    
    .card-title {
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        font-size: 1.2rem;
        margin-bottom: 1rem;
    }
    
    .display-4 {
        font-weight: 700;
        font-size: 3rem;
        margin-bottom: 0.5rem;
    }
    
    .table-responsive {
        background: rgba(255,255,255,0.6);
    }
    
    .table {
        th {
            border-top: none;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
            color: var(--mainGrey);
        }
        td {
            vertical-align: middle;
        }
    }

    .loyalty-code-box {
        background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6));
        border: 1px solid rgba(212, 86, 125, 0.2);
        border-radius: 12px;
        padding: 0.5rem 1.2rem;
        text-align: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        
        .code-text {
            font-size: 1.2rem;
            color: var(--mainPink);
            font-weight: 700;
            letter-spacing: 1.5px;
            font-family: 'Courier New', monospace;
        }
        .discount-text {
            color: var(--mainGold);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    }

    /* History Card */
    .history-card {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: 16px;
        gap: 1rem;
        transition: transform 0.3s ease;
        
        &:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(212, 86, 125, 0.15);
        }
    }
    
    .history-img-wrap {
        width: 80px;
        height: 80px;
        border-radius: 12px;
        overflow: hidden;
        flex-shrink: 0;
        background: var(--lightGrey);
        
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }
    
    .history-info {
        flex-grow: 1;
        
        h5 {
            font-size: 1.05rem;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
        }
    }
`;
