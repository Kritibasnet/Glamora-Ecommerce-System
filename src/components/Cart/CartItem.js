import React from 'react';
import styled from 'styled-components';

function CartItem({ item, value }) {
    const { id, title, img, price, total, count } = item;
    const { increment, decrement, removeItem } = value;

    return (
        <div className="col-10 mx-auto col-md-6 col-lg-4 my-3">
            <CartItemWrapper className="card">
                <div className="img-container p-3">
                    <img src={img} className="card-img-top img-fluid" alt="product" />
                </div>
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="card-title text-capitalize mb-0">{title}</h5>
                        <h5 className="text-pink mb-0">
                            <span className="mr-1">$</span>{price}
                        </h5>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="quantity-controls d-flex align-items-center">
                            <button className="btn btn-outline-black btn-sm" onClick={() => decrement(id)}>
                                <i className="fas fa-minus"></i>
                            </button>
                            <span className="mx-3 font-weight-bold">{count}</span>
                            <button className="btn btn-outline-black btn-sm" onClick={() => increment(id)}>
                                <i className="fas fa-plus"></i>
                            </button>
                        </div>

                        <div className="remove-icon" onClick={() => removeItem(id)}>
                            <i className="fas fa-trash text-danger"></i>
                        </div>
                    </div>

                    <div className="mt-3 pt-2 border-top text-right">
                        <p className="mb-0">
                            <strong>Item Total: </strong>
                            <span className="text-pink font-weight-bold">${total}</span>
                        </p>
                    </div>
                </div>
            </CartItemWrapper>
        </div>
    );
}

const CartItemWrapper = styled.div`
    border: 1px solid rgba(0,0,0,0.1);
    transition: all 0.3s linear;
    border-radius: 10px;
    overflow: hidden;
    
    &:hover {
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        transform: translateY(-5px);
    }
    
    .img-container {
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
        
        img {
            max-height: 100%;
            object-fit: contain;
        }
    }
    
    .text-pink {
        color: var(--mainPink);
    }
    
    .btn-outline-black {
        border-color: var(--mainBlack);
        color: var(--mainBlack);
        
        &:hover {
            background: var(--mainBlack);
            color: white;
        }
    }
    
    .remove-icon {
        cursor: pointer;
        font-size: 1.2rem;
        transition: all 0.2s linear;
        
        &:hover {
            transform: scale(1.2);
        }
    }
`;

export default CartItem;
