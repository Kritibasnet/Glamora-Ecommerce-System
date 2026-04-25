import React, { useEffect, useState, useContext } from 'react';
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
    const [processed, setProcessed] = useState(false);
    
    // States for PDF generation
    const [orderDetails, setOrderDetails] = useState(null);
    const [transactionId, setTransactionId] = useState('');
    
    // State for Loyalty Popup
    const [showLoyalty, setShowLoyalty] = useState(false);
    const [itemsPurchased, setItemsPurchased] = useState(0);

    return (
        <ProductConsumer>
            {value => {
                const { cart, checkout, loadCart } = value;

                const handleProcess = async () => {
                    if (processed) return;

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

                    // If cart is empty, we must wait for it. 
                    // ProductProvider should have started loadCart on mount.
                    if (cart.length === 0) {
                        console.log('Cart is empty, waiting for it to load...');
                        return; // Exit and wait for the next render when cart is populated
                    }

                    // Lock to prevent multiple calls
                    setProcessed(true);

                    try {
                        console.log('Verifying eSewa payment...');
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
                            console.log('Payment verified, proceeding to checkout...');

                            // Save cart and total before checkout clears it
                            const currentCart = [...cart];
                            
                            // Retrieve pending checkout details (loyalty code, discounted total, address)
                            const pendingStr = localStorage.getItem('glamora_pending_checkout');
                            const pendingData = pendingStr ? JSON.parse(pendingStr) : null;
                            
                            const currentTotal = pendingData ? pendingData.finalTotal : value.cartTotal;
                            const loyaltyCode = pendingData ? pendingData.loyaltyCode : null;
                            const address = pendingData ? pendingData.address : '';

                            // Proceed to create the order
                            const result = await checkout(loyaltyCode, currentTotal, 'online', address);

                            if (result.success) {
                                // Clear pending data
                                localStorage.removeItem('glamora_pending_checkout');
                                
                                setStatus('Success!');
                                setMessage('Order placed successfully! You can now download your receipt.');
                                setOrderDetails({ cart: currentCart, total: currentTotal });
                                setTransactionId(data || 'TRX-' + Math.floor(Date.now() / 1000));
                                
                                // Calculate total items in this order to show loyalty popup
                                const itemCount = currentCart.reduce((total, item) => total + item.count, 0);
                                setItemsPurchased(itemCount);
                                // Show popup after a slight delay for better UX
                                setTimeout(() => setShowLoyalty(true), 1500);
                            } else {
                                setStatus('Order Placement Failed');
                                setMessage(result.error || 'The payment was successful, but we encountered an issue placing your order. Please contact support.');
                                console.error('Checkout failed after successful payment:', result.error);
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

                // Trigger process if we have cart items and haven't started yet
                if (!processed && cart.length > 0) {
                    handleProcess();
                } else if (!processed && cart.length === 0) {
                    // This will be re-evaluated on every re-render of ProductConsumer
                    // until cart is populated or component unmounts.
                    // If it stays empty too long, something might be wrong.
                }

                return (
                    <div className="container mt-5 text-center">
                        <div className="row">
                            <div className="col-10 mx-auto text-center text-title text-capitalize pt-5">
                                <h1 className={`display-3 ${status.includes('Error') || status.includes('Failed') ? 'text-danger' : 'text-success'}`}>
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
                                {!processed && cart.length === 0 && (
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
