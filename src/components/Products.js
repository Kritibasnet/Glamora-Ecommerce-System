import React, { Component } from 'react'
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ProductConsumer } from '../context';
import { AuthConsumer } from '../context/AuthContext';
import PropTypes from 'prop-types';

class Products extends Component {
    render() {
        const { id, title, img, price, inCart, inStock, stockCount, count } = this.props.product;
        return (
            <ProductWrapper className="col-9 mx-auto col-md-6 col-lg-3 my-3">
                <div className="card">

                    <ProductConsumer>
                        {(value) => (
                            <div className="img-container p-5">
                                <Link to="/details" onClick={() => value.handleDetail(id)}>
                                    <img src={img} alt="product_image" className="card-img-top" />
                                </Link>
                                
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
                                            <i className="fas fa-cart-plus" />
                                        </button>
                                    )
                                ) : (
                                    <button className="cart-btn" disabled>
                                        <p className="text-capitalize mb-0" style={{ fontSize: "0.6rem" }}>Out of Stock</p>
                                    </button>
                                )}

                                <AuthConsumer>
                                    {authValue => (
                                        <>
                                            {!inStock && (
                                                <div className="stock-label out-of-stock">Out of Stock</div>
                                            )}
                                            {inStock && (
                                                <div className="stock-label in-stock">
                                                    {authValue.user?.role === 'admin' ? `${stockCount} left` : 'In Stock'}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </AuthConsumer>
                            </div>
                        )}

                    </ProductConsumer>
                    {/* card footer */}
                    <div className="card-footer d-flex justify-content-between">
                        <p className="align-self-center mb-0">{title}</p>
                        <h5 className="text-pink font-italic mb-0">
                            <span className="mr-1">$</span>
                            {price}
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

const ProductWrapper = styled.div`
.card{
    border-color:transparent;
    transition:all 1s linear;

}
.card-footer{
    background:transparent;
    border-top:transparent;
    transition:all 1s linear;
}
&:hover{
    .card{
        border: 0.05rem solid rgba(0,0,0,0.2);
        box-shadow:2px 2px 5px 0px rgba(0,0,0,0.2);
    }
    .card-footer{
        background:rgba(247,247,247);
    }
}
.img-container{
    position:relative;
    overflow: hidden;
}
.card-img-top{
    transition:all 0.5s linear;
    width: 100%;
    display: block;
    min-height: 200px;
}
.img-container:hover .card-img-top{
    transform:scale(1.17);
}
.cart-btn, .quantity-controls{
    position: absolute;
    bottom:0;
    right:0;
    background:var(--lightOrange);
    border:none;
    color:var(--mainPurple);
    border-radius: 0.5rem 0 0 0;
    transition: all 0.5s linear;
    transform: translate(100%, 100%);
}
.img-container:hover .cart-btn, .img-container:hover .quantity-controls{
    transform: translate(0, 0);
}
.cart-btn{
    padding:0.2rem 0.6rem;
    font-size:1.4rem;
}
.cart-btn:hover{
    color:var(--mainPink);
    cursor:pointer;
}
.quantity-controls {
    display: flex;
    align-items: center;
    padding: 0.2rem 0.4rem;
}
.qty-btn {
    background: transparent;
    border: none;
    color: var(--mainPurple);
    font-size: 1rem;
    cursor: pointer;
    padding: 0 0.5rem;
    transition: color 0.2s;
}
.qty-btn:hover {
    color: var(--mainPink);
}
.qty-count {
    font-weight: bold;
    min-width: 20px;
    text-align: center;
    font-size: 1.1rem;
}
.stock-label {
    position: absolute;
    top: 0;
    left: 0;
    padding: 0.2rem 0.5rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    font-weight: bold;
    border-bottom-right-radius: 0.5rem;
}
.in-stock {
    background: #d4edda;
    color: #155724;
}
.out-of-stock {
    background: #f8d7da;
    color: #721c24;
}
`;
export default Products;
