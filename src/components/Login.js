import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { AuthConsumer } from '../context/AuthContext';
import { ProductConsumer } from '../context';

class Login extends Component {
  state = {
    email: '',
    password: '',
    error: '',
    loading: false
  };

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
      error: ''
    });
  };

  handleSubmit = async (e, login, loadCart, fetchOrders) => {
    e.preventDefault();
    const { email, password } = this.state;

    if (!email || !password) {
      this.setState({ error: 'Please fill in all fields' });
      return;
    }

    this.setState({ loading: true });

    const result = await login(email, password);

    if (result.success) {
      // Load cart and orders from database
      if (loadCart) await loadCart();
      if (fetchOrders) await fetchOrders();

      // Redirect to home page
      this.props.history.push('/');
    } else {
      this.setState({
        error: result.error,
        loading: false
      });
    }
  };

  render() {
    const { email, password, error, loading } = this.state;

    return (
      <AuthConsumer>
        {(value) => (
          <LoginWrapper className="fade-in">
            <div className="login-container">
              <div className="login-card">
                <div className="login-header">
                  <h2 className="text-title">Welcome Back</h2>
                  <p className="subtitle">Login to your Glamora account</p>
                </div>

                <ProductConsumer>
                  {productValue => (
                    <form onSubmit={(e) => this.handleSubmit(e, value.login, productValue.loadCart, productValue.fetchOrders)}>
                      {error && <div className="error-message">{error}</div>}

                      <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={email}
                          onChange={this.handleChange}
                          placeholder="Enter your email"
                          disabled={loading}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={password}
                          onChange={this.handleChange}
                          placeholder="Enter your password"
                          disabled={loading}
                        />
                      </div>

                      <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                      </button>

                      <div className="forgot-password-container">
                        <Link to="/forgot-password">Forgot Password?</Link>
                      </div>
                    </form>
                  )}
                </ProductConsumer>

                <div className="login-footer">
                  <p>
                    Don't have an account?{' '}
                    <Link to="/signup" className="signup-link">
                      Sign up here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </LoginWrapper>
        )}
      </AuthConsumer>
    );
  }
}

export default Login;

const LoginWrapper = styled.div`
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;

  .login-container {
    width: 100%;
    max-width: 450px;
  }

  .login-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: var(--borderRadius);
    padding: 3rem 2.5rem;
    box-shadow: var(--darkShadow);
    border: 1px solid rgba(212, 86, 125, 0.1);
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;

    h2 {
      color: var(--mainPink);
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }

    .subtitle {
      color: var(--mainGrey);
      font-size: 0.95rem;
      margin-bottom: 0;
    }
  }

  .error-message {
    background: #fee;
    color: #c33;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    border-left: 4px solid #c33;
  }

  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--mainBlack);
      font-weight: 500;
      font-size: 0.95rem;
    }

    input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 1rem;
      font-family: 'Poppins', sans-serif;
      transition: var(--mainTransition);
      background: white;

      &:focus {
        outline: none;
        border-color: var(--mainPink);
        box-shadow: 0 0 0 3px rgba(212, 86, 125, 0.1);
      }

      &:disabled {
        background: #f8f9fa;
        cursor: not-allowed;
      }

      &::placeholder {
        color: #adb5bd;
      }
    }
  }

  .btn-login {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, var(--mainPink) 0%, var(--darkPink) 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.05rem;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    transition: var(--mainTransition);
    margin-top: 0.5rem;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(212, 86, 125, 0.3);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  .forgot-password-container {
    text-align: right;
    margin-top: 1rem;

    a {
      color: var(--mainPink);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: var(--mainTransition);

      &:hover {
        color: var(--darkPink);
        text-decoration: underline;
      }
    }
  }

  .login-footer {
    text-align: center;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e9ecef;

    p {
      color: var(--mainGrey);
      margin-bottom: 0;
      font-size: 0.95rem;
    }

    .signup-link {
      color: var(--mainPink);
      text-decoration: none;
      font-weight: 600;
      transition: var(--mainTransition);

      &:hover {
        color: var(--darkPink);
        text-decoration: underline;
      }
    }
  }

  @media screen and (max-width: 576px) {
    .login-card {
      padding: 2rem 1.5rem;
    }

    .login-header h2 {
      font-size: 1.75rem;
    }
  }
`;
