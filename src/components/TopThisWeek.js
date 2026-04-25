import React, { Component } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ProductConsumer } from '../context';
import Title from './Title';

class TopThisWeek extends Component {
  componentDidMount() {
    document.title = 'Top This Week - Glamora';
  }

  render() {
    return (
      <ProductConsumer>
        {value => {
          // Get top 6 products (first 6 from the product list)
          const topProducts = value.products.slice(0, 6);

          return (
            <TopWeekWrapper className="fade-in">
              <div className="container">
                <div className="header-section">
                  <Title name="Top" title="This Week" />
                  <p className="subtitle">
                    ✨ Our most popular products this week - handpicked for you!
                  </p>
                </div>

                <div className="featured-badge">
                  <span className="badge-icon">🔥</span>
                  <span className="badge-text">Trending Now</span>
                </div>

                <div className="products-grid">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="product-card slide-in-left" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="rank-badge">#{index + 1}</div>
                      <div className="product-image">
                        <img src={product.img} alt={product.title} />
                        <div className="overlay">
                          <button
                            className="btn-details"
                            onClick={() => value.handleDetail(product.id)}
                          >
                            <Link to="/details" style={{ color: 'inherit', textDecoration: 'none' }}>View Details</Link>
                          </button>
                          {product.inCart ? (
                            <div className="quantity-selector">
                              <button className="qty-action" onClick={() => value.decrement(product.id)}>−</button>
                              <span className="qty-val">{product.count}</span>
                              <button className="qty-action" onClick={() => value.increment(product.id)}>+</button>
                            </div>
                          ) : (
                            <button
                              className="btn-cart"
                              disabled={!product.inStock}
                              onClick={() => {
                                value.addToCart(product.id);
                                value.openModal(product.id);
                              }}
                            >
                              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="product-info">
                        <h3>{product.title}</h3>
                        <p className="company">{product.company}</p>
                        <div className="price-section">
                          <span className="price">${product.price}</span>
                          <span className="trending-tag">🔥 Hot</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cta-section">
                  <h3>Want to see more?</h3>
                  <p>Explore our complete collection of premium beauty products</p>
                  <Link to="/" className="btn-explore">
                    Explore All Products
                  </Link>
                </div>
              </div>
            </TopWeekWrapper>
          );
        }}
      </ProductConsumer>
    );
  }
}

export default TopThisWeek;

const TopWeekWrapper = styled.div`
  min-height: calc(100vh - 80px);
  padding: 3rem 0;

  .header-section {
    text-align: center;
    margin-bottom: 2rem;

    .subtitle {
      font-size: 1.2rem;
      color: var(--mainGrey);
      margin-bottom: 0;
    }
  }

  .featured-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, var(--mainPink), var(--darkPink));
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 3rem;
    box-shadow: var(--darkShadow);
    animation: pulse 2s infinite;

    .badge-icon {
      font-size: 1.5rem;
    }
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2.5rem;
    margin-bottom: 4rem;
  }

  .product-card {
    background: white;
    border-radius: var(--borderRadius);
    overflow: hidden;
    box-shadow: var(--lightShadow);
    transition: var(--mainTransition);
    position: relative;

    &:hover {
      transform: translateY(-10px);
      box-shadow: var(--darkShadow);
    }

    .rank-badge {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: linear-gradient(135deg, var(--mainGold), var(--lightGold));
      color: white;
      width: 45px;
      height: 45px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      z-index: 10;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }

    .product-image {
      position: relative;
      height: 300px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: var(--mainTransition);
      }

      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(212, 86, 125, 0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        opacity: 0;
        transition: var(--mainTransition);
      }

      &:hover .overlay {
        opacity: 1;
      }

      &:hover img {
        transform: scale(1.1);
      }

      button {
        padding: 0.75rem 2rem;
        border: none;
        border-radius: 50px;
        font-weight: 600;
        font-family: 'Poppins', sans-serif;
        cursor: pointer;
        transition: var(--mainTransition);
        font-size: 1rem;
      }

      .btn-details {
        background: white;
        color: var(--mainPink);

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
      }

      .btn-cart {
        background: var(--mainGold);
        color: white;

        &:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .quantity-selector {
        display: flex;
        align-items: center;
        background: white;
        border-radius: 50px;
        padding: 0.5rem 1rem;
        gap: 1.5rem;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);

        .qty-action {
          background: var(--mainPink);
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: bold;
          border: none;
          cursor: pointer;
          transition: var(--mainTransition);

          &:hover {
            background: var(--darkPink);
            transform: scale(1.1);
          }
        }

        .qty-val {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--mainPink);
          min-width: 30px;
          text-align: center;
        }
      }
    }

    .product-info {
      padding: 1.5rem;

      h3 {
        color: var(--mainBlack);
        font-size: 1.4rem;
        margin-bottom: 0.5rem;
        font-family: 'Playfair Display', serif;
      }

      .company {
        color: var(--mainGrey);
        font-size: 0.95rem;
        margin-bottom: 1rem;
        text-transform: capitalize;
      }

      .price-section {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .price {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--mainPink);
        }

        .trending-tag {
          background: #fff3e0;
          color: #ff6f00;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
      }
    }
  }

  .cta-section {
    text-align: center;
    background: linear-gradient(135deg, rgba(212, 86, 125, 0.1), rgba(168, 61, 94, 0.1));
    padding: 3rem 2rem;
    border-radius: var(--borderRadius);
    margin-top: 3rem;

    h3 {
      color: var(--mainPink);
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    p {
      color: var(--mainGrey);
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }

    .btn-explore {
      display: inline-block;
      padding: 1rem 3rem;
      background: linear-gradient(135deg, var(--mainPink), var(--darkPink));
      color: white;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 1.1rem;
      transition: var(--mainTransition);
      box-shadow: var(--darkShadow);

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(212, 86, 125, 0.4);
      }
    }
  }

  @media screen and (max-width: 768px) {
    padding: 2rem 0;

    .products-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .product-card .product-image {
      height: 250px;
    }
  }
`;
