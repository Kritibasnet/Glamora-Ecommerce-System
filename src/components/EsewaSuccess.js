import React, { useEffect, useState, useContext, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { ProductConsumer } from '../context';
import { AuthContext } from '../context/AuthContext';
import { generatePaymentSlip } from '../utils/pdfGenerator';
import LoyaltyPopup from './LoyaltyPopup';

function EsewaSuccess() {
    const history = useHistory();
    const location = useLocation();
    const auth = useContext(AuthContext);
    const [status, setStatus] = useState('Verifying Payment...');
    const [message, setMessage] = useState('Please wait while we process your order...');
    const [orderDetails, setOrderDetails] = useState(null);
    const [transactionId, setTransactionId] = useState('');
    const [showLoyalty, setShowLoyalty] = useState(false);
    const [itemsPurchased, setItemsPurchased] = useState(0);

    // Use a ref instead of state for the processed lock — 
    // ref updates are synchronous and don't trigger re-renders
    const processedRef = useRef(false);

    return (
        <ProductConsumer>
            {value => {
                const { cart, checkout, cartLoaded } = value;

                const handleProcess = async () => {
                    // Synchronous guard — prevents double execution
                    if (processedRef.current) return;
                    processedRef.current = true;

                    const queryParams = new URLSearchParams(location.search);
                    const data = queryParams.get('data');

                    if (!data) {
                        setStatus('Error');
                        setMessage('Missing eSewa v2 success data.');
                        setTimeout(() => history.push('/cart'), 3000);
                        return;
                    }

                    const token = localStorage.getItem('glamora_token');
                    if (!token) {
                        setStatus('Error');
                        setMessage('Please login to continue.');
                        setTimeout(() => history.push('/login'), 2000);
                        return;
                    }

                    try {
                        const response = await fetch('http://localhost:5000/api/esewa/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ data })
                        });

                        const resultData = await response.json();

                        if (response.ok && resultData.success) {
                            setStatus('Payment Verified!');
                            setMessage('Finalizing your order...');

                            const currentCart = [...cart];
                            const pendingStr = localStorage.getItem('glamora_pending_checkout');
                            const pendingData = pendingStr ? JSON.parse(pendingStr) : null;
                            const currentTotal = pendingData ? pendingData.finalTotal : value.cartTotal;
                            const loyaltyCode = pendingData ? pendingData.loyaltyCode : null;
                            const address = pendingData ? pendingData.address : '';

                            const result = await checkout(loyaltyCode, currentTotal, 'online', address);

                            if (result.success) {
                                // Set flag to skip loading cart on the success page after checkout
                                localStorage.setItem('glamora_skip_cart_load', 'true');
                                localStorage.removeItem('glamora_pending_checkout');
                                setStatus('Success!');
                                setMessage('Order placed successfully! You can now download your receipt.');
                                setOrderDetails({ cart: currentCart, total: currentTotal });
                                setTransactionId(data || 'TRX-' + Math.floor(Date.now() / 1000));
                                const itemCount = currentCart.reduce((total, item) => total + item.count, 0);
                                setItemsPurchased(itemCount);
                                setTimeout(() => setShowLoyalty(true), 1500);
                            } else {
                                setStatus('Order Placement Failed');
                                setMessage(result.error || 'Payment succeeded but order failed. Please contact support.');
                            }
                        } else {
                            setStatus('Verification Failed');
                            setMessage(resultData.error || 'Could not verify your payment with eSewa.');
                            setTimeout(() => history.push('/cart'), 5000);
                        }
                    } catch (err) {
                        console.error('Error in EsewaSuccess handleProcess:', err);
                        setStatus('Error');
                        setMessage('A server error occurred during payment verification.');
                        setTimeout(() => history.push('/cart'), 5000);
                    }
                };

                // ✅ Only trigger once cart has fully loaded
                if (!processedRef.current && cartLoaded) {
                    if (cart.length > 0) {
                        handleProcess();
                    } else {
                        // Cart loaded but empty — check for pending checkout
                        processedRef.current = true;
                        const pendingStr = localStorage.getItem('glamora_pending_checkout');
                        if (!pendingStr) {
                            setStatus('Already Processed');
                            setMessage('Your order has already been finalized. Redirecting...');
                        } else {
                            setStatus('Checkout Error');
                            setMessage('Your cart is empty. If you already paid, please check your Dashboard.');
                        }
                        setTimeout(() => history.push('/user-dashboard'), 3000);
                    }
                }

                const isError = status.includes('Error') || status.includes('Failed');

                return (
                    <div className="container mt-5 text-center">
                        <div className="row">
                            <div className="col-10 mx-auto text-center text-title text-capitalize pt-5">
                                <h1 className={`display-3 ${isError ? 'text-danger' : 'text-success'}`}>
                                    {status}
                                </h1>
                                <h2 className="mt-4">{message}</h2>

                                {status === 'Success!' && orderDetails && (
                                    <div className="mt-5 d-flex justify-content-center flex-wrap" style={{ gap: '15px' }}>
                                        <button
                                            className="btn btn-outline-success btn-lg px-4"
                                            onClick={() => generatePaymentSlip(orderDetails.cart, orderDetails.total, auth.user, transactionId)}
                                        >
                                            Download Payment Slip (PDF)
                                        </button>
                                        <button
                                            className="btn btn-primary btn-lg px-4"
                                            onClick={() => history.push('/user-dashboard')}
                                        >
                                            Continue to Dashboard
                                        </button>
                                    </div>
                                )}

                                {/* Show spinner only while cart is still loading */}
                                {!cartLoaded && (
                                    <div className="mt-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="sr-only">Loading...</span>
                                        </div>
                                        <p className="mt-2 text-muted">Loading your cart items...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <LoyaltyPopup
                            show={showLoyalty}
                            onClose={() => setShowLoyalty(false)}
                            purchasedToday={itemsPurchased}
                        />
                    </div>
                );
            }}
        </ProductConsumer>
    );
}

export default EsewaSuccess;
