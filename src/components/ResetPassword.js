import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { AuthConsumer } from '../context/AuthContext';

class ResetPassword extends Component {
    state = {
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: '',
        error: '',
        message: '',
        loading: false
    };

    componentDidMount() {
        const urlParams = new URLSearchParams(this.props.location.search);
        const email = urlParams.get('email');
        if (email) {
            this.setState({ email });
        }
    }

    handleChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value,
            error: '',
            message: ''
        });
    };

    handleSubmit = async (e, resetPassword) => {
        e.preventDefault();
        const { email, otp, newPassword, confirmPassword } = this.state;

        if (!email || !otp || !newPassword || !confirmPassword) {
            this.setState({ error: 'Please fill in all fields' });
            return;
        }

        if (newPassword !== confirmPassword) {
            this.setState({ error: 'Passwords do not match' });
            return;
        }

        if (newPassword.length < 8) {
            this.setState({ error: 'Password must be at least 8 characters' });
            return;
        }

        this.setState({ loading: true });

        const result = await resetPassword(email, otp, newPassword);

        if (result.success) {
            this.setState({
                message: 'Password reset successful! Redirecting to login...',
                loading: false
            });
            setTimeout(() => {
                this.props.history.push('/login');
            }, 2000);
        } else {
            this.setState({
                error: result.error,
                loading: false
            });
        }
    };

    render() {
        const { email, otp, newPassword, confirmPassword, error, message, loading } = this.state;

        return (
            <AuthConsumer>
                {(value) => (
                    <ResetWrapper className="fade-in">
                        <div className="reset-container">
                            <div className="reset-card">
                                <div className="reset-header">
                                    <h2 className="text-title">Reset Password</h2>
                                    <p className="subtitle">Enter the OTP sent to your email and your new password</p>
                                </div>

                                <form onSubmit={(e) => this.handleSubmit(e, value.resetPassword)}>
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
                                            disabled={true}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="otp">OTP Code</label>
                                        <input
                                            type="text"
                                            id="otp"
                                            name="otp"
                                            value={otp}
                                            onChange={this.handleChange}
                                            placeholder="Enter 6-digit OTP"
                                            maxLength="6"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="newPassword">New Password</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            name="newPassword"
                                            value={newPassword}
                                            onChange={this.handleChange}
                                            placeholder="Enter new password"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">Confirm New Password</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={confirmPassword}
                                            onChange={this.handleChange}
                                            placeholder="Confirm new password"
                                            disabled={loading}
                                        />
                                    </div>

                                    <button type="submit" className="btn-reset" disabled={loading}>
                                        {loading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </form>

                                <div className="reset-footer">
                                    <p>
                                        Back to{' '}
                                        <Link to="/login" className="login-link">
                                            Login
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ResetWrapper>
                )}
            </AuthConsumer>
        );
    }
}

export default ResetPassword;

const ResetWrapper = styled.div`
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;

  .reset-container {
    width: 100%;
    max-width: 450px;
  }

  .reset-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: var(--borderRadius);
    padding: 3rem 2.5rem;
    box-shadow: var(--darkShadow);
    border: 1px solid rgba(212, 86, 125, 0.1);
  }

  .reset-header {
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

  .btn-reset {
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

  .reset-footer {
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
