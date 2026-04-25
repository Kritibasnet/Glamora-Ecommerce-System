import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { AuthConsumer } from '../context/AuthContext';

class ForgotPassword extends Component {
    state = {
        email: '',
        error: '',
        message: '',
        loading: false
    };

    handleChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value,
            error: '',
            message: ''
        });
    };

    handleSubmit = async (e, forgotPassword) => {
        e.preventDefault();
        const { email } = this.state;

        if (!email) {
            this.setState({ error: 'Please enter your email address' });
            return;
        }

        this.setState({ loading: true });

        const result = await forgotPassword(email);

        if (result.success) {
            this.setState({
                message: 'OTP has been sent to your email. Redirecting to reset password...',
                loading: false
            });
            setTimeout(() => {
                this.props.history.push(`/reset-password?email=${email}`);
            }, 2000);
        } else {
            this.setState({
                error: result.error,
                loading: false
            });
        }
    };

    render() {
        const { email, error, message, loading } = this.state;

        return (
            <AuthConsumer>
                {(value) => (
                    <ForgotWrapper className="fade-in">
                        <div className="forgot-container">
                            <div className="forgot-card">
                                <div className="forgot-header">
                                    <h2 className="text-title">Forgot Password</h2>
                                    <p className="subtitle">Enter your email to receive a reset OTP</p>
                                </div>

                                <form onSubmit={(e) => this.handleSubmit(e, value.forgotPassword)}>
                                    {error && <div className="error-message">{error}</div>}
                                    {message && <div className="success-message">{message}</div>}

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

                                    <button type="submit" className="btn-forgot" disabled={loading}>
                                        {loading ? 'Sending OTP...' : 'Send Reset OTP'}
                                    </button>
                                </form>

                                <div className="forgot-footer">
                                    <p>
                                        Remember your password?{' '}
                                        <Link to="/login" className="login-link">
                                            Back to Login
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ForgotWrapper>
                )}
            </AuthConsumer>
        );
    }
}

export default ForgotPassword;

const ForgotWrapper = styled.div`
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;

  .forgot-container {
    width: 100%;
    max-width: 450px;
  }

  .forgot-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: var(--borderRadius);
    padding: 3rem 2.5rem;
    box-shadow: var(--darkShadow);
    border: 1px solid rgba(212, 86, 125, 0.1);
  }

  .forgot-header {
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

  .success-message {
    background: #efe;
    color: #28a745;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    border-left: 4px solid #28a745;
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

  .btn-forgot {
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

  .forgot-footer {
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
`;
