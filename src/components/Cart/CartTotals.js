import React from 'react'
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import PaypalButton from './PaypalButton';
function CartTotals({ value, history, setShowSuccessModal }) {
    const { cartSubTotal, cartTax, cartTotal, clearCart, checkout } = value;
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [esewaData, setEsewaData] = React.useState({
        signature: '',
        transaction_uuid: '',
        product_code: ''
    });

    React.useEffect(() => {
        if (cartTotal > 0) {
            const uuid = uuidv4();
            const token = localStorage.getItem('glamora_token');
            const SECRET = '8gBm/:&EnhH.1/q';
            const PRODUCT_CODE = 'EPAYTEST';
            
            console.log("Generating eSewa signature for total:", cartTotal);

            fetch('http://localhost:5000/api/esewa/generate-signature', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    total_amount: cartTotal,
                    transaction_uuid: uuid
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.signature) {
                    console.log("Signature received from backend");
                    setEsewaData({
                        signature: data.signature,
                        transaction_uuid: uuid,
                        product_code: data.product_code
                    });
                } else {
                    throw new Error("No signature in response");
                }
            })
            .catch(err => {
                console.warn('Backend signature failed, using frontend fallback:', err);
                // Fallback to frontend generation
                const hashString = `total_amount=${cartTotal},transaction_uuid=${uuid},product_code=${PRODUCT_CODE}`;
                const hash = CryptoJS.HmacSHA256(hashString, SECRET);
                const signature = CryptoJS.enc.Base64.stringify(hash);
                
                setEsewaData({
                    signature: signature,
                    transaction_uuid: uuid,
                    product_code: PRODUCT_CODE
                });
            });
        }
    }, [cartTotal]);

    const [loyaltyCode, setLoyaltyCode] = React.useState('');
    const [discount, setDiscount] = React.useState(0);
    const [codeStatus, setCodeStatus] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState('cod'); // 'cod' or 'online'
    const [deliveryAddress, setDeliveryAddress] = React.useState('');

    React.useEffect(() => {
        const userStr = localStorage.getItem('glamora_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.location) setDeliveryAddress(user.location);
        }
    }, []);

    const applyCode = async () => {
        if (!loyaltyCode) return;
        const token = localStorage.getItem('glamora_token');
        try {
            const res = await fetch('http://localhost:5000/api/loyalty-codes/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ code: loyaltyCode })
            });
            if (res.ok) {
                const data = await res.json();
                const discAmt = cartTotal * (data.discount_percent / 100);
                setDiscount(discAmt);
                setCodeStatus(`Applied! ${data.discount_percent}% discount (-$${discAmt.toFixed(2)})`);
            } else {
                setCodeStatus('Invalid or used loyalty code.');
                setDiscount(0);
            }
        } catch (error) {
            setCodeStatus('Error validating code.');
        }
    };

    const finalTotal = cartTotal - discount;

    const handleCheckout = async (e) => {
        // If it's a form submission (eSewa), we don't preventDefault so it redirects
        // But we need to save the checkout info for the success page
        if (paymentMethod === 'online') {
            localStorage.setItem('glamora_pending_checkout', JSON.stringify({
                loyaltyCode: discount > 0 ? loyaltyCode : null,
                finalTotal: finalTotal,
                address: deliveryAddress
            }));
            return;
        }

        if (e) e.preventDefault();
        setLoading(true);
        setMessage('');

        const result = await checkout(discount > 0 ? loyaltyCode : null, finalTotal, paymentMethod, deliveryAddress);

        if (result.success) {
            setShowSuccessModal(true);
            setMessage('Order placed successfully! Redirecting...');
            setTimeout(() => {
                setShowSuccessModal(false);
                history.push('/user-dashboard');
            }, 3000);
        } else {
            setMessage(result.error || 'Checkout failed');
            setLoading(false);
        }
    };

    return (
        <React.Fragment>
            <div className="container">
                <div className="row">
                    <div className="col-10 mt-2 ml-sm-5 ml-md-auto col-8 text-capitalize text-right">
                        <Link to="/">
                            <button className="btn btn-outline-danger text-uppercase mb-3 px-5" type="button"
                                onClick={() => clearCart()} >clear cart

                            </button>
                        </Link>
                        
                        <div className="mb-4 d-flex justify-content-end align-items-center">
                            <div className="form-group mb-0 mr-2" style={{ maxWidth: '250px' }}>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Loyalty Code" 
                                    value={loyaltyCode}
                                    onChange={(e) => setLoyaltyCode(e.target.value)}
                                    disabled={discount > 0}
                                />
                                {codeStatus && <small className={`d-block ${discount > 0 ? 'text-success' : 'text-danger'}`}>{codeStatus}</small>}
                            </div>
                            <button 
                                className="btn btn-primary" 
                                onClick={applyCode}
                                disabled={discount > 0 || !loyaltyCode}
                            >Apply</button>
                        </div>

                        <h5>
                            <span className="text-title">subtotal : </span>
                            <strong>$ {cartSubTotal}</strong>
                        </h5>
                        <h5>
                            <span className="text-title">tax: </span>
                            <strong>$ {cartTax}</strong>
                        </h5>
                        {discount > 0 && (
                            <h5 className="text-success">
                                <span className="text-title">loyalty discount: </span>
                                <strong>- $ {discount.toFixed(2)}</strong>
                            </h5>
                        )}
                        <h5>
                            <span className="text-title">total : </span>
                            <strong>$ {finalTotal.toFixed(2)}</strong>
                        </h5>

                        <div className="card my-4 p-3 border-0 bg-light text-left">
                            <h6 className="text-title mb-3">Delivery & Payment</h6>
                            <div className="form-group mb-3">
                                <label className="small font-weight-bold">Delivery Address (from Profile)</label>
                                <div className="p-2 border rounded bg-white text-muted small">
                                    {deliveryAddress || 'No address set in profile. Please update your profile.'}
                                </div>
                            </div>
                            
                            <label className="small font-weight-bold mb-2">Payment Method</label>
                            <div className="custom-control custom-radio mb-2">
                                <input 
                                    type="radio" 
                                    id="payCod" 
                                    name="paymentMethod" 
                                    className="custom-control-input"
                                    checked={paymentMethod === 'cod'}
                                    onChange={() => setPaymentMethod('cod')}
                                />
                                <label className="custom-control-label" htmlFor="payCod">Cash on Delivery</label>
                            </div>
                            <div className="custom-control custom-radio mb-3">
                                <input 
                                    type="radio" 
                                    id="payOnline" 
                                    name="paymentMethod" 
                                    className="custom-control-input"
                                    checked={paymentMethod === 'online'}
                                    onChange={() => setPaymentMethod('online')}
                                />
                                <label className="custom-control-label" htmlFor="payOnline">Online Payment (eSewa)</label>
                            </div>
                        </div>

                        {message && <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'} mt-3`}>{message}</div>}

                        {paymentMethod === 'cod' ? (
                            <button
                                className="btn btn-outline-success text-uppercase mb-3 px-5 w-100"
                                type="button"
                                onClick={handleCheckout}
                                disabled={loading || !deliveryAddress}
                            >
                                {loading ? 'Processing...' : 'Place Order (Cash on Delivery)'}
                            </button>
                        ) : (
                            <form action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST" onSubmit={handleCheckout}>
                                <input value={finalTotal} name="amount" type="hidden" />
                                <input value="0" name="tax_amount" type="hidden" />
                                <input value={finalTotal} name="total_amount" type="hidden" />
                                <input value={esewaData.transaction_uuid} name="transaction_uuid" type="hidden" />
                                <input value={esewaData.product_code} name="product_code" type="hidden" />
                                <input value="0" name="product_service_charge" type="hidden" />
                                <input value="0" name="product_delivery_charge" type="hidden" />
                                <input value={`${window.location.origin}/esewa-success`} type="hidden" name="success_url" />
                                <input value={`${window.location.origin}/esewa-failure`} type="hidden" name="failure_url" />
                                <input value="total_amount,transaction_uuid,product_code" type="hidden" name="signed_field_names" />
                                <input value={esewaData.signature} type="hidden" name="signature" />
                                <button
                                    className="btn text-uppercase mb-3 px-5 w-100"
                                    type="submit"
                                    style={{ backgroundColor: '#41A124', color: 'white', fontWeight: 'bold' }}
                                    disabled={!esewaData.signature || !deliveryAddress}
                                >
                                    Pay with eSewa (v2)
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </React.Fragment>

    );
}

export default CartTotals;
