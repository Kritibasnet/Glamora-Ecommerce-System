import React, { Component } from 'react';
import styled from 'styled-components';
import { AuthConsumer } from '../context/AuthContext';
import Title from './Title';

export default class UserProfile extends Component {
    state = {
        username: '',
        location: '',
        phone: '',
        isEditing: false,
        message: '',
        loading: false
    };

    componentDidMount() {
        this.fetchProfile();
    }

    fetchProfile = async () => {
        const token = localStorage.getItem('glamora_token');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:5000/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                this.setState({ 
                    username: data.username || '',
                    location: data.location || '', 
                    phone: data.phone || '' 
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleSubmit = async (e, updateProfile) => {
        e.preventDefault();
        this.setState({ loading: true, message: '' });
        
        const { username, location, phone } = this.state;
        const result = await updateProfile(username, location, phone);
        
        if (result.success) {
            this.setState({ 
                isEditing: false, 
                loading: false, 
                message: 'Profile updated successfully!' 
            });
            setTimeout(() => this.setState({ message: '' }), 3000);
        } else {
            this.setState({ 
                loading: false, 
                message: result.error || 'Failed to update profile' 
            });
        }
    };

    render() {
        const { username, location, phone, isEditing, message, loading } = this.state;

        return (
            <AuthConsumer>
                {authValue => (
                    <ProfileWrapper className="container py-5">
                        <Title name="My" title="Profile" />
                        
                        <div className="row justify-content-center mt-5">
                            <div className="col-md-8 col-lg-6">
                                <div className="card border-0 shadow-lg">
                                    <div className="card-body p-4">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <h3 className="mb-0">
                                                <i className="fas fa-user-circle mr-2 text-pink"></i>
                                                Personal Details
                                            </h3>
                                            {!isEditing ? (
                                                <button 
                                                    className="btn btn-pink-outline btn-sm"
                                                    onClick={() => this.setState({ isEditing: true })}
                                                >
                                                    <i className="fas fa-edit mr-1"></i> Edit
                                                </button>
                                            ) : (
                                                <button 
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={() => this.setState({ isEditing: false })}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>

                                        {message && (
                                            <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-danger'} fade show`}>
                                                {message}
                                            </div>
                                        )}

                                        {!isEditing ? (
                                            <div className="profile-info">
                                                <div className="info-group">
                                                    <label>Full Name</label>
                                                    <p>{username || authValue.user?.username}</p>
                                                </div>
                                                <div className="info-group">
                                                    <label>Email Address</label>
                                                    <p>{authValue.user?.email}</p>
                                                </div>
                                                <div className="info-group">
                                                    <label>Phone Number</label>
                                                    <p>{phone || <span className="text-muted italic">Not provided</span>}</p>
                                                </div>
                                                <div className="info-group">
                                                    <label>Delivery Location</label>
                                                    <p>{location || <span className="text-muted italic">Not provided</span>}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <form onSubmit={(e) => this.handleSubmit(e, authValue.updateProfile)}>
                                                <div className="form-group mb-3">
                                                    <label className="font-weight-bold">Full Name</label>
                                                    <input 
                                                        type="text" 
                                                        name="username"
                                                        className="form-control" 
                                                        value={username}
                                                        onChange={this.handleChange}
                                                        placeholder="Enter your full name"
                                                        required
                                                    />
                                                </div>
                                                <div className="form-group mb-3">
                                                    <label className="font-weight-bold">Phone Number</label>
                                                    <input 
                                                        type="text" 
                                                        name="phone"
                                                        className="form-control" 
                                                        value={phone}
                                                        onChange={this.handleChange}
                                                        placeholder="Enter your phone number"
                                                    />
                                                </div>
                                                <div className="form-group mb-4">
                                                    <label className="font-weight-bold">Delivery Location</label>
                                                    <textarea 
                                                        name="location"
                                                        className="form-control" 
                                                        rows="3"
                                                        value={location}
                                                        onChange={this.handleChange}
                                                        placeholder="Enter your delivery address"
                                                    ></textarea>
                                                </div>
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-pink w-100"
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ProfileWrapper>
                )}
            </AuthConsumer>
        );
    }
}

const ProfileWrapper = styled.div`
    min-height: 80vh;

    .card {
        border-radius: 15px;
        overflow: hidden;
    }

    .text-pink {
        color: var(--mainPink);
    }

    .btn-pink {
        background: var(--mainPink);
        color: white;
        font-weight: 600;
        border-radius: 8px;
        padding: 0.8rem;
        transition: all 0.3s ease;

        &:hover {
            background: var(--darkPink);
            transform: translateY(-2px);
        }
    }

    .btn-pink-outline {
        border: 1px solid var(--mainPink);
        color: var(--mainPink);
        font-weight: 600;
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
            background: var(--mainPink);
            color: white;
        }
    }

    .info-group {
        margin-bottom: 1.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #f0f0f0;

        label {
            display: block;
            font-size: 0.85rem;
            color: #888;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 0.3rem;
        }

        p {
            font-size: 1.1rem;
            margin-bottom: 0;
            color: #333;
            font-weight: 500;
        }

        .italic {
            font-style: italic;
        }
    }

    .form-control {
        border-radius: 8px;
        padding: 0.75rem 1rem;
        border: 1px solid #ddd;

        &:focus {
            border-color: var(--mainPink);
            box-shadow: 0 0 0 0.2rem rgba(212, 86, 125, 0.15);
        }
    }
`;
