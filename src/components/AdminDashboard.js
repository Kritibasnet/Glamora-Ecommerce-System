import React, { Component } from 'react';
import styled from 'styled-components';
import Title from './Title';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { storeProducts } from '../data';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default class AdminDashboard extends Component {
    // Form state for adding product
    productFormRef = React.createRef();
    state = {
        stats: null,
        users: [],
        orders: [],
        analytics: null,
        deletedProducts: [],
        customProducts: [],
        staticOverrides: [],
        loading: true,
        activeTab: 'analytics',
        newProduct: {
            title: '',
            price: '',
            company: '',
            category: '',
            info: '',
            image: null,
            inStock: true,
            stockCount: 100
        },
        editingProduct: null,
        submittingProduct: false,
        showNotifications: false,
        dismissedRefundIds: JSON.parse(localStorage.getItem('dismissedRefundIds') || '[]'),
        conversations: [],
        selectedConversation: null,
        activeChatMessages: [],
        chatInput: ''
    };

    componentDidMount() {
        this.fetchData();
        // Poll for new refund requests every 30 seconds
        this._pollInterval = setInterval(() => this.fetchData(), 30000);
    }

    componentWillUnmount() {
        clearInterval(this._pollInterval);
    }
    // ... (skipping unchanged lines)


    fetchData = async () => {
        const token = localStorage.getItem('glamora_token');
        if (!token) return;

        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const [statsRes, usersRes, ordersRes, analyticsRes, deletedRes, productsRes] = await Promise.all([
                fetch('http://localhost:5000/api/admin/stats', { headers }),
                fetch('http://localhost:5000/api/admin/users', { headers }),
                fetch('http://localhost:5000/api/admin/orders', { headers }),
                fetch('http://localhost:5000/api/admin/analytics', { headers }),
                fetch('http://localhost:5000/api/admin/deleted-products', { headers }),
                fetch('http://localhost:5000/api/products')
            ]);

            if (statsRes.ok && usersRes.ok && ordersRes.ok && analyticsRes.ok && deletedRes.ok && productsRes.ok) {
                const stats = await statsRes.json();
                const users = await usersRes.json();
                const orders = await ordersRes.json();
                const analytics = await analyticsRes.json();
                const deletedProducts = await deletedRes.json();
                const productsData = await productsRes.json();

                // Handle both array and object responses for backward compatibility
                const customProducts = Array.isArray(productsData) ? productsData : (productsData.customProducts || []);
                const staticOverrides = productsData.staticOverrides || [];

                this.setState({
                    stats,
                    users,
                    orders,
                    analytics,
                    deletedProducts,
                    customProducts,
                    staticOverrides,
                    loading: false
                });
                this.fetchConversations();
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
            this.setState({ loading: false });
        }
    };

    handleDeleteOrder = async (orderId) => {
        if (!window.confirm(`Are you sure you want to delete order #${orderId}?`)) {
            return;
        }

        const token = localStorage.getItem('glamora_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}`, {
                method: 'DELETE',
                headers
            });

            if (res.ok) {
                this.fetchData();
                alert('Order deleted successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete order');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert(`An error occurred while deleting the order: ${error.message}`);
        }
    };

    fetchConversations = async () => {
        const token = localStorage.getItem('glamora_token');
        try {
            const response = await fetch('http://localhost:5000/api/admin/conversations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                this.setState({ conversations: data });
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    fetchUserMessages = async (userId) => {
        const token = localStorage.getItem('glamora_token');
        try {
            const response = await fetch(`http://localhost:5000/api/admin/messages/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                this.setState({ activeChatMessages: data, selectedConversation: userId });
            }
        } catch (error) {
            console.error('Error fetching user messages:', error);
        }
    };

    handleSendReply = async (e) => {
        e.preventDefault();
        const { chatInput, selectedConversation } = this.state;
        if (!chatInput.trim() || !selectedConversation) return;

        const token = localStorage.getItem('glamora_token');
        try {
            await fetch(`http://localhost:5000/api/admin/messages/${selectedConversation}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: chatInput })
            });
            this.setState({ chatInput: '' });
            this.fetchUserMessages(selectedConversation);
        } catch (error) {
            console.error('Error sending reply:', error);
        }
    };

    handleRefundAction = async (orderId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} the refund for order #${orderId}?`)) {
            return;
        }

        const token = localStorage.getItem('glamora_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/refund-${action}`, {
                method: 'POST',
                headers
            });

            if (res.ok) {
                this.fetchData();
                alert(`Refund ${action}d successfully`);
            } else {
                const data = await res.json();
                alert(data.error || `Failed to ${action} refund`);
            }
        } catch (error) {
            console.error(`Error ${action}ing refund:`, error);
            alert(`An error occurred: ${error.message}`);
        }
    };

    handleDeleteProduct = async (productId) => {
        const product = storeProducts.find(p => p.id === productId);
        if (!window.confirm(`Are you sure you want to delete "${product?.title}"? This will hide it from the store.`)) {
            return;
        }

        const token = localStorage.getItem('glamora_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const res = await fetch(`http://localhost:5000/api/admin/products/${productId}`, {
                method: 'DELETE',
                headers
            });

            if (res.ok) {
                this.fetchData();
                alert('Product deleted successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('An error occurred while deleting the product');
        }
    };

    handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}" (ID: ${userId})? This will also delete all their orders and cart items. THIS ACTION CANNOT BE UNDONE.`)) {
            return;
        }

        const token = localStorage.getItem('glamora_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers
            });

            const data = await res.json().catch(() => null);

            if (res.ok) {
                this.fetchData();
                alert('User deleted successfully');
            } else {
                alert(data?.error || 'Failed to delete user. The server might not be running the latest code. Please restart your server.');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(`An error occurred while deleting the user: ${error.message}`);
        }
    };

    handleProductFormChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            this.setState({
                newProduct: { ...this.state.newProduct, image: files[0] }
            });
        } else {
            this.setState({
                newProduct: { ...this.state.newProduct, [name]: value }
            });
        }
    };

    handleAddProduct = async (e) => {
        e.preventDefault();
        const { newProduct } = this.state;

        if (!newProduct.title || !newProduct.price || !newProduct.company || !newProduct.image) {
            alert('Please fill in all required fields and upload an image');
            return;
        }

        this.setState({ submittingProduct: true });

        const formData = new FormData();
        formData.append('title', newProduct.title);
        formData.append('price', newProduct.price);
        formData.append('company', newProduct.company);
        formData.append('category', newProduct.category || 'General');
        formData.append('info', newProduct.info);
        formData.append('image', newProduct.image);
        formData.append('inStock', newProduct.inStock !== undefined ? newProduct.inStock : true);
        formData.append('stockCount', newProduct.stockCount || 100);

        const token = localStorage.getItem('glamora_token');

        try {
            const res = await fetch('http://localhost:5000/api/admin/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json().catch(() => ({ error: 'Server returned non-JSON response' }));

            if (res.ok) {
                alert('Product added successfully!');
                this.setState({
                    newProduct: { title: '', price: '', company: '', info: '', image: null },
                    submittingProduct: false
                });
                if (this.productFormRef.current) this.productFormRef.current.reset();
                this.fetchData();
            } else {
                alert(data.error || 'Failed to add product. Please check if the server is running correctly.');
                this.setState({ submittingProduct: false });
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert(`Network error or Server is not responding: ${error.message}`);
            this.setState({ submittingProduct: false });
        }
    };

    handleEditProductClick = (product) => {
        this.setState({
            editingProduct: {
                ...product,
                newImage: null
            }
        });
    };

    handleCancelEdit = () => {
        this.setState({ editingProduct: null });
    };

    handleEditProductChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            this.setState({
                editingProduct: { ...this.state.editingProduct, newImage: files[0] }
            });
        } else {
            this.setState({
                editingProduct: { ...this.state.editingProduct, [name]: value }
            });
        }
    };

    handleUpdateProduct = async (e) => {
        e.preventDefault();
        const { editingProduct } = this.state;

        if (!editingProduct.title || !editingProduct.price || !editingProduct.company) {
            alert('Please fill in all required fields');
            return;
        }

        this.setState({ submittingProduct: true });

        const formData = new FormData();
        formData.append('title', editingProduct.title);
        formData.append('price', editingProduct.price);
        formData.append('company', editingProduct.company);
        formData.append('category', editingProduct.category || 'General');
        formData.append('info', editingProduct.info || '');
        if (editingProduct.newImage) {
            formData.append('image', editingProduct.newImage);
        }
        formData.append('inStock', editingProduct.inStock);
        formData.append('stockCount', editingProduct.stockCount);

        const token = localStorage.getItem('glamora_token');

        try {
            const res = await fetch(`http://localhost:5000/api/admin/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json().catch(() => ({ error: 'Server returned non-JSON response' }));

            if (res.ok) {
                alert('Product updated successfully!');
                this.setState({ editingProduct: null, submittingProduct: false });
                this.fetchData();
            } else {
                alert(data.error || 'Failed to update product');
                this.setState({ submittingProduct: false });
            }
        } catch (error) {
            console.error('Error updating product:', error);
            alert(`Network error: ${error.message}`);
            this.setState({ submittingProduct: false });
        }
    };

    render() {
        const { stats, users, orders, analytics, deletedProducts, loading, activeTab } = this.state;

        if (loading) {
            return <div className="container py-5 text-center">Loading admin dashboard...</div>;
        }

        // Filter out deleted products
        const deletedProductIds = deletedProducts.map(dp => parseInt(dp.product_id));

        // Apply static overrides if they exist
        const updatedStoreProducts = storeProducts.map(product => {
            const override = (this.state.staticOverrides || []).find(o => o.id === product.id);
            if (override) {
                const merged = { ...product };
                // Only override if the value is not null/undefined
                if (override.title) merged.title = override.title;
                if (override.price) merged.price = override.price;
                if (override.company) merged.company = override.company;
                if (override.info) merged.info = override.info;
                if (override.img) merged.img = override.img;

                if (override.inStock !== undefined) merged.inStock = override.inStock;
                if (override.stockCount !== undefined) {
                    merged.stockCount = override.stockCount;
                } else {
                    merged.stockCount = product.id % 2 === 0 ? 200 : 150;
                }
                return merged;
            }
            // If no override, assign default deterministic stock
            return {
                ...product,
                stockCount: product.id % 2 === 0 ? 200 : 150,
                inStock: true
            };
        });

        const allProducts = [...updatedStoreProducts, ...(this.state.customProducts || [])];
        const activeProducts = allProducts.filter(p => !deletedProductIds.includes(p.id));

        return (
            <DashboardWrapper>
                <div className="container-fluid py-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <Title name="Admin" title="Dashboard" />
                        {/* Notification Bell */}
                        {(() => {
                            const { dismissedRefundIds, showNotifications } = this.state;
                            const pendingRefunds = orders.filter(
                                o => o.refund_status === 'pending' && !dismissedRefundIds.includes(o.id)
                            );
                            return (
                                <div style={{ position: 'relative', marginRight: '1rem' }}>
                                    <button
                                        onClick={() => this.setState({ showNotifications: !showNotifications })}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            position: 'relative', padding: '0.5rem'
                                        }}
                                        title="Refund Notifications"
                                    >
                                        <i className="fas fa-bell" style={{ fontSize: '1.8rem', color: pendingRefunds.length > 0 ? '#e83e5a' : '#aaa' }}></i>
                                        {pendingRefunds.length > 0 && (
                                            <span style={{
                                                position: 'absolute', top: '0', right: '0',
                                                background: '#e83e5a', color: 'white',
                                                borderRadius: '50%', width: '20px', height: '20px',
                                                fontSize: '0.7rem', fontWeight: 'bold',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                animation: 'bellPulse 1.5s infinite'
                                            }}>
                                                {pendingRefunds.length}
                                            </span>
                                        )}
                                    </button>

                                    {showNotifications && (
                                        <div style={{
                                            position: 'absolute', right: 0, top: '110%',
                                            width: '360px', background: 'white',
                                            borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                                            zIndex: 9999, overflow: 'hidden',
                                            animation: 'slideDown 0.2s ease'
                                        }}>
                                            <div style={{
                                                background: 'linear-gradient(135deg, #e83e5a, #c0392b)',
                                                color: 'white', padding: '0.8rem 1rem',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}>
                                                <strong><i className="fas fa-bell mr-2"></i>Refund Requests</strong>
                                                <button
                                                    onClick={() => this.setState({ showNotifications: false })}
                                                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
                                                >×</button>
                                            </div>
                                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                                {pendingRefunds.length === 0 ? (
                                                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#999' }}>
                                                        <i className="fas fa-check-circle" style={{ fontSize: '2rem', color: '#28a745' }}></i>
                                                        <p className="mt-2 mb-0">No pending refund requests</p>
                                                    </div>
                                                ) : pendingRefunds.map(order => (
                                                    <div key={order.id} style={{
                                                        padding: '0.9rem 1rem',
                                                        borderBottom: '1px solid #f0f0f0',
                                                        display: 'flex', flexDirection: 'column', gap: '0.3rem'
                                                    }}>
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <strong style={{ color: '#e83e5a' }}>Order #{order.id}</strong>
                                                                <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '0.5rem' }}>
                                                                    {order.username}
                                                                </span>
                                                            </div>
                                                            <span style={{
                                                                background: '#fff3cd', color: '#856404',
                                                                borderRadius: '20px', padding: '0.1rem 0.6rem',
                                                                fontSize: '0.75rem', fontWeight: '600'
                                                            }}>PENDING</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.82rem', color: '#555' }}>
                                                            <i className="fas fa-comment-alt mr-1"></i>
                                                            {order.refund_reason}
                                                        </div>
                                                        <div style={{ fontSize: '0.82rem', color: '#28a745', fontWeight: '600' }}>
                                                            <i className="fas fa-dollar-sign mr-1"></i>
                                                            Refund Amount: ${order.refund_amount?.toFixed(2)}
                                                        </div>
                                                        <div className="d-flex" style={{ gap: '0.5rem', marginTop: '0.3rem' }}>
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                onClick={() => {
                                                                    this.handleRefundAction(order.id, 'approve');
                                                                    this.setState({ showNotifications: false });
                                                                }}
                                                            >✓ Approve</button>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => {
                                                                    this.handleRefundAction(order.id, 'reject');
                                                                    this.setState({ showNotifications: false });
                                                                }}
                                                            >✗ Reject</button>
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => {
                                                                    const updated = [...dismissedRefundIds, order.id];
                                                                    localStorage.setItem('dismissedRefundIds', JSON.stringify(updated));
                                                                    this.setState({ dismissedRefundIds: updated });
                                                                }}
                                                            >Dismiss</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {pendingRefunds.length > 0 && (
                                                <div style={{ padding: '0.6rem 1rem', textAlign: 'right', borderTop: '1px solid #eee' }}>
                                                    <button
                                                        className="btn btn-sm btn-link text-muted"
                                                        onClick={() => this.setState({ activeTab: 'orders', showNotifications: false })}
                                                    >View all in Orders tab →</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Stats Cards */}
                    <div className="row mb-5">
                        <div className="col-lg-3 col-md-6 mb-4">
                            <StatsCard className="bg-gradient-primary">
                                <div className="card-body text-center">
                                    <i className="fas fa-users fa-3x mb-3"></i>
                                    <h3>Total Users</h3>
                                    <p className="display-4">{stats.totalUsers}</p>
                                </div>
                            </StatsCard>
                        </div>
                        <div className="col-lg-3 col-md-6 mb-4">
                            <StatsCard className="bg-gradient-success">
                                <div className="card-body text-center">
                                    <i className="fas fa-shopping-cart fa-3x mb-3"></i>
                                    <h3>Total Orders</h3>
                                    <p className="display-4">{stats.totalOrders}</p>
                                </div>
                            </StatsCard>
                        </div>
                        <div className="col-lg-3 col-md-6 mb-4">
                            <StatsCard className="bg-gradient-info">
                                <div className="card-body text-center">
                                    <i className="fas fa-dollar-sign fa-3x mb-3"></i>
                                    <h3>Total Revenue</h3>
                                    <p className="display-4">${stats.totalRevenue.toFixed(2)}</p>
                                </div>
                            </StatsCard>
                        </div>
                        <div className="col-lg-3 col-md-6 mb-4">
                            <StatsCard className="bg-gradient-warning">
                                <div className="card-body text-center">
                                    <i className="fas fa-chart-line fa-3x mb-3"></i>
                                    <h3>Avg Order Value</h3>
                                    <p className="display-4">${analytics?.avgOrderValue ? analytics.avgOrderValue.toFixed(2) : '0.00'}</p>
                                </div>
                            </StatsCard>
                        </div>
                    </div>

                    {/* Tabs */}
                    <TabsWrapper className="mb-4">
                        <button
                            className={activeTab === 'analytics' ? 'active' : ''}
                            onClick={() => this.setState({ activeTab: 'analytics' })}
                        >
                            <i className="fas fa-chart-bar mr-2"></i> Analytics
                        </button>
                        <button
                            className={activeTab === 'products' ? 'active' : ''}
                            onClick={() => this.setState({ activeTab: 'products' })}
                        >
                            <i className="fas fa-box mr-2"></i> Products
                        </button>
                        <button
                            className={activeTab === 'add-product' ? 'active' : ''}
                            onClick={() => this.setState({ activeTab: 'add-product' })}
                        >
                            <i className="fas fa-plus-circle mr-2"></i> Add Product
                        </button>
                        <button
                            className={activeTab === 'orders' ? 'active' : ''}
                            onClick={() => this.setState({ activeTab: 'orders' })}
                        >
                            <i className="fas fa-receipt mr-2"></i> Orders
                        </button>
                        <button
                            className={activeTab === 'users' ? 'active' : ''}
                            onClick={() => this.setState({ activeTab: 'users' })}
                        >
                            <i className="fas fa-users mr-2"></i> Users
                        </button>
                        <button
                            className={activeTab === 'messages' ? 'active' : ''}
                            onClick={() => this.setState({ activeTab: 'messages' }, this.fetchConversations)}
                        >
                            <i className="fas fa-comments mr-2"></i> Messages
                        </button>
                    </TabsWrapper>

                    {/* Content */}
                    <div className="tab-content">
                        {activeTab === 'analytics' && analytics && (
                            <div>
                                {/* Charts Row 1 */}
                                <div className="row mb-4">
                                    <div className="col-lg-8 mb-4">
                                        <ChartCard>
                                            <h4><i className="fas fa-chart-line mr-2"></i>Sales & Revenue Trend (Last 30 Days)</h4>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={analytics.salesOverTime}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis yAxisId="left" />
                                                    <YAxis yAxisId="right" orientation="right" />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" name="Orders" strokeWidth={2} />
                                                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue ($)" strokeWidth={2} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </ChartCard>
                                    </div>
                                    <div className="col-lg-4 mb-4">
                                        <ChartCard>
                                            <h4><i className="fas fa-user-check mr-2"></i>Customer Insights</h4>
                                            <div className="text-center py-4">
                                                <div className="mb-4">
                                                    <h2 className="text-primary">{analytics.customerStats?.total_customers || 0}</h2>
                                                    <p className="text-muted">Total Customers</p>
                                                </div>
                                                <div className="mb-4">
                                                    <h2 className="text-success">{analytics.customerStats?.returning_customers || 0}</h2>
                                                    <p className="text-muted">Returning Customers</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-info">
                                                        {analytics.customerStats?.total_customers > 0
                                                            ? ((analytics.customerStats.returning_customers / analytics.customerStats.total_customers) * 100).toFixed(1)
                                                            : 0}%
                                                    </h3>
                                                    <p className="text-muted">Retention Rate</p>
                                                </div>
                                            </div>
                                        </ChartCard>
                                    </div>
                                </div>

                                {/* Charts Row 2 */}
                                <div className="row mb-4">
                                    <div className="col-lg-6 mb-4">
                                        <ChartCard>
                                            <h4><i className="fas fa-trophy mr-2"></i>Top Selling Products</h4>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={analytics.topProducts.slice(0, 5)}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="product_name" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="total_sold" fill="#8884d8" name="Units Sold" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </ChartCard>
                                    </div>
                                    <div className="col-lg-6 mb-4">
                                        <ChartCard>
                                            <h4><i className="fas fa-calendar-week mr-2"></i>Revenue by Day of Week</h4>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={analytics.revenueByDayOfWeek}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="day_name" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </ChartCard>
                                    </div>
                                </div>

                                {/* Charts Row 3 */}
                                <div className="row mb-4">
                                    <div className="col-lg-12 mb-4">
                                        <ChartCard>
                                            <h4><i className="fas fa-user-plus mr-2"></i>User Growth (Last 30 Days)</h4>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <LineChart data={analytics.userGrowth}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="new_users" stroke="#ff7c7c" name="New Users" strokeWidth={2} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </ChartCard>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'messages' && (
                            <div className="row">
                                <div className="col-md-4">
                                    <ChartCard>
                                        <h4>Conversations</h4>
                                        <div className="list-group">
                                            {this.state.conversations.length === 0 ? (
                                                <div className="text-center p-3 text-muted">No messages yet</div>
                                            ) : (
                                                this.state.conversations.map(conv => (
                                                    <button
                                                        key={conv.user_id}
                                                        className={`list-group-item list-group-item-action ${this.state.selectedConversation === conv.user_id ? 'active' : ''}`}
                                                        onClick={() => this.fetchUserMessages(conv.user_id)}
                                                        style={{ textAlign: 'left' }}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <strong>{conv.username}</strong>
                                                            {conv.unread_count > 0 && <span className="badge badge-danger badge-pill">{conv.unread_count}</span>}
                                                        </div>
                                                        <small className={this.state.selectedConversation === conv.user_id ? 'text-white' : 'text-muted'}>
                                                            {conv.content.substring(0, 30)}{conv.content.length > 30 ? '...' : ''}
                                                        </small>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </ChartCard>
                                </div>
                                <div className="col-md-8">
                                    {this.state.selectedConversation ? (
                                        <ChartCard>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h4>Chat with {this.state.conversations.find(c => c.user_id === this.state.selectedConversation)?.username}</h4>
                                                <button className="btn btn-sm btn-outline-secondary" onClick={() => this.fetchUserMessages(this.state.selectedConversation)}>
                                                    <i className="fas fa-sync"></i>
                                                </button>
                                            </div>
                                            <div style={{ height: '400px', overflowY: 'auto', padding: '15px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {this.state.activeChatMessages.map((msg, i) => (
                                                    <div key={i} className={`p-3 rounded ${msg.is_admin_reply ? 'bg-primary text-white align-self-end' : 'bg-white text-dark align-self-start border'}`} style={{ maxWidth: '75%', width: 'fit-content', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                                        <div style={{ fontSize: '0.95rem' }}>{msg.content}</div>
                                                        <small style={{ fontSize: '0.7rem', opacity: 0.8, display: 'block', marginTop: '5px', textAlign: msg.is_admin_reply ? 'right' : 'left' }}>
                                                            {new Date(msg.timestamp).toLocaleString()}
                                                        </small>
                                                    </div>
                                                ))}
                                            </div>
                                            <form onSubmit={this.handleSendReply} className="d-flex">
                                                <input
                                                    type="text"
                                                    className="form-control mr-2"
                                                    placeholder="Type your reply..."
                                                    value={this.state.chatInput}
                                                    onChange={(e) => this.setState({ chatInput: e.target.value })}
                                                    style={{ borderRadius: '20px' }}
                                                />
                                                <button type="submit" className="btn btn-primary" style={{ borderRadius: '20px', padding: '0 25px' }}>
                                                    <i className="fas fa-paper-plane mr-2"></i>Send
                                                </button>
                                            </form>
                                        </ChartCard>
                                    ) : (
                                        <ChartCard className="d-flex align-items-center justify-content-center" style={{ height: '100%', minHeight: '400px' }}>
                                            <div className="text-center text-muted">
                                                <i className="fas fa-comments fa-4x mb-3 opacity-2"></i>
                                                <p>Select a conversation from the left to start chatting with your customers</p>
                                            </div>
                                        </ChartCard>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'products' && (
                            <div className="table-responsive bg-white p-3 shadow-sm">
                                <h4 className="mb-4"><i className="fas fa-box mr-2"></i>Product Management</h4>
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Image</th>
                                            <th>Product Name</th>
                                            <th>Company</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeProducts.map(product => (
                                            <tr key={product.id}>
                                                <td>{product.id}</td>
                                                <td>
                                                    <img src={product.img} alt={product.title} style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                                </td>
                                                <td>{product.title}</td>
                                                <td>{product.company}</td>
                                                <td>{product.category || 'General'}</td>
                                                <td>${product.price}</td>
                                                <td>
                                                    <span className={`badge badge-${product.inStock ? 'success' : 'danger'}`}>
                                                        {product.inStock ? `${product.stockCount} left` : 'Out of Stock'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-outline-primary btn-sm mr-2"
                                                        onClick={() => this.handleEditProductClick(product)}
                                                    >
                                                        <i className="fas fa-edit"></i> Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => this.handleDeleteProduct(product.id)}
                                                    >
                                                        <i className="fas fa-trash"></i> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {deletedProducts.map(dp => {
                                            const product = storeProducts.find(p => p.id === parseInt(dp.product_id));
                                            if (!product) return null;
                                            return (
                                                <tr key={`deleted-${product.id}`} className="table-secondary">
                                                    <td>{product.id}</td>
                                                    <td>
                                                        <img src={product.img} alt={product.title} style={{ width: '50px', height: '50px', objectFit: 'cover', opacity: 0.5 }} />
                                                    </td>
                                                    <td><del>{product.title}</del></td>
                                                    <td><del>{product.company}</del></td>
                                                    <td><del>${product.price}</del></td>
                                                    <td>
                                                        <span className="badge badge-danger">Deleted</span>
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">Deleted on {new Date(dp.deleted_at).toLocaleDateString()}</small>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'add-product' && (
                            <div className="bg-white p-4 shadow-sm border-radius-15">
                                <h4 className="mb-4"><i className="fas fa-plus-circle mr-2"></i>Add New Product</h4>
                                <FormWrapper onSubmit={this.handleAddProduct} ref={this.productFormRef}>
                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label>Product Title*</label>
                                            <input
                                                type="text"
                                                name="title"
                                                className="form-control"
                                                required
                                                onChange={this.handleProductFormChange}
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label>Company/Brand*</label>
                                            <input
                                                type="text"
                                                name="company"
                                                className="form-control"
                                                required
                                                onChange={this.handleProductFormChange}
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label>Category</label>
                                            <select
                                                name="category"
                                                className="form-control"
                                                onChange={this.handleProductFormChange}
                                                required
                                                style={{ fontSize: '0.85rem', height: '40px', padding: '5px 10px' }}
                                            >
                                                <option value="" disabled hidden>Select Category</option>
                                                <option value="Accessories">Accessories</option>
                                                <option value="Skincare">Skincare</option>
                                                <option value="Makeup">Makeup</option>
                                                <option value="Perfume & body lotion">Perfume & body lotion</option>
                                                <option value="Hair & body care">Hair & body care</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label>Price ($)*</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="price"
                                                className="form-control"
                                                required
                                                onChange={this.handleProductFormChange}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label>Product Image*</label>
                                            <input
                                                type="file"
                                                name="image"
                                                accept="image/*"
                                                className="form-control-file"
                                                required
                                                onChange={this.handleProductFormChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <div className="custom-control custom-checkbox">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="inStockAdd"
                                                name="inStock"
                                                checked={this.state.newProduct.inStock}
                                                onChange={(e) => this.setState({ newProduct: { ...this.state.newProduct, inStock: e.target.checked } })}
                                            />
                                            <label className="custom-control-label" htmlFor="inStockAdd">Available in Stock</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label>Stock Count</label>
                                        <input
                                            type="number"
                                            name="stockCount"
                                            className="form-control"
                                            value={this.state.newProduct.stockCount}
                                            onChange={(e) => this.setState({ newProduct: { ...this.state.newProduct, stockCount: e.target.value } })}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label>Product Info/Description</label>
                                        <textarea
                                            name="info"
                                            className="form-control"
                                            rows="4"
                                            onChange={this.handleProductFormChange}
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-5"
                                        disabled={this.state.submittingProduct}
                                    >
                                        {this.state.submittingProduct ? 'Adding...' : 'Add Product'}
                                    </button>
                                </FormWrapper>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="table-responsive bg-white p-3 shadow-sm">
                                <h4 className="mb-4"><i className="fas fa-receipt mr-2"></i>Order Management</h4>
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>User</th>
                                            <th>Date</th>
                                            <th>Items</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Refund</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => (
                                            <tr key={order.id}>
                                                <td>#{order.id}</td>
                                                <td>
                                                    <div>{order.username}</div>
                                                    <small className="text-muted">{order.email}</small>
                                                </td>
                                                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx}>
                                                            {item.count}x {item.title}
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>${order.total.toFixed(2)}</td>
                                                <td>
                                                    <span className="badge badge-success">{order.status}</span>
                                                </td>
                                                <td>
                                                    {order.refund_status && order.refund_status !== 'none' ? (
                                                        <div>
                                                            <span className={`badge badge-${order.refund_status === 'approved' ? 'success' : order.refund_status === 'rejected' ? 'danger' : 'warning'}`}>
                                                                {order.refund_status.toUpperCase()}
                                                            </span>
                                                            {order.refund_status === 'pending' && (
                                                                <div className="mt-2">
                                                                    <small className="d-block mb-1 border p-1 bg-light"><strong>Reason:</strong> {order.refund_reason}</small>
                                                                    <small className="d-block mb-2 text-primary"><strong>Amt:</strong> ${order.refund_amount?.toFixed(2)}</small>
                                                                    <button 
                                                                        className="btn btn-sm btn-success mr-1"
                                                                        onClick={() => this.handleRefundAction(order.id, 'approve')}
                                                                    >Approve</button>
                                                                    <button 
                                                                        className="btn btn-sm btn-danger"
                                                                        onClick={() => this.handleRefundAction(order.id, 'reject')}
                                                                    >Reject</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : <span className="text-muted">No Request</span>}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => this.handleDeleteOrder(order.id)}
                                                    >
                                                        <i className="fas fa-trash"></i> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="table-responsive bg-white p-3 shadow-sm">
                                <h4 className="mb-4"><i className="fas fa-users mr-2"></i>User Management</h4>
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>User ID</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Cart Items</th>
                                            <th>Orders</th>
                                            <th>Total Spent</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id}>
                                                <td>{user.id}</td>
                                                <td>{user.username}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={`badge badge-${user.role === 'admin' ? 'danger' : 'secondary'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td>{user.cart_count}</td>
                                                <td>{user.order_count}</td>
                                                <td>${(user.total_spent || 0).toFixed(2)}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => this.handleDeleteUser(user.id, user.username)}
                                                        title="Delete User"
                                                    >
                                                        <i className="fas fa-trash"></i> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Modal */}
                {this.state.editingProduct && (
                    <ModalOverlay>
                        <div className="modal-content-wrapper bg-white p-4 shadow-lg border-radius-15">
                            <h4 className="mb-4"><i className="fas fa-edit mr-2"></i>Edit Product</h4>
                            <FormWrapper onSubmit={this.handleUpdateProduct}>
                                <div className="row">
                                    <div className="col-md-4 mb-3">
                                        <label>Product Title*</label>
                                        <input
                                            type="text"
                                            name="title"
                                            className="form-control"
                                            required
                                            value={this.state.editingProduct.title}
                                            onChange={this.handleEditProductChange}
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label>Company/Brand*</label>
                                        <input
                                            type="text"
                                            name="company"
                                            className="form-control"
                                            required
                                            value={this.state.editingProduct.company}
                                            onChange={this.handleEditProductChange}
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label>Category</label>
                                        <select
                                            name="category"
                                            className="form-control"
                                            value={this.state.editingProduct.category || ''}
                                            onChange={this.handleEditProductChange}
                                            required
                                            style={{ fontSize: '0.85rem', height: '40px', padding: '5px 10px' }}
                                        >
                                            <option value="" disabled hidden>Select Category</option>
                                            <option value="Accessories">Accessories</option>
                                            <option value="Skincare">Skincare</option>
                                            <option value="Makeup">Makeup</option>
                                            <option value="Perfume & body lotion">Perfume & body lotion</option>
                                            <option value="Hair & body care">Hair & body care</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label>Price ($)*</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="price"
                                            className="form-control"
                                            required
                                            value={this.state.editingProduct.price}
                                            onChange={this.handleEditProductChange}
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label>Change Image (Optional)</label>
                                        <input
                                            type="file"
                                            name="image"
                                            accept="image/*"
                                            className="form-control-file"
                                            onChange={this.handleEditProductChange}
                                        />
                                        <small className="text-muted">Leave empty to keep current image</small>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <div className="custom-control custom-checkbox">
                                        <input
                                            type="checkbox"
                                            className="custom-control-input"
                                            id="inStockEdit"
                                            name="inStock"
                                            checked={this.state.editingProduct.inStock}
                                            onChange={(e) => this.setState({ editingProduct: { ...this.state.editingProduct, inStock: e.target.checked } })}
                                        />
                                        <label className="custom-control-label" htmlFor="inStockEdit">Available in Stock</label>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label>Stock Count</label>
                                    <input
                                        type="number"
                                        name="stockCount"
                                        className="form-control"
                                        value={this.state.editingProduct.stockCount}
                                        onChange={(e) => this.setState({ editingProduct: { ...this.state.editingProduct, stockCount: e.target.value } })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label>Product Info/Description</label>
                                    <textarea
                                        name="info"
                                        className="form-control"
                                        rows="4"
                                        value={this.state.editingProduct.info}
                                        onChange={this.handleEditProductChange}
                                    ></textarea>
                                </div>
                                <div className="d-flex justify-content-end gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-secondary px-4 mr-2"
                                        onClick={this.handleCancelEdit}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-5"
                                        disabled={this.state.submittingProduct}
                                    >
                                        {this.state.submittingProduct ? 'Updating...' : 'Update Product'}
                                    </button>
                                </div>
                            </FormWrapper>
                        </div>
                    </ModalOverlay>
                )}
            </DashboardWrapper >
        );
    }
}

