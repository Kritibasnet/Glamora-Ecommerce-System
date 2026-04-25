import React, { Component, createContext } from 'react';

const AuthContext = createContext();

class AuthProvider extends Component {
    state = {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: true
    };

    componentDidMount() {
        // Check for existing token in localStorage
        this.checkAuth();
    }

    checkAuth = () => {
        const token = localStorage.getItem('glamora_token');
        const user = localStorage.getItem('glamora_user');

        if (token && user) {
            // Verify token with backend
            fetch('http://localhost:5000/api/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.valid) {
                        this.setState({
                            isAuthenticated: true,
                            user: JSON.parse(user),
                            token: token,
                            loading: false
                        });
                    } else {
                        this.logout();
                    }
                })
                .catch(err => {
                    console.error('Auth verification error:', err);
                    this.logout();
                });
        } else {
            this.setState({ loading: false });
        }
    };

    login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('glamora_token', data.token);
                localStorage.setItem('glamora_user', JSON.stringify(data.user));

                this.setState({
                    isAuthenticated: true,
                    user: data.user,
                    token: data.token
                });

                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Login error details:', error);
            return { success: false, error: `Connection failed: ${error.message}. Please ensure the server is running on port 5000.` };
        }
    };

    sendOtp = async (email) => {
        try {
            const response = await fetch('http://localhost:5000/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Send OTP error details:', error);
            return { success: false, error: `Connection failed: ${error.message}. Please ensure the server is running on port 5000.` };
        }
    };

    register = async (username, email, password, otp, location = '', phone = '') => {
        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, otp, location, phone })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('glamora_token', data.token);
                localStorage.setItem('glamora_user', JSON.stringify(data.user));

                this.setState({
                    isAuthenticated: true,
                    user: data.user,
                    token: data.token
                });

                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Registration error details:', error);
            return { success: false, error: `Connection failed: ${error.message}. Please ensure the server is running on port 5000.` };
        }
    };

    logout = () => {
        localStorage.removeItem('glamora_token');
        localStorage.removeItem('glamora_user');

        this.setState({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false
        });
    };

    isAdmin = () => {
        return this.state.user && this.state.user.role === 'admin';
    };

    forgotPassword = async (email) => {
        try {
            const response = await fetch('http://localhost:5000/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Forgot password error details:', error);
            return { success: false, error: `Connection failed: ${error.message}. Please ensure the server is running on port 5000.` };
        }
    };

    updateProfile = async (username, location, phone) => {
        try {
            const response = await fetch('http://localhost:5000/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.state.token}`
                },
                body: JSON.stringify({ username, location, phone })
            });

            const data = await response.json();

            if (response.ok) {
                const updatedUser = { ...this.state.user, username, location, phone };
                localStorage.setItem('glamora_user', JSON.stringify(updatedUser));
                this.setState({ user: updatedUser });
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Update profile error details:', error);
            return { success: false, error: `Connection failed: ${error.message}` };
        }
    };

    resetPassword = async (email, otp, newPassword) => {
        try {
            const response = await fetch('http://localhost:5000/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Reset password error details:', error);
            return { success: false, error: `Connection failed: ${error.message}. Please ensure the server is running on port 5000.` };
        }
    };

    render() {
        return (
            <AuthContext.Provider
                value={{
                    ...this.state,
                    login: this.login,
                    register: this.register,
                    sendOtp: this.sendOtp,
                    forgotPassword: this.forgotPassword,
                    resetPassword: this.resetPassword,
                    updateProfile: this.updateProfile,
                    logout: this.logout,
                    checkAuth: this.checkAuth,
                    isAdmin: this.isAdmin
                }}
            >
                {this.props.children}
            </AuthContext.Provider>
        );
    }
}

const AuthConsumer = AuthContext.Consumer;

export { AuthProvider, AuthConsumer, AuthContext };
