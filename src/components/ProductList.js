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
                                                    const matchesSearch = product.title.toLowerCase().includes(value.searchTerm.toLowerCase()) ||
                                                        product.company.toLowerCase().includes(value.searchTerm.toLowerCase());
                                                    const matchesCategory = value.selectedCategory === 'All' || product.category === value.selectedCategory;
                                                    return matchesSearch && matchesCategory;
                                                });

                                            // Sort by price (lowest to highest) if searching
                                            if (value.searchTerm) {
                                                filteredProducts.sort((a, b) => a.price - b.price);
                                            }

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