const DashboardWrapper = styled.div`
    min-height: 80vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    
    .container-fluid {
        max-width: 1400px;
    }

    @keyframes bellPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); box-shadow: 0 0 0 4px rgba(232, 62, 90, 0.3); }
    }

    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to   { opacity: 1; transform: translateY(0); }
    }
`;

const StatsCard = styled.div`
    border: none;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    color: white;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    
    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 40px rgba(0,0,0,0.2);
    }
    
    &.bg-gradient-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    &.bg-gradient-success {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    &.bg-gradient-info {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    
    &.bg-gradient-warning {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }
    
    i {
        opacity: 0.8;
    }
    
    h3 {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }
    
    .display-4 {
        font-size: 2.5rem;
        font-weight: bold;
    }
`;

const TabsWrapper = styled.div`
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 2rem;
    
    button {
        padding: 1rem 2rem;
        border: none;
        background: white;
        color: var(--mainGrey);
        font-weight: 600;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        cursor: pointer;
        
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            color: var(--mainPink);
        }
        
        &.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        i {
            margin-right: 0.5rem;
        }
    }
`;

const ChartCard = styled.div`
    background: white;
    padding: 2rem;
    border-radius: 15px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    height: 100%;
    
    h4 {
        color: var(--mainDark);
        margin-bottom: 1.5rem;
        font-weight: 600;
        
        i {
            color: var(--mainPink);
        }
    }
`;

const FormWrapper = styled.form`
    .form-control {
        border-radius: 8px;
        padding: 0.75rem;
        border: 1px solid #ced4da;
        
        &:focus {
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
            border-color: #667eea;
        }
    }
    
    label {
        font-weight: 500;
        color: #495057;
        margin-bottom: 0.5rem;
    }
    
    .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        padding: 0.75rem 2rem;
        font-weight: 600;
        border-radius: 8px;
        transition: all 0.3s ease;
        
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
    }
`;

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    
    .modal-content-wrapper {
        width: 100%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from { transform: translateY(-30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;
