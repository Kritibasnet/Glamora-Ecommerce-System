import React from 'react';
import { Link } from 'react-router-dom';

function EsewaFailure() {
    return (
        <div className="container mt-5">
            <div className="row">
                <div className="col-10 mx-auto text-center text-title text-capitalize pt-5">
                    <h1 className="display-4 text-danger">Payment Failed</h1>
                    <h2>Something went wrong during the eSewa transaction.</h2>
                    <h4 className="mt-4">
                        <Link to="/cart" className="btn btn-outline-primary text-uppercase px-5">
                            Return to Cart
                        </Link>
                    </h4>
                </div>
            </div>
        </div>
    );
}

export default EsewaFailure;
