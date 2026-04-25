import React, { Component } from 'react';
import Title from '../Title';
import CartColumns from './CartColumns';
import EmptyCart from './EmptyCart';
import { ProductConsumer } from '../../context';
import CartList from './CartList';
import CartTotals from './CartTotals';
import RecentlyPurchased from './RecentlyPurchased';

export default class Cart extends Component {
    state = {
        showSuccessModal: false
    };

    setShowSuccessModal = (show) => {
        this.setState({ showSuccessModal: show });
    };

    componentDidMount() {
        document.title = 'Shopping Cart - Glamora';
    }

    render() {
        return (
            <section>
                <ProductConsumer>
                    {value => {
                        const { cart, orders, orderLoading } = value;
                        if (cart.length > 0) {
                            return (
                                <React.Fragment>
                                    <Title name="your" title="cart" />
                                    <CartList value={value} />
                                    <CartTotals value={value} history={this.props.history} setShowSuccessModal={this.setShowSuccessModal} />
                                    <RecentlyPurchased />
                                </React.Fragment>

                            );
                        } else {
                            if (!orderLoading && orders.length > 0) {
                                return (
                                    <React.Fragment>
                                        <RecentlyPurchased hideHeader={true} />
                                    </React.Fragment>
                                );
                            }
                            return (
                                <React.Fragment>
                                    <EmptyCart />
                                    <RecentlyPurchased />
                                </React.Fragment>
                            );
                        }
                    }}
                </ProductConsumer>

                {/* Success Modal */}
                {this.state.showSuccessModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999
                    }}>
                        <div className="card p-5 text-center shadow-lg" style={{ maxWidth: '400px', borderRadius: '15px' }}>
                            <div className="mb-3">
                                <i className="fas fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                            </div>
                            <h2 className="text-title text-success mb-3">Success!!</h2>
                            <p className="lead mb-4">Please check your email for order details.</p>
                            <div className="spinner-border text-success" role="status">
                                <span className="sr-only">Redirecting...</span>
                            </div>
                            <p className="mt-3 text-muted">Redirecting to your dashboard...</p>
                        </div>
                    </div>
                )}
            </section>
        )
    }
}
