import React, { Component } from 'react';
import { ProductConsumer } from '../context';
import { AuthConsumer } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ButtonContainer } from './Button';
import Ratings from './Ratings';

export default class Details extends Component {
    componentDidMount() {
        document.title = 'Product Details - Glamora';
    }

    render() {
        return (
            <ProductConsumer>
                {(value) => {
                    const { id, company, img, info, price, title, inCart, inStock, stockCount, count } = value.detailProduct;
                    return (
                        <div className="container py-5">
                            {/* title */}
                            <div className="row">
                                <div className="col-10 mx-auto text-center text-slanted text-pink my-5">
                                    <h1>{title}</h1>
                                </div>
                            </div>
                            {/* end title */}
                            {/* product info */}
                            <div className="row">
                                <div className="col-10 mx-auto col-md-6 my-3 ">
                                    <img src={img} className="img-fuild" alt="product" height="350px" />


                                </div>
                                {/* product text */}
                                <div className="col-10 mx-auto col-md-6 my-3 text-capitalize">
                                    <h3>model:{title}</h3>
                                    <h4 className="text-title text-uppercase text-muted mt-3 mb-2">
                                        made by:<span className="text-uppercase">
                                            {company}

                                        </span>
                                    </h4>
                                    <AuthConsumer>
                                        {authValue => (
                                            <h5 className={inStock ? "text-success" : "text-danger"}>
                                                {inStock
                                                    ? (authValue.user?.role === 'admin' ? `In Stock (${stockCount} left)` : "In Stock")
                                                    : "Out of Stock"}
                                            </h5>
                                        )}
                                    </AuthConsumer>
                                    <h4 className="text-pink">
                                        <strong>price : <span>$</span>{price}</strong>
                                    </h4>
                                    <p className="text-capitalize font-weight-bold mt-3 mb-0">
                                        Some information about the product

                                    </p>
                                    <p className="text-muted lead">{info}</p>
                                    {/* button */}
                                    <div className="d-flex align-items-center">
                                        <Link to="/">
                                            <ButtonContainer>Back to Products</ButtonContainer>
                                        </Link>

                                        {inStock ? (
                                            inCart ? (
                                                <div className="ml-3 d-flex align-items-center" style={{ border: '1px solid var(--mainPink)', borderRadius: '5px', padding: '5px 15px' }}>
                                                    <button className="btn btn-black mx-1" onClick={() => value.decrement(id)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
                                                        <i className="fas fa-minus" />
                                                    </button>
                                                    <span className="mx-3 font-weight-bold" style={{ fontSize: '1.3rem' }}>{count}</span>
                                                    <button className="btn btn-black mx-1" onClick={() => value.increment(id)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
                                                        <i className="fas fa-plus" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <ButtonContainer cart
                                                    onClick={() => {
                                                        value.addToCart(id);
                                                        value.openModal(id);
                                                    }}
                                                >
                                                    add to cart
                                                </ButtonContainer>
                                            )
                                        ) : (
                                            <ButtonContainer disabled>Out of Stock</ButtonContainer>
                                        )}

                                    </div>

                                </div>

                            </div>
                            
                            {/* Ratings and Reviews Section */}
                            <div className="row mt-5">
                                <div className="col-10 mx-auto">
                                    <Ratings productId={id} />
                                </div>
                            </div>

                        </div>
                    )
                }}
            </ProductConsumer>
        )
    }
}
