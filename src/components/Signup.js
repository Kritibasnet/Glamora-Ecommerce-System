import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { AuthConsumer } from '../context/AuthContext';
import { ProductConsumer } from '../context';

class Signup extends Component {
  state = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    otpSent: false,
    location: '',
    phone: '',
    error: '',
    loading: false
  };

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
      error: ''
    });
  };

  handleSubmit = async (e, value, loadCart, fetchOrders) => {
    e.preventDefault();
    const { username, email, password, confirmPassword, otp, otpSent, location, phone } = this.state;

    // Initial Validation
    if (!username || !email || !password || !confirmPassword || !location || !phone) {
      this.setState({ error: 'Please fill in all fields (Location and Phone are required)' });
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.setState({ error: 'Please enter a valid email address' });
      return;
    }

    if (password.length < 8) {
      this.setState({ error: 'Password must be at least 8 characters' });
      return;
    }

    if (password !== confirmPassword) {
      this.setState({ error: 'Passwords do not match' });
      return;
    }

    this.setState({ loading: true });

    if (!otpSent) {
      // Step 1: Send OTP
      const result = await value.sendOtp(email);
      if (result.success) {
        this.setState({ otpSent: true, loading: false, error: '' });
      } else {
        this.setState({ error: result.error, loading: false });
      }
    } else {
      // Step 2: Verify & Register
      if (!otp) {
        this.setState({ error: 'Please enter the OTP', loading: false });
        return;
      }

      const result = await value.register(username, email, password, otp, location, phone);

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
    }
  };

  render() {
    const { username, email, password, confirmPassword, error, loading, otpSent, otp, location, phone } = this.state;

    return (
      <AuthConsumer>
        {(value) => (
          <ProductConsumer>
            {productValue => (
              <SignupWrapper className="fade-in">
                <div className="signup-container">
                  <div className="signup-card">
                    <div className="signup-header">
                      <h2 className="text-title">Join Glamora</h2>
                      <p className="subtitle">Create your account and start shopping</p>
                    </div>

                    <form onSubmit={(e) => this.handleSubmit(e, value, productValue.loadCart, productValue.fetchOrders)}>
                      {error && <div className="error-message">{error}</div>}

                      <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={username}
                          onChange={this.handleChange}
                          placeholder="Choose a username"
                          disabled={loading || otpSent}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={email}
                          onChange={this.handleChange}
                          placeholder="Enter your email"
                          disabled={loading || otpSent}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          value={phone}
                          onChange={this.handleChange}
                          placeholder="Enter your phone number"
                          disabled={loading || otpSent}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="location">Location Address</label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={location}
                          onChange={this.handleChange}
                          placeholder="Enter your delivery address"
                          disabled={loading || otpSent}
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
                          placeholder="Create a password (min. 8 characters)"
                          disabled={loading || otpSent}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={confirmPassword}
                          onChange={this.handleChange}
                          placeholder="Confirm your password"
                          disabled={loading || otpSent}
                        />
                      </div>

                      {otpSent && (
                        <div className="form-group fade-in">
                          <label htmlFor="otp">Enter OTP</label>
                          <input
                            type="text"
                            id="otp"
                            name="otp"
                            value={otp}
                            onChange={this.handleChange}
                            placeholder="Enter the verification code"
                            disabled={loading}
                          />
                          <p style={{ fontSize: '0.8rem', color: 'var(--mainGrey)', marginTop: '0.5rem' }}>
                            We sent a verification code to {email}
                          </p>
                        </div>
                      )}

                      <button type="submit" className="btn-signup" disabled={loading}>
                        {loading ? 'Processing...' : (otpSent ? 'Verify & Register' : 'Send Verification Code')}
                      </button>
                    </form>

                    <div className="signup-footer">
                      <p>
                        Already have an account?{' '}
                        <Link to="/login" className="login-link">
                          Login here
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </SignupWrapper>
            )}
          </ProductConsumer>
        )}
      </AuthConsumer>
    );
  }
}

export default Signup;

const SignupWrapper = styled.div`
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;

  .signup-container {
    width: 100%;
    max-width: 500px;
  }

  .signup-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: var(--borderRadius);
    padding: 3rem 2.5rem;
    box-shadow: var(--darkShadow);
    border: 1px solid rgba(212, 86, 125, 0.1);
  }

  .signup-header {
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
    margin-bottom: 1.25rem;

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

  .btn-signup {
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

  .signup-footer {
    text-align: center;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e9ecef;

    p {
      color: var(--mainGrey);
      margin-bottom: 0;
      font-size: 0.95rem;
    }

    .login-link {
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
    .signup-card {
      padding: 2rem 1.5rem;
    }

    .signup-header h2 {
      font-size: 1.75rem;
    }
  }
`;
