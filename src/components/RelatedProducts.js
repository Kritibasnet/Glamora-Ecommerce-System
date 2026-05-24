import React, { Component } from 'react';
import styled from 'styled-components';
import { ProductConsumer } from '../context';
import { Link } from 'react-router-dom';
import { ButtonContainer } from './Button';
import { AuthConsumer } from '../context/AuthContext';

class RelatedProducts extends Component {
    render() {
        const { productId } = this.props;
        
        return (
            <ProductConsumer>
                {(value) => {
                    const relatedProducts = value.getRelatedProducts(productId, 4);
                    
                    if (relatedProducts.length === 0) {
                        return null;
                    }
                    
                    return (
                        <div className="row mt-5">
                            <div className="col-10 mx-auto">
                                <div className="related-products-section">
                                    <h2 className="text-center mb-5" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#E91E63', fontStyle: 'italic' }}>
                                        Products You May Like
                                    </h2>
                                    
                                    <div className="row">
                                        {relatedProducts.map(product => (
                                            <div key={product.id} className="col-12 col-sm-6 col-md-3 mb-4">
                                                <RelatedProductCard>
                                                    <div className="card h-100">
                                                        <div className="img-container position-relative">
                                                            <Link 
                                                                to="/details" 
                                                                onClick={() => value.handleDetail(product.id)}
                                                                className="img-link"
                                                                style={{ textDecoration: 'none' }}
                                                            >
                                                                <img 
                                                                    src={product.img} 
                                                                    alt={product.title} 
                                                                    className="card-img-top img-fluid"
                                                                    style={{ height: '250px', objectFit: 'cover' }}
                                                                />
                                                                <div className="img-overlay">
                                                                    <span className="overlay-text">View Details</span>
                                                                </div>
                                                            </Link>

                                                            {/* Stock Badge */}
                                                            <AuthConsumer>
                                                                {authValue => (
                                                                    <>
                                                                        {!product.inStock && (
                                                                            <div className="stock-label out-of-stock" style={{ 
                                                                                position: 'absolute',
                                                                                top: '10px',
                                                                                right: '10px',
                                                                                backgroundColor: '#dc3545',
                                                                                color: 'white',
                                                                                padding: '5px 10px',
                                                                                borderRadius: '5px',
                                                                                fontSize: '0.85rem',
                                                                                fontWeight: 'bold'
                                                                            }}>
                                                                                Out of Stock
                                                                            </div>
                                                                        )}
                                                                        {product.inStock && (
                                                                            <div className="stock-label in-stock" style={{
                                                                                position: 'absolute',
                                                                                top: '10px',
                                                                                right: '10px',
                                                                                backgroundColor: '#28a745',
                                                                                color: 'white',
                                                                                padding: '5px 10px',
                                                                                borderRadius: '5px',
                                                                                fontSize: '0.85rem',
                                                                                fontWeight: 'bold'
                                                                            }}>
                                                                                ✓ In Stock
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </AuthConsumer>
                                                        </div>

                                                        {/* Card Body */}
                                                        <div className="card-body d-flex flex-column">
                                                            <p className="card-title font-weight-bold" style={{ fontSize: '1rem', minHeight: '2.5rem' }}>
                                                                {product.title}
                                                            </p>
                                                            <h5 className="text-pink mb-3" style={{ marginTop: 'auto' }}>
                                                                <strong>${product.price}</strong>
                                                            </h5>
                                                            
                                                            {/* Action Button */}
                                                            {product.inStock ? (
                                                                product.inCart ? (
                                                                    <div className="d-flex align-items-center justify-content-between" style={{ 
                                                                        border: '1px solid var(--mainPink)', 
                                                                        borderRadius: '5px', 
                                                                        padding: '5px 10px'
                                                                    }}>
                                                                        <button 
                                                                            className="btn btn-black" 
                                                                            onClick={() => value.decrement(product.id)}
                                                                            style={{ border: 'none', background: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0' }}
                                                                        >
                                                                            <i className="fas fa-minus" />
                                                                        </button>
                                                                        <span className="font-weight-bold">{product.count}</span>
                                                                        <button 
                                                                            className="btn btn-black" 
                                                                            onClick={() => value.increment(product.id)}
                                                                            style={{ border: 'none', background: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0' }}
                                                                        >
                                                                            <i className="fas fa-plus" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button 
                                                                        className="btn btn-sm w-100"
                                                                        onClick={() => {
                                                                            value.addToCart(product.id);
                                                                            value.openModal(product.id);
                                                                        }}
                                                                        style={{
                                                                            backgroundColor: 'var(--mainPink)',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '5px',
                                                                            padding: '8px 12px',
                                                                            fontSize: '0.9rem',
                                                                            fontWeight: 'bold',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-shopping-bag mr-1" />
                                                                        Add to Cart
                                                                    </button>
                                                                )
                                                            ) : (
                                                                <button 
                                                                    className="btn btn-sm w-100" 
                                                                    disabled
                                                                    style={{
                                                                        backgroundColor: '#ccc',
                                                                        color: '#666',
                                                                        border: 'none',
                                                                        borderRadius: '5px',
                                                                        padding: '8px 12px',
                                                                        fontSize: '0.9rem',
                                                                        cursor: 'not-allowed'
                                                                    }}
                                                                >
                                                                    Out of Stock
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </RelatedProductCard>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }}
            </ProductConsumer>
        );
    }
}

const RelatedProductCard = styled.div`
    .card {
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        
        &:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(233, 30, 99, 0.2);
        }
    }

    .img-container {
        position: relative;
        overflow: hidden;
        border-radius: 8px 8px 0 0;
        height: 250px;
        
        .img-link {
            display: block;
            width: 100%;
            height: 100%;
            position: relative;
        }

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }

        &:hover img {
            transform: scale(1.1);
        }

        .img-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;

            .overlay-text {
                color: white;
                font-size: 0.95rem;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
        }

        &:hover .img-overlay {
            opacity: 1;
        }
    }

    .card-body {
        padding: 1rem;
    }

    .card-title {
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        color: #333;
        margin: 0;
    }

    .text-pink {
        color: var(--mainPink);
    }

    .btn-sm {
        font-size: 0.85rem;
        padding: 6px 10px;
    }
`;

export default RelatedProducts;
