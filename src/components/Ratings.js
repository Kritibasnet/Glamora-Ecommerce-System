import React, { Component } from 'react';
import styled from 'styled-components';
import { AuthConsumer } from '../context/AuthContext';
import { ProductConsumer } from '../context';
import Title from './Title';

class Ratings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ratings: [],
            loading: true,
            error: null,
            selectedProduct: props.productId || 'all',
            newRating: {
                productId: props.productId || '',
                rating: 5,
                review: ''
            },
            showAddForm: false,
            submitting: false
        };
    }

    componentDidMount() {
        if (!this.props.productId) {
            document.title = 'Ratings & Reviews - Glamora';
        }
        this.fetchRatings();
    }
    
    componentDidUpdate(prevProps) {
        if (this.props.productId !== prevProps.productId) {
            this.setState(prevState => ({
                selectedProduct: this.props.productId || 'all',
                newRating: {
                    ...prevState.newRating,
                    productId: this.props.productId || ''
                }
            }));
        }
    }

    fetchRatings = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/ratings');
            const data = await response.json();

            if (response.ok) {
                this.setState({ ratings: data.ratings, loading: false });
            } else {
                this.setState({ error: 'Failed to load ratings', loading: false });
            }
        } catch (error) {
            console.error('Error fetching ratings:', error);
            this.setState({ error: 'Network error', loading: false });
        }
    };

    handleProductFilter = (e) => {
        this.setState({ selectedProduct: e.target.value });
    };

    handleRatingChange = (e) => {
        this.setState({
            newRating: {
                ...this.state.newRating,
                [e.target.name]: e.target.value
            }
        });
    };

    handleSubmitRating = async (e, token) => {
        e.preventDefault();
        const { newRating } = this.state;

        if (!newRating.productId) {
            alert('Please select a product');
            return;
        }

        this.setState({ submitting: true });

        try {
            const response = await fetch('http://localhost:5000/api/ratings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: parseInt(newRating.productId),
                    rating: parseInt(newRating.rating),
                    review: newRating.review
                })
            });

            if (response.ok) {
                alert('Rating submitted successfully!');
                this.setState({
                    newRating: { productId: '', rating: 5, review: '' },
                    showAddForm: false,
                    submitting: false
                });
                this.fetchRatings();
                if (this.props.onRatingSuccess) {
                    this.props.onRatingSuccess();
                }
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to submit rating');
                this.setState({ submitting: false });
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            alert('Network error');
            this.setState({ submitting: false });
        }
    };

    renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={i <= rating ? 'star filled' : 'star'}>
                    ★
                </span>
            );
        }
        return stars;
    };

    render() {
        const { ratings, loading, error, selectedProduct, newRating, showAddForm, submitting } = this.state;

        const filteredRatings = selectedProduct === 'all'
            ? ratings
            : ratings.filter(r => r.product_id === parseInt(selectedProduct));

        return (
            <AuthConsumer>
                {authValue => (
                    <ProductConsumer>
                        {productValue => (
                            <RatingsWrapper className="fade-in">
                                <div className="container">
                                    <Title name="Product" title="Ratings & Reviews" />

                                    <div className="ratings-header">
                                        {!this.props.productId && (
                                            <div className="filter-section">
                                                <label>Filter by Product:</label>
                                                <select value={selectedProduct} onChange={this.handleProductFilter}>
                                                    <option value="all">All Products</option>
                                                    {productValue.products.map(product => (
                                                        <option key={product.id} value={product.id}>
                                                            {product.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {authValue.isAuthenticated && this.props.allowAdd && (
                                            <button
                                                className="btn-add-rating"
                                                onClick={() => this.setState({ showAddForm: !showAddForm })}
                                            >
                                                {showAddForm ? '✕ Cancel' : '+ Add Review'}
                                            </button>
                                        )}
                                    </div>

                                    {showAddForm && authValue.isAuthenticated && (
                                        <div className="add-rating-form">
                                            <h3>Write a Review</h3>
                                            <form onSubmit={(e) => this.handleSubmitRating(e, authValue.token)}>
                                                {!this.props.productId && (
                                                    <div className="form-group">
                                                        <label>Select Product:</label>
                                                        <select
                                                            name="productId"
                                                            value={newRating.productId}
                                                            onChange={this.handleRatingChange}
                                                            required
                                                        >
                                                            <option value="">Choose a product...</option>
                                                            {productValue.products.map(product => (
                                                                <option key={product.id} value={product.id}>
                                                                    {product.title}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                <div className="form-group">
                                                    <label>Rating:</label>
                                                    <div className="rating-input">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <label key={star} className="star-label">
                                                                <input
                                                                    type="radio"
                                                                    name="rating"
                                                                    value={star}
                                                                    checked={parseInt(newRating.rating) === star}
                                                                    onChange={this.handleRatingChange}
                                                                />
                                                                <span className="star-icon">★</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label>Review (optional):</label>
                                                    <textarea
                                                        name="review"
                                                        value={newRating.review}
                                                        onChange={this.handleRatingChange}
                                                        placeholder="Share your experience with this product..."
                                                        rows="4"
                                                    />
                                                </div>

                                                <button type="submit" className="btn-submit" disabled={submitting}>
                                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {authValue.isAuthenticated && !this.props.allowAdd && (
                                        <div className="alert alert-light border text-center py-2 mb-4">
                                            <small className="text-muted">
                                                <i className="fas fa-info-circle mr-1"></i>
                                                Only verified buyers can review this product. You can add a review from your Dashboard after purchase.
                                            </small>
                                        </div>
                                    )}

                                    {!authValue.isAuthenticated && (
                                        <div className="login-prompt">
                                            <p>
                                                Please <a href="/login">login</a> to see if you can review this product.
                                            </p>
                                        </div>
                                    )}

                                    <div className="ratings-list">
                                        {loading ? (
                                            <div className="loading">Loading ratings...</div>
                                        ) : error ? (
                                            <div className="error">{error}</div>
                                        ) : filteredRatings.length === 0 ? (
                                            <div className="no-ratings">
                                                <h3>No reviews yet</h3>
                                                <p>Be the first to review this product!</p>
                                            </div>
                                        ) : (
                                            filteredRatings.map(rating => {
                                                const product = productValue.products.find(p => p.id === rating.product_id);
                                                return (
                                                    <div key={rating.id} className="rating-card">
                                                        <div className="rating-header">
                                                            <div className="product-info">
                                                                {!this.props.productId && product && (
                                                                    <>
                                                                        <img src={product.img} alt={product.title} className="product-thumb" />
                                                                        <div>
                                                                            <h4>{product.title}</h4>
                                                                            <p className="company">{product.company}</p>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="rating-stars">
                                                                {this.renderStars(rating.rating)}
                                                            </div>
                                                        </div>
                                                        <div className="rating-body">
                                                            <p className="review-text">{rating.review || 'No written review'}</p>
                                                            <div className="rating-footer">
                                                                <span className="username">👤 {rating.username}</span>
                                                                <span className="date">
                                                                    {new Date(rating.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </RatingsWrapper>
                        )}
                    </ProductConsumer>
                )}
            </AuthConsumer>
        );
    }
}

export default Ratings;

const RatingsWrapper = styled.div`
  min-height: calc(100vh - 80px);
  padding: 3rem 0;

  .ratings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;

    .filter-section {
      display: flex;
      align-items: center;
      gap: 1rem;

      label {
        font-weight: 600;
        color: var(--mainBlack);
      }

      select {
        padding: 0.75rem 1rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        cursor: pointer;
        transition: var(--mainTransition);

        &:focus {
          outline: none;
          border-color: var(--mainPink);
        }
      }
    }

    .btn-add-rating {
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, var(--mainPink), var(--darkPink));
      color: white;
      border: none;
      border-radius: 50px;
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
      cursor: pointer;
      transition: var(--mainTransition);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--darkShadow);
      }
    }
  }

  .add-rating-form {
    background: white;
    padding: 2rem;
    border-radius: var(--borderRadius);
    box-shadow: var(--lightShadow);
    margin-bottom: 2rem;

    h3 {
      color: var(--mainPink);
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--mainBlack);
      }

      select, textarea {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        transition: var(--mainTransition);

        &:focus {
          outline: none;
          border-color: var(--mainPink);
        }
      }

      textarea {
        resize: vertical;
      }
    }

    .rating-input {
      display: flex;
      gap: 0.5rem;

      .star-label {
        cursor: pointer;

        input {
          display: none;
        }

        .star-icon {
          font-size: 2rem;
          color: #ddd;
          transition: var(--mainTransition);
        }

        input:checked ~ .star-icon,
        &:hover .star-icon {
          color: var(--mainGold);
        }
      }

      .star-label:has(input:checked) ~ .star-label .star-icon {
        color: #ddd;
      }
    }

    .btn-submit {
      padding: 0.875rem 2.5rem;
      background: linear-gradient(135deg, var(--mainPink), var(--darkPink));
      color: white;
      border: none;
      border-radius: 50px;
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
      cursor: pointer;
      transition: var(--mainTransition);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: var(--darkShadow);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  .login-prompt {
    background: #fff3cd;
    border: 1px solid #ffc107;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    text-align: center;

    p {
      margin: 0;
      color: #856404;

      a {
        color: var(--mainPink);
        font-weight: 600;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .ratings-list {
    display: grid;
    gap: 1.5rem;
  }

  .rating-card {
    background: white;
    border-radius: var(--borderRadius);
    padding: 1.5rem;
    box-shadow: var(--lightShadow);
    transition: var(--mainTransition);

    &:hover {
      box-shadow: var(--darkShadow);
    }

    .rating-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f8f9fa;

      .product-info {
        display: flex;
        align-items: center;
        gap: 1rem;

        .product-thumb {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
        }

        h4 {
          margin: 0;
          color: var(--mainBlack);
          font-size: 1.1rem;
        }

        .company {
          margin: 0;
          color: var(--mainGrey);
          font-size: 0.9rem;
          text-transform: capitalize;
        }
      }

      .rating-stars {
        .star {
          font-size: 1.5rem;
          color: #ddd;

          &.filled {
            color: var(--mainGold);
          }
        }
      }
    }

    .rating-body {
      .review-text {
        color: var(--mainBlack);
        line-height: 1.6;
        margin-bottom: 1rem;
        font-style: italic;
      }

      .rating-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
        color: var(--mainGrey);

        .username {
          font-weight: 600;
        }
      }
    }
  }

  .loading, .error, .no-ratings {
    text-align: center;
    padding: 3rem 2rem;
    background: white;
    border-radius: var(--borderRadius);
    box-shadow: var(--lightShadow);

    h3 {
      color: var(--mainPink);
      margin-bottom: 0.5rem;
    }

    p {
      color: var(--mainGrey);
      margin-bottom: 0;
    }
  }

  @media screen and (max-width: 768px) {
    .ratings-header {
      flex-direction: column;
      align-items: stretch;

      .filter-section {
        flex-direction: column;
        align-items: stretch;
      }
    }

    .rating-card .rating-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
  }
`;
