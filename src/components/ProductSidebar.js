import React, { Component } from 'react';
import styled from 'styled-components';
import { ProductConsumer } from '../context';

export default class ProductSidebar extends Component {
    render() {
        return (
            <ProductConsumer>
                {(value) => {
                    const { products, handleCategory, selectedCategory, setSearchTermDirectly } = value;
                    // Extract unique categories
                    const uniqueCategories = ['All', ...new Set(products.map(item => item.category))];

                    // Filter out undefined/null categories just in case
                    const categories = uniqueCategories.filter(Boolean);

                    return (
                        <SidebarWrapper>
                            <h4 className="text-title mb-4">Categories</h4>
                            <div className="list-group">
                                {categories.map((category, index) => (
                                    <button
                                        key={index}
                                        className={`list-group-item list-group-item-action ${selectedCategory === category ? 'active' : ''}`}
                                        onClick={() => {
                                            handleCategory(category);
                                            setSearchTermDirectly('');
                                        }}
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: selectedCategory === category ? 'var(--mainBlue)' : 'transparent',
                                            color: selectedCategory === category ? 'var(--mainWhite)' : 'var(--mainDark)',
                                            borderColor: 'transparent'
                                        }}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </SidebarWrapper>
                    );
                }}
            </ProductConsumer>
        );
    }
}

const SidebarWrapper = styled.div`
    padding: 1rem;
    border-right: 1px solid #ddd;
    min-height: 80vh;
    
    .list-group-item {
        transition: all 0.3s linear;
    }

    .list-group-item:hover {
        background: var(--lightBlue);
        color: var(--mainBlue);
    }
    
    .active {
        background: var(--mainBlue) !important;
        color: var(--mainWhite) !important;
    }
`;
