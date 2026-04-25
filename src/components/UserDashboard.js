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
                // Ensure parsed items
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
                this.fetchOrders(); // refresh order list
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
            <DashboardWrapper>
                <div className="container py-5">
                    <Title name="My" title="Dashboard" />

                    <div className="row">
                        <div className="col-md-4 mb-4">
                            <div className="card dashboard-card">
                                <div className="card-body text-center">
                                    <h3>My Cart</h3>
                                    <ProductConsumer>
                                        {value => (
                                            <React.Fragment>
                                                <p className="display-4">{value.cart.length}</p>
                                                <p>Items in cart</p>
                                                <Link to="/cart" className="btn btn-outline-primary">
                                                    Go to Cart
                                                </Link>
                                            </React.Fragment>
                                        )}
                                    </ProductConsumer>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4 mb-4">
                            <div className="card dashboard-card">
                                <div className="card-body text-center">
                                    <h3>Total Orders</h3>
                                    <p className="display-4">{orders.length}</p>
                                    <p>Completed orders</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4 mb-4">
                            <div className="card dashboard-card">
                                <div className="card-body text-center">
                                    <h3>Total Spent</h3>
                                    <p className="display-4">
                                        ${orders.reduce((acc, order) => acc + order.total, 0).toFixed(2)}
                                    </p>
                                    <p>Lifetime spending</p>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="card dashboard-card bg-light border-0 shadow-sm">
                                <div className="card-body d-flex align-items-center justify-content-between flex-wrap">
                                    <div>
                                        <h3 className="mb-1"><i className="fas fa-gift mr-2 text-primary"></i>Loyalty Rewards</h3>
                                        <p className="mb-0 text-muted">You have {this.state.loyaltyCodes.length} active discount codes for your next purchase.</p>
                                    </div>
                                    <div className="d-flex gap-2 flex-wrap mt-3 mt-md-0">
                                        {this.state.loyaltyCodes.length > 0 ? (
                                            this.state.loyaltyCodes.map(c => (
                                                <div key={c.id} className="bg-white border rounded px-3 py-2 text-center" style={{ minWidth: '120px' }}>
                                                    <div style={{ fontSize: '1.2rem', color: '#764ba2', fontWeight: 'bold', letterSpacing: '1px' }}>{c.code}</div>
                                                    <small className="text-success" style={{ fontWeight: '600' }}>10% OFF</small>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-muted italic">Complete more orders to earn loyalty discounts!</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mt-4">
                        <div className="col-12">
                            <h3 className="mb-4">Order History</h3>
                            {loading ? (
                                <p>Loading orders...</p>
                            ) : orders.length === 0 ? (
                                <div className="alert alert-info">You haven't placed any orders yet.</div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
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
                                                    <td>#{order.id}</td>
                                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        {order.items.map(item => (
                                                            <div key={item.id} className="d-flex justify-content-between align-items-center mb-1">
                                                                <span>{item.count}x {item.title}</span>
                                                                <button 
                                                                    className="btn btn-sm btn-outline-warning py-0 px-2 ml-2" 
                                                                    style={{ fontSize: '0.75rem' }}
                                                                    onClick={() => this.setState({ selectedProductForRating: item })}
                                                                    title="Rate this product"
                                                                >
                                                                    <i className="fas fa-star mr-1"></i>Rate
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </td>
                                                    <td>${order.total.toFixed(2)}</td>
                                                    <td>
                                                        <span className="badge badge-success">
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {order.refund_status && order.refund_status !== 'none' ? (
                                                            <span className={`badge badge-${order.refund_status === 'approved' ? 'success' : order.refund_status === 'rejected' ? 'danger' : 'warning'}`}>
                                                                {order.refund_status.toUpperCase()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">None</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {order.status === 'pending' || order.status === 'completed' ? (
                                                            (!order.refund_status || order.refund_status === 'none') ? (
                                                                <button 
                                                                    className="btn btn-sm btn-outline-danger"
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
                        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Request Refund for Order #{this.state.selectedOrderForRefund.id}</h5>
                                        <button type="button" className="close" onClick={this.closeRefundModal}>
                                            <span>&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="card bg-light mb-3">
                                            <div className="card-body p-3">
                                                <h6 className="card-title text-warning"><i className="fas fa-info-circle mr-2"></i>Refund Policy</h6>
                                                <p className="small mb-2">Our refund policy follows a time-based deduction from the time of order:</p>
                                                <ul className="small mb-2 pl-3">
                                                    <li><strong>Within 1 day (24h):</strong> 80% refund</li>
                                                    <li><strong>Within 2 days (48h):</strong> 60% refund</li>
                                                    <li><strong>Within 1 week (7 days):</strong> 20% refund</li>
                                                    <li><strong>After 1 week:</strong> Not eligible for refund</li>
                                                </ul>
                                                <small className="text-muted"><strong>Note:</strong> All refund requests are validated by our team and approved only for valid reasons.</small>
                                            </div>
                                        </div>
                                        <form onSubmit={this.handleRefundSubmit}>
                                            <div className="form-group">
                                                <label>Reason for Refund</label>
                                                <textarea 
                                                    className="form-control" 
                                                    rows="3" 
                                                    required 
                                                    value={this.state.refundReason}
                                                    onChange={(e) => this.setState({ refundReason: e.target.value })}
                                                    placeholder="Please explain why you are requesting a refund..."
                                                ></textarea>
                                            </div>
                                            {this.state.refundMessage && (
                                                <div className={`alert ${this.state.refundMessage.includes('successfully') ? 'alert-success' : 'alert-danger'} p-2`}>
                                                    {this.state.refundMessage}
                                                </div>
                                            )}
                                            <div className="text-right">
                                                <button type="button" className="btn btn-secondary mr-2" onClick={this.closeRefundModal}>Cancel</button>
                                                <button type="submit" className="btn btn-danger" disabled={this.state.isRefunding}>
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
                        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
                            <div className="modal-dialog modal-lg modal-dialog-centered">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Rate {this.state.selectedProductForRating.title}</h5>
                                        <button type="button" className="close" onClick={() => this.setState({ selectedProductForRating: null })}>
                                            <span>&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                        <div className="alert alert-info py-2">
                                            <i className="fas fa-info-circle mr-2"></i>
                                            Your feedback helps other shoppers make better choices!
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
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        transition: transform 0.3s ease;
        
        &:hover {
            transform: translateY(-5px);
        }
    }
    
    .table {
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
`;
