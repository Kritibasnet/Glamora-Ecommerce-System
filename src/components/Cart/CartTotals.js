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
    const [paymentMethod, setPaymentMethod] = React.useState(''); // Mandatory
    const [addressForm, setAddressForm] = React.useState({
        country: '',
        city: '',
        location: '',
        postCode: '',
        contact: ''
    });

    React.useEffect(() => {
        const userStr = localStorage.getItem('glamora_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            // Pre-fill contact if available from profile
            if (user.phone) {
                setAddressForm(prev => ({ ...prev, contact: user.phone }));
            }
        }
    }, []);

    const handleAddressChange = (e) => {
        setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
    };

    const isFormValid = addressForm.country && addressForm.city && addressForm.location && addressForm.postCode && addressForm.contact && paymentMethod;
    const combinedAddress = `${addressForm.location}, ${addressForm.city}, ${addressForm.country} (ZIP: ${addressForm.postCode}, Contact: ${addressForm.contact})`;

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
                address: combinedAddress
            }));
            return;
        }

        if (e) e.preventDefault();
        setLoading(true);
        setMessage('');

        const result = await checkout(discount > 0 ? loyaltyCode : null, finalTotal, paymentMethod, combinedAddress);

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

                        <div className="card my-4 p-4 border-0 bg-light text-left shadow-sm">
                            <h5 className="text-title mb-4 border-bottom pb-2">Delivery Details</h5>
                            
                            <div className="row">
                                <div className="col-md-6 form-group">
                                    <label className="small font-weight-bold">Country / Region *</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        name="country"
                                        value={addressForm.country}
                                        onChange={handleAddressChange}
                                        placeholder="e.g. Nepal"
                                        required
                                    />
                                </div>
                                <div className="col-md-6 form-group">
                                    <label className="small font-weight-bold">City / Village *</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        name="city"
                                        value={addressForm.city}
                                        onChange={handleAddressChange}
                                        placeholder="e.g. Kathmandu"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="small font-weight-bold">Specific Location / Street *</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    name="location"
                                    value={addressForm.location}
                                    onChange={handleAddressChange}
                                    placeholder="e.g. New Baneshwor, House #12"
                                    required
                                />
                            </div>

                            <div className="row">
                                <div className="col-md-6 form-group">
                                    <label className="small font-weight-bold">Post Code / ZIP *</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        name="postCode"
                                        value={addressForm.postCode}
                                        onChange={handleAddressChange}
                                        placeholder="e.g. 44600"
                                        required
                                    />
                                </div>
                                <div className="col-md-6 form-group">
                                    <label className="small font-weight-bold">Contact Number *</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        name="contact"
                                        value={addressForm.contact}
                                        onChange={handleAddressChange}
                                        placeholder="e.g. 98XXXXXXXX"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <h5 className="text-title mt-4 mb-3 border-bottom pb-2">Payment Method *</h5>
                            <div className="custom-control custom-radio mb-2">
                                <input 
                                    type="radio" 
                                    id="payCod" 
                                    name="paymentMethod" 
                                    className="custom-control-input"
                                    checked={paymentMethod === 'cod'}
                                    onChange={() => setPaymentMethod('cod')}
                                    required
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
                                    required
                                />
                                <label className="custom-control-label" htmlFor="payOnline">Online Payment (eSewa)</label>
                            </div>
                            {!paymentMethod && <small className="text-danger d-block mt-2">Please select a payment method to proceed.</small>}
                        </div>

                        {message && <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'} mt-3`}>{message}</div>}

                        {paymentMethod === 'cod' ? (
                            <button
                                className="btn btn-outline-success text-uppercase mb-3 px-5 w-100"
                                type="button"
                                onClick={handleCheckout}
                                disabled={loading || !isFormValid}
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
                                    disabled={!esewaData.signature || !isFormValid}
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
