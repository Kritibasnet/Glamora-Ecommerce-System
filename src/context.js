import React, { Component } from 'react';
import { storeProducts, detailProduct } from './data';


const ProductContext = React.createContext();


// Provider

// Consumer
class ProductProvider extends Component {
    state = {
        products: [],
        detailProduct: detailProduct,
        cart: [],
        modalOpen: false,
        modalProduct: detailProduct,
        cartSubTotal: 0,
        cartTotal: 0,
        cartTax: 0,
        orders: [],
        orderLoading: true,
        searchTerm: '',
        selectedCategory: 'All'
    };

    handleSearch = (e) => {
        const value = e.target.value;
        this.setState({ searchTerm: value });
    };

    setSearchTermDirectly = (term) => {
        this.setState({ searchTerm: term });
    };

    handleCategory = (category) => {
        this.setState({ selectedCategory: category });
    };

    componentDidMount() {
        this.storeProducts();
    }
    storeProducts = async () => {
        // Fetch deleted products from backend
        let deletedProductIds = [];
        try {
            const response = await fetch('http://localhost:5000/api/admin/deleted-products');
            if (response.ok) {
                const deletedProducts = await response.json();
                deletedProductIds = deletedProducts.map(dp => parseInt(dp.product_id));
            }
        } catch (error) {
            console.log('Could not fetch deleted products (this is okay if not admin)');
        }

        let tempProducts = [];
        storeProducts.forEach(item => {
            // Filter out deleted products for non-admin users
            if (!deletedProductIds.includes(item.id)) {
                const singleItem = { ...item };
                tempProducts = [...tempProducts, singleItem];
            }
        })
        this.setState(() => {
            return { products: tempProducts }
        }, () => {
            this.loadCart();
            this.fetchOrders();
            this.fetchCustomProducts();
        })
    };

