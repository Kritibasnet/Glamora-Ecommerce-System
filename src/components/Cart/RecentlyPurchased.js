import React, { Component } from 'react';
import styled from 'styled-components';
import { ProductConsumer } from '../../context';
import { Link } from 'react-router-dom';

class RecentlyPurchased extends Component {
    render() {
        return (
            <ProductConsumer>
                {value => {
                    const { orders, orderLoading, products, handleDetail, addToCart, openModal } = value;

                    if (orderLoading && orders.length === 0) return null;
                    if (orders.length === 0) return null;

                    // Get unique items from all orders
                    const purchasedItems = [];
                    const itemIds = new Set();

                    orders.forEach(order => {
                        order.items.forEach(item => {
                            if (!itemIds.has(item.id)) {
                                itemIds.add(item.id);
                                purchasedItems.push(item);
                            }
                        });
                    });

                    // Only show the last 4 unique items
                    const displayItems = purchasedItems.slice(0, 4);

                    return (
                        <RecentlyPurchasedWrapper className="container py-5">
                            {!this.props.hideHeader && (
                                <div className="row">
                                    <div className="col-10 mx-auto text-center text-title text-uppercase mb-5">
                                        <h1 className="text-capitalize font-weight-bold">
                                            Recently <strong className="text-blue">Purchased</strong>
                                        </h1>
                                        <p className="text-muted">Items you have bought before</p>
                                    </div>
                                </div>
                            )}
                            <div className="row">
                                {displayItems.map(purchasedItem => {
                                    // Find the latest product info from context
                                    const item = products.find(p => p.id === purchasedItem.id) || purchasedItem;

                                    return (
                                        <div key={item.id} className="col-9 mx-auto col-md-6 col-lg-3 my-3">
                                            <div className="card product-card">
                                                <div className="img-container p-5">
                                                    <Link to="/details" onClick={() => handleDetail(item.id)}>
                                                        <img src={item.img} alt="product" className="card-img-top" />
                                                    </Link>
                                                    <div className="purchased-badge">
                                                        You have bought this
                                                    </div>
                                                </div>
                                                <div className="card-footer d-flex justify-content-between">
                                                    <p className="align-self-center mb-0">{item.title}</p>
                                                    <h5 className="text-blue font-italic mb-0">
                                                        <span className="mr-1">$</span>
                                                        {item.price}
                                                    </h5>
                                                </div>
                                                <button
                                                    className="cart-btn"
                                                    disabled={item.inCart}
                                                    onClick={() => {
                                                        addToCart(item.id);
                                                        openModal(item.id);
                                                    }}
                                                >
                                                    {item.inCart ? (
                                                        <p className="text-capitalize mb-0" disabled>
                                                            In Cart
                                                        </p>
                                                    ) : (
                                                        <i className="fas fa-cart-plus" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </RecentlyPurchasedWrapper>
                    );
                }}
            </ProductConsumer>
        );
    }
}

export default RecentlyPurchased;

const RecentlyPurchasedWrapper = styled.div`
  .product-card {
    border-color: transparent;
    transition: all 0.3s linear;
    position: relative;
    overflow: hidden;
  }
  .card-footer {
    background: transparent;
    border-top: transparent;
    transition: all 0.3s linear;
  }
  &:hover {
    .product-card {
      border: 0.04rem solid rgba(0, 0, 0, 0.2);
      box-shadow: 2px 2px 5px 0px rgba(0, 0, 0, 0.2);
    }
    .card-footer {
      background: rgba(247, 247, 247);
    }
  }
  .img-container {
    position: relative;
    overflow: hidden;
  }
  .card-img-top {
    transition: all 0.3s linear;
  }
  .img-container:hover .card-img-top {
    transform: scale(1.2);
  }
  .cart-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 0.2rem 0.4rem;
    background: var(--lightBlue);
    border: none;
    color: var(--mainWhite);
    font-size: 1.2rem;
    border-radius: 0.5rem 0 0 0;
    transform: translate(100%, 100%);
    transition: all 0.3s linear;
  }
  .product-card:hover .cart-btn {
    transform: translate(0, 0);
  }
  .cart-btn:hover {
    color: var(--mainBlue);
    cursor: pointer;
  }
  .purchased-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: var(--mainPink);
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
`;
