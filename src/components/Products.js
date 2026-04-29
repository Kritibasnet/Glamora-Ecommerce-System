import React, { Component } from 'react'
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { ProductConsumer } from '../context';
import { AuthConsumer } from '../context/AuthContext';
import PropTypes from 'prop-types';

class Products extends Component {
    render() {
        const { id, title, img, price, inCart, inStock, stockCount, count } = this.props.product;
        return (
            <ProductWrapper className="col-9 mx-auto col-md-6 col-lg-3 my-3 fade-in">
                <div className="card">
                    <ProductConsumer>
                        {(value) => (
                            <div className="img-container">
                                <Link to="/details" onClick={() => value.handleDetail(id)} className="img-link">
                                    <img src={img} alt={title} className="card-img-top" />
                                    <div className="img-overlay">
                                        <span className="overlay-text">View Details</span>
                                    </div>
                                </Link>

                                {/* Stock badges */}
                                <AuthConsumer>
                                    {authValue => (
                                        <>
                                            {!inStock && (
                                                <div className="stock-label out-of-stock">Out of Stock</div>
                                            )}
                                            {inStock && (
                                                <div className="stock-label in-stock">
                                                    {authValue.user?.role === 'admin' ? `${stockCount} left` : '✓ In Stock'}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </AuthConsumer>

                                {/* Cart Controls */}
                                <div className="cart-controls">
                                    {inStock ? (
                                        inCart ? (
                                            <div className="quantity-controls">
                                                <button className="qty-btn" onClick={() => value.decrement(id)}>
                                                    <i className="fas fa-minus" />
                                                </button>
                                                <span className="qty-count">{count}</span>
                                                <button className="qty-btn" onClick={() => value.increment(id)}>
                                                    <i className="fas fa-plus" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button className="cart-btn"
                                                onClick={() => {
                                                    value.addToCart(id);
                                                    value.openModal(id);
                                                }}>
                                                <i className="fas fa-shopping-bag mr-1" />
                                                Add to Bag
                                            </button>
                                        )
                                    ) : (
                                        <button className="cart-btn" disabled>
                                            Out of Stock
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </ProductConsumer>

                    {/* Card Footer */}
                    <div className="card-footer">
                        <p className="product-title">{title}</p>
                        <h5 className="product-price">
                            <span className="price-dollar">$</span>{price}
                        </h5>
                    </div>
                </div>
            </ProductWrapper>
        )
    }
}

ProductConsumer.propTypes = {
    product: PropTypes.shape({
        id: PropTypes.number,
        img: PropTypes.string,
        title: PropTypes.string,
        price: PropTypes.number,
        inCart: PropTypes.bool,
        count: PropTypes.number
    }).isRequired
}

/* Animations */
const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
`;

const ProductWrapper = styled.div`
    animation: ${fadeInUp} 0.5s ease both;

    .card {
        border: none;
        border-radius: 20px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(12px);
        box-shadow: 0 4px 20px rgba(212, 86, 125, 0.08), 0 1px 3px rgba(0,0,0,0.05);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            transform: translateY(-8px);
            box-shadow: 0 16px 48px rgba(212, 86, 125, 0.2), 0 4px 12px rgba(0,0,0,0.08);
        }
    }

    .img-container {
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, #fef5f8 0%, #fff0f5 100%);
        aspect-ratio: 1 / 1;
    }

    .img-link {
        display: block;
        width: 100%;
        height: 100%;
    }

    .card-img-top {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        display: block;
        min-height: 200px;
    }

    .img-container:hover .card-img-top {
        transform: scale(1.1);
    }

    /* Hover overlay */
    .img-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            to top,
            rgba(168, 61, 94, 0.75) 0%,
            transparent 60%
        );
        opacity: 0;
        transition: opacity 0.4s ease;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding-bottom: 3.8rem;
    }

    .img-container:hover .img-overlay {
        opacity: 1;
    }

    .overlay-text {
        color: white;
        font-family: 'Poppins', sans-serif;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 0.3rem 1rem;
        border: 1.5px solid rgba(255,255,255,0.7);
        border-radius: 50px;
        backdrop-filter: blur(4px);
    }

    /* Stock Label */
    .stock-label {
        position: absolute;
        top: 0.6rem;
        left: 0.6rem;
        padding: 0.2rem 0.65rem;
        font-size: 0.65rem;
        text-transform: uppercase;
        font-weight: 700;
        border-radius: 50px;
        letter-spacing: 0.5px;
        z-index: 2;
    }
    .in-stock {
        background: rgba(212, 237, 218, 0.92);
        color: #155724;
        backdrop-filter: blur(4px);
    }
    .out-of-stock {
        background: rgba(248, 215, 218, 0.92);
        color: #721c24;
        backdrop-filter: blur(4px);
    }

    /* Cart Controls */
    .cart-controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        padding: 0.5rem;
        transform: translateY(100%);
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 3;
    }

    .img-container:hover .cart-controls {
        transform: translateY(0);
    }

    .cart-btn {
        width: calc(100% - 1rem);
        padding: 0.5rem 1rem;
        font-size: 0.78rem;
        font-weight: 600;
        font-family: 'Poppins', sans-serif;
        letter-spacing: 0.5px;
        border: none;
        border-radius: 10px;
        background: linear-gradient(135deg, #d4567d 0%, #a83d5e 100%);
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(212, 86, 125, 0.4);

        /* Shimmer effect */
        background-size: 200% auto;
        &::after {
            content: '';
        }

        &:hover:not(:disabled) {
            background: linear-gradient(135deg, #a83d5e 0%, #d4567d 100%);
            box-shadow: 0 6px 20px rgba(212, 86, 125, 0.5);
        }

        &:disabled {
            background: linear-gradient(135deg, #aaa 0%, #888 100%);
            cursor: not-allowed;
            box-shadow: none;
        }
    }

    /* Quantity Controls */
    .quantity-controls {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 10px;
        padding: 0.35rem 0.8rem;
        box-shadow: 0 4px 15px rgba(212, 86, 125, 0.25);
        width: calc(100% - 1rem);
        justify-content: center;
    }

    .qty-btn {
        background: linear-gradient(135deg, #d4567d 0%, #a83d5e 100%);
        border: none;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        font-size: 0.75rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(212, 86, 125, 0.35);

        &:hover { transform: scale(1.1); }
        &:active { transform: scale(0.95); }
    }

    .qty-count {
        font-weight: 700;
        min-width: 24px;
        text-align: center;
        font-size: 1rem;
        color: var(--mainPink);
        font-family: 'Poppins', sans-serif;
    }

    /* Card Footer */
    .card-footer {
        background: white;
        border-top: 1px solid rgba(212, 86, 125, 0.08);
        padding: 0.85rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .product-title {
            margin: 0;
            font-size: 0.82rem;
            font-weight: 600;
            color: var(--mainBlack);
            font-family: 'Poppins', sans-serif;
            max-width: 60%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .product-price {
            margin: 0;
            font-size: 1rem;
            font-weight: 700;
            color: var(--mainPink);
            font-family: 'Poppins', sans-serif;

            .price-dollar {
                font-size: 0.7rem;
                vertical-align: super;
                margin-right: 1px;
            }
        }
    }
`;

export default Products;
