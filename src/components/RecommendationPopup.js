import React, { Component } from 'react';
import styled from 'styled-components';
import { ProductConsumer } from '../context';
import { Link } from 'react-router-dom';

// Rewriting RecommendationPopup to be more robust with context access
class RecommendationManager extends Component {
    state = {
        show: false,
        product: null
    };

    componentDidMount() {
        // 3 minutes = 180000 ms
        this.interval = setInterval(this.triggerRecommendation, 180000);
        
        // First one after 1 minute
        this.initialTimeout = setTimeout(this.triggerRecommendation, 60000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
        clearTimeout(this.initialTimeout);
        if (this.hideTimeout) clearTimeout(this.hideTimeout);
    }

    triggerRecommendation = () => {
        const product = this.props.context.getRecommendedProduct();
        if (product) {
            this.setState({ show: true, product });
            
            // Auto hide after 3 seconds as requested
            this.hideTimeout = setTimeout(() => {
                this.setState({ show: false });
            }, 3000);
        }
    };

    render() {
        const { show, product } = this.state;
        const { handleDetail } = this.props.context;

        if (!show || !product) return null;

        return (
            <PopupContainer>
                <div className="popup-card">
                    <div className="popup-header">
                        <div className="sparkle-icon">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--mainPink)" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"/>
                            </svg>
                        </div>
                        <span className="title">Just for You</span>
                        <button className="close-btn" onClick={() => this.setState({ show: false })}>&times;</button>
                    </div>
                    <div className="popup-body">
                        <div className="img-wrapper">
                            <img src={product.img} alt={product.title} />
                        </div>
                        <div className="info">
                            <h6 className="product-title">{product.title}</h6>
                            <p className="product-price">${product.price}</p>
                            <Link 
                                to="/details" 
                                onClick={() => {
                                    handleDetail(product.id);
                                    this.setState({ show: false });
                                }}
                                className="btn-shop"
                            >
                                Shop Now
                            </Link>
                        </div>
                    </div>
                </div>
            </PopupContainer>
        );
    }
}

export const RecommendedProductPopup = () => (
    <ProductConsumer>
        {value => <RecommendationManager context={value} />}
    </ProductConsumer>
);

const PopupContainer = styled.div`
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 9999;
    animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    @keyframes slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    .popup-card {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 20px;
        box-shadow: 0 15px 45px rgba(212, 86, 125, 0.25);
        width: 320px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .popup-header {
        display: flex;
        align-items: center;
        padding: 12px 15px;
        background: rgba(212, 86, 125, 0.05);
        border-bottom: 1px solid rgba(212, 86, 125, 0.1);
        
        .sparkle-icon {
            margin-right: 8px;
            animation: pulse 1.5s infinite;
        }

        .title {
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--mainPink);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .close-btn {
            margin-left: auto;
            background: none;
            border: none;
            font-size: 1.5rem;
            line-height: 1;
            color: #999;
            cursor: pointer;
            &:hover { color: var(--mainPink); }
        }
    }

    .popup-body {
        padding: 15px;
        display: flex;
        gap: 15px;
        align-items: center;
    }

    .img-wrapper {
        width: 80px;
        height: 80px;
        border-radius: 12px;
        overflow: hidden;
        flex-shrink: 0;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .info {
        flex-grow: 1;
        
        .product-title {
            margin: 0 0 4px 0;
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--mainDark);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .product-price {
            margin: 0 0 10px 0;
            font-weight: 700;
            color: var(--mainPink);
            font-size: 1rem;
        }

        .btn-shop {
            display: inline-block;
            background: linear-gradient(135deg, var(--mainPink) 0%, var(--darkPink) 100%);
            color: white;
            padding: 5px 15px;
            border-radius: 50px;
            text-decoration: none;
            font-size: 0.75rem;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(212, 86, 125, 0.3);

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(212, 86, 125, 0.4);
                color: white;
            }
        }
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.2); opacity: 1; }
    }
`;