    fetchCustomProducts = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/products');
            if (response.ok) {
                const data = await response.json();

                // Handle both new {customProducts, staticOverrides} and old [customProducts] formats
                const customProducts = Array.isArray(data) ? data : (data.customProducts || []);
                const staticOverrides = data.staticOverrides || [];

                this.setState(prevState => {
                    // Update static products with overrides and deterministic initialization
                    let updatedProducts = prevState.products.map(product => {
                        const override = staticOverrides.find(o => o.id === product.id);

                        // If no override exists, assign deterministic 150 or 200 (Even=200, Odd=150)
                        if (!override) {
                            const initialStock = (product.id % 2 === 0) ? 200 : 150;
                            return {
                                ...product,
                                stockCount: initialStock,
                                inStock: true
                            };
                        }

                        const merged = { ...product };
                        if (override.title) merged.title = override.title;
                        if (override.price) merged.price = override.price;
                        if (override.company) merged.company = override.company;
                        if (override.category) merged.category = override.category;
                        if (override.info) merged.info = override.info;
                        if (override.img) merged.img = override.img;

                        if (override.inStock !== undefined) merged.inStock = override.inStock;
                        if (override.stockCount !== undefined) {
                            merged.stockCount = override.stockCount;
                        } else {
                            merged.stockCount = product.id % 2 === 0 ? 200 : 150;
                        }
                        return merged;
                    });

                    // Combine with custom products
                    const combined = [...updatedProducts, ...customProducts];
                    return { products: combined };
                });
            }
        } catch (error) {
            console.error('Error fetching custom products:', error);
        }
    };

    fetchOrders = async () => {
        const token = localStorage.getItem('glamora_token');
        if (!token) {
            this.setState({ orders: [], orderLoading: false });
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const orders = await response.json();
                this.setState({ orders, orderLoading: false });
            } else {
                this.setState({ orderLoading: false });
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            this.setState({ orderLoading: false });
        }
    };

    getItem = (id) => {
        const product = this.state.products.find(item => item.id === id);
        return product;

    };

    handleDetail = (id) => {
        const product = this.getItem(id);
        this.setState(() => {
            return { detailProduct: product }
        })
    };

    openModal = id => {
        const product = this.getItem(id);
        this.setState(() => {
            return { modalProduct: product, modalOpen: true }
        })
    }

    closeModal = () => {
        this.setState(() => {
            return { modalOpen: false }
        })
    }

    addTotals = () => {
        let subTotal = 0;
        this.state.cart.map(item => (subTotal += item.total));
        const tempTax = subTotal * 0.1;
        const tax = parseFloat(tempTax.toFixed(2));
        const total = subTotal + tax;
        this.setState(() => {
            return {
                cartSubTotal: subTotal,
                cartTax: tax,
                cartTotal: total
            }
        })
    };

    // Load cart from database or localStorage
    loadCart = async () => {
        const token = localStorage.getItem('glamora_token');

        // If not logged in, load from localStorage
        if (!token) {
            console.log('No token found, loading cart from localStorage');
            const localCart = localStorage.getItem('glamora_cart');
            if (localCart) {
                try {
                    const cartItems = JSON.parse(localCart);
                    this.setState({ cart: cartItems }, () => this.addTotals());
                } catch (e) {
                    console.error('Error parsing local cart:', e);
                }
            }
            return;
        }

        try {
            console.log('Fetching cart from backend...');
            const response = await fetch('http://localhost:5000/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const cartItems = await response.json();
                console.log('Cart items received from backend:', cartItems);

                // Merge with products to get details
                let tempCart = [];
                let tempProducts = [...this.state.products];

                // If products are not loaded yet, we can't merge
                if (tempProducts.length === 0) {
                    console.log('Products not loaded yet, retrying loadCart in 500ms');
                    setTimeout(this.loadCart, 500);
                    return;
                }

                cartItems.forEach(item => {
                    const product = tempProducts.find(p => Number(p.id) === Number(item.product_id));
                    if (product) {
                        product.inCart = true;
                        product.count = item.count;
                        product.total = product.price * item.count;
                        tempCart.push(product);
                    } else {
                        console.warn(`Product with ID ${item.product_id} not found in store products`);
                    }
                });

                console.log('Final tempCart to be set in state:', tempCart);
                this.setState({
                    cart: tempCart,
                    products: tempProducts
                }, () => {
                    this.addTotals();
                    // Also save to localStorage as backup
                    localStorage.setItem('glamora_cart', JSON.stringify(tempCart));
                });
            } else {
                console.error('Failed to fetch cart:', response.statusText);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    };

    // Save cart item to database and localStorage
    saveCartItem = async (id, count) => {
        // Always save to localStorage first
        localStorage.setItem('glamora_cart', JSON.stringify(this.state.cart));

        const token = localStorage.getItem('glamora_token');
        if (!token) return;

        try {
            console.log(`Saving cart item to backend: ID=${id}, Count=${count}`);
            const response = await fetch('http://localhost:5000/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: id, count })
            });
            if (!response.ok) {
                console.error('Failed to save cart item to backend:', response.statusText);
            }
        } catch (error) {
            console.error('Error saving cart item to backend:', error);
        }
    };

    // Checkout
    checkout = async (loyaltyCode = null, finalTotal = null, paymentMethod = 'cash', address = '') => {
        const token = localStorage.getItem('glamora_token');
        if (!token) return { success: false, error: 'Please login to checkout' };

        try {
            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: this.state.cart,
                    total: finalTotal || this.state.cartTotal,
                    loyaltyCode: loyaltyCode,
                    paymentMethod: paymentMethod,
                    address: address
                })
            });

            if (response.ok) {
                this.clearCart();
                this.fetchOrders();
                return { success: true };
            } else {
                return { success: false, error: 'Checkout failed' };
            }
        } catch (error) {
            console.error('Checkout error:', error);
            return { success: false, error: 'Network error' };
        }
    };

    addToCart = (id) => {
        let tempProducts = [...this.state.products];
        const index = tempProducts.indexOf(this.getItem(id));

        const product = tempProducts[index];

        product.inCart = true;
        product.count = 1;

        const price = product.price;
        product.total = price;

        this.setState(() => {
            return { products: tempProducts, cart: [...this.state.cart, product] };
        },
            () => {
                this.addTotals();
                this.saveCartItem(id, 1);
            });
    };

    increment = (id) => {
        let tempCart = [...this.state.cart];

        const selectedProduct = tempCart.find(item => item.id === id);

        const index = tempCart.indexOf(selectedProduct);

        const product = tempCart[index];

        product.count = product.count + 1;
        product.total = product.count * product.price;

        this.setState(() => {
            return { cart: [...tempCart] }

        }, () => {
            this.addTotals();
            this.saveCartItem(id, product.count);
        }
        )
    };

    decrement = (id) => {
        let tempCart = [...this.state.cart];

        const selectedProduct = tempCart.find(item => item.id === id);

        const index = tempCart.indexOf(selectedProduct);

        const product = tempCart[index];

        product.count = product.count - 1;

        if (product.count === 0) {
            this.removeItem(id);
        }
        else {
            product.total = product.count * product.price;
            this.setState(() => {
                return { cart: [...tempCart] }

            }, () => {
                this.addTotals();
                this.saveCartItem(id, product.count);
            }
            )
        }

    };

    removeItem = (id) => {
        let tempProducts = [...this.state.products];
        let tempCart = [...this.state.cart];

        tempCart = tempCart.filter(item => item.id !== id);

        const index = tempProducts.indexOf(this.getItem(id));

        let removedProduct = tempProducts[index];
        removedProduct.inCart = false;
        removedProduct.count = 0;
        removedProduct.total = 0;


        this.setState(() => {
            return {
                cart: [...tempCart],
                products: [...tempProducts]
            }
        },
            () => {
                this.addTotals();
                this.saveCartItem(id, 0); // 0 count removes item
            }

        )


    };

    clearCart = () => {
        this.setState(() => {
            return { cart: [] };
        }, () => {
            this.storeProducts();
            this.addTotals();

            // Clear from localStorage
            localStorage.removeItem('glamora_cart');

            // Clear from backend
            const token = localStorage.getItem('glamora_token');
            if (token) {
                fetch('http://localhost:5000/api/cart', {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        }
        )
    };

    clearUserSession = () => {
        this.setState({
            cart: [],
            orders: [],
            orderLoading: false
        }, () => {
            this.storeProducts();
            this.addTotals();
            localStorage.removeItem('glamora_cart');
        });
    };

    render() {
        return (
            <ProductContext.Provider value={{
                ...this.state,
                handleDetail: this.handleDetail,
                addToCart: this.addToCart,
                openModal: this.openModal,
                closeModal: this.closeModal,
                increment: this.increment,
                decrement: this.decrement,
                removeItem: this.removeItem,
                clearCart: this.clearCart,
                clearUserSession: this.clearUserSession,
                loadCart: this.loadCart,
                fetchOrders: this.fetchOrders,
                checkout: this.checkout,
                fetchOrders: this.fetchOrders,
                checkout: this.checkout,
                handleSearch: this.handleSearch,
                setSearchTermDirectly: this.setSearchTermDirectly,
                handleCategory: this.handleCategory
            }}>
                {this.props.children}


            </ProductContext.Provider>
        )
    }
}

const ProductConsumer = ProductContext.Consumer;

export { ProductProvider, ProductConsumer, ProductContext };
