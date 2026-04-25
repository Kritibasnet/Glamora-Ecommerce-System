import React from 'react'
import CardItem from './CartItem';


function CartList({ value }) {
    const { cart } = value;
    return (
        <div className="container-fluid">
            <div className="row">
                {cart.map(item => {
                    return <CardItem key={item.id} item={item} value={value} />;
                })}
            </div>
        </div>
    );
}

export default CartList;
