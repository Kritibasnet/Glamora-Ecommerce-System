import React, { Component } from 'react'
import Title from './Title';
import styled from 'styled-components';

import { ProductConsumer } from '../context';
import Products from './Products';
import ProductSidebar from './ProductSidebar';


class ProductList extends Component {
    componentDidMount() {
        document.title = 'Home - Glamora';
    }

    render() {
        return (
            <React.Fragment>
                <div className="py-5">
                    <div className="container-fluid">
                        <Title name="Our" title="Products" />
                        <div className="row">
                            <div className="col-12 col-md-3 mb-4">
                                <ProductSidebar />
                            </div>
                            <div className="col-md-9 col-12">
                                <div className="row">
                                    <ProductConsumer>
                                        {(value) => {
                                            const filteredProducts = value.products
                                                .filter(product => {
                                                    let matchesSearch = false;
                                                    if (value.searchTerm) {
                                                        if (value.searchTerm.startsWith('ids:')) {
                                                            const ids = value.searchTerm.substring(4).split(',').map(id => parseInt(id));
                                                            matchesSearch = ids.includes(product.id);
                                                        } else {
                                                            matchesSearch = product.title.toLowerCase().includes(value.searchTerm.toLowerCase()) ||
                                                                product.company.toLowerCase().includes(value.searchTerm.toLowerCase()) ||
                                                                (product.category && product.category.toLowerCase().includes(value.searchTerm.toLowerCase())) ||
                                                                (product.info && product.info.toLowerCase().includes(value.searchTerm.toLowerCase()));
                                                        }
                                                    } else {
                                                        matchesSearch = true;
                                                    }
                                                    const matchesCategory = value.selectedCategory === 'All' || 
                                                        (product.category && product.category.toLowerCase() === value.selectedCategory.toLowerCase());
                                                    return matchesSearch && matchesCategory;
                                                });

                                            // Sort by recent purchases first, then by price if searching
                                            filteredProducts.sort((a, b) => {
                                                // Create a map of purchased products for quick lookup
                                                const purchaseMap = {};
                                                value.purchaseHistory.forEach(purchase => {
                                                    if (!purchaseMap[purchase.productId]) {
                                                        purchaseMap[purchase.productId] = [];
                                                    }
                                                    purchaseMap[purchase.productId].push(purchase.purchasedAt);
                                                });

                                                // Get most recent purchase dates for both products
                                                const aLatestPurchase = purchaseMap[a.id] ? 
                                                    new Date(purchaseMap[a.id].sort().reverse()[0]).getTime() : 0;
                                                const bLatestPurchase = purchaseMap[b.id] ? 
                                                    new Date(purchaseMap[b.id].sort().reverse()[0]).getTime() : 0;

                                                // If both have purchase history, sort by most recent
                                                if (aLatestPurchase > 0 && bLatestPurchase > 0) {
                                                    return bLatestPurchase - aLatestPurchase;
                                                }

                                                // If only one has purchase history, prioritize it
                                                if (aLatestPurchase > 0) return -1;
                                                if (bLatestPurchase > 0) return 1;

                                                // If neither has purchase history, sort by price if searching
                                                if (value.searchTerm) {
                                                    return a.price - b.price;
                                                }

                                                return 0;
                                            });

                                            if (filteredProducts.length === 0) {
                                                return (
                                                    <div className="col-10 mx-auto text-center text-title text-uppercase pt-5">
                                                        <h3>No products found matching your criteria</h3>
                                                    </div>
                                                );
                                            }

                                            return filteredProducts.map(product => {
                                                return <Products key={product.id} product={product} />;
                                            })
                                        }}
                                    </ProductConsumer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default ProductList;
