import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import logo from '../cosmetics.png';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import MenuIcon from '@material-ui/icons/Menu';
import CloseIcon from '@material-ui/icons/Close';
import PersonIcon from '@material-ui/icons/Person';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import SearchIcon from '@material-ui/icons/Search';
import styled from 'styled-components';
import { ButtonContainer } from './Button';
import { AuthConsumer } from '../context/AuthContext';
import { ProductConsumer } from '../context';

class Navbar extends Component {
  state = {
    mobileMenuOpen: false,
    aiQuery: '',
    aiLoading: false,
  };

  toggleMobileMenu = () => {
    this.setState({ mobileMenuOpen: !this.state.mobileMenuOpen });
  };

  closeMobileMenu = () => {
    this.setState({ mobileMenuOpen: false });
  };

  handleAiSearch = async (e, setSearchTermDirectly) => {
    e.preventDefault();
    const { aiQuery } = this.state;
    if (!aiQuery.trim()) return;
    this.setState({ aiLoading: true });
    try {
      const response = await fetch('http://localhost:5000/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiQuery })
      });
      const data = await response.json();
      if (data.keyword) {
        setSearchTermDirectly(data.keyword);
        this.setState({ aiQuery: '' });
        if (this.props.history) {
          this.props.history.push('/home');
        }
      }
    } catch (err) {
      console.error('AI search error:', err);
    } finally {
      this.setState({ aiLoading: false });
    }
  };

  render() {
    const { mobileMenuOpen, aiQuery, aiLoading } = this.state;

    return (
      <AuthConsumer>
        {authValue => (
          <NavWrapper className="navbar navbar-expand-lg navbar-dark px-sm-5">
            <div className="nav-container vertical-nav">
              <div className="nav-top-row">
                <Link to="/" className="navbar-brand-wrapper" onClick={this.closeMobileMenu}>
                  <img src={logo} alt="Glamora" className="navbar-logo" height="50px" />
                  <span className="brand-name">Glamora</span>
                </Link>

                <div className="top-actions desktop-only">
                  {authValue.isAuthenticated ? (
                    <ProductConsumer>
                      {productValue => (
                        <div className="user-section">
                          <Link
                            to={authValue.user?.role === 'admin' ? "/admin-dashboard" : "/user-dashboard"}
                            className="dashboard-link"
                          >
                            {authValue.user?.role === 'admin' ? "Admin Dashboard" : "My Dashboard"}
                          </Link>
                          {authValue.user?.role === 'admin' ? (
                            <div className="user-greeting">
                              <PersonIcon style={{ fontSize: '1.2rem' }} />
                              {authValue.user?.username}
                            </div>
                          ) : (
                            <Link to="/profile" className="user-greeting profile-nav-link" title="View Profile">
                              <PersonIcon style={{ fontSize: '1.2rem' }} />
                              {authValue.user?.username}
                            </Link>
                          )}
                          <button className="btn-logout" onClick={() => {
                            authValue.logout();
                            productValue.clearUserSession();
                          }}>
                            <ExitToAppIcon style={{ fontSize: '1.1rem' }} />
                            Logout
                          </button>
                        </div>
                      )}
                    </ProductConsumer>
                  ) : (
                    <div className="auth-buttons">
                      <Link to="/login">
                        <button className="btn-auth btn-auth-outline">
                          Login
                        </button>
                      </Link>
                      <Link to="/signup">
                        <button className="btn-auth btn-signup">
                          Sign Up
                        </button>
                      </Link>
                    </div>
                  )}
                </div>

                <button className="mobile-menu-toggle" onClick={this.toggleMobileMenu}>
                  {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
              </div>

              <div className={`nav-bottom-row ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <ul className="navbar-nav">
                  {authValue.user?.role !== 'admin' && (
                    <li className="nav-item">
                      <Link to="/" className="nav-link" onClick={this.closeMobileMenu}>
                        Home
                      </Link>
                    </li>
                  )}
                  {authValue.isAuthenticated && authValue.user?.role === 'user' && (
                    <li className="nav-item">
                      <Link to="/home" className="nav-link" onClick={this.closeMobileMenu}>
                        Shop
                      </Link>
                    </li>
                  )}
                  {authValue.user?.role !== 'admin' && (
                    <>
                      <li className="nav-item">
                        <Link to="/top-week" className="nav-link" onClick={this.closeMobileMenu}>
                          Top This Week
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/about" className="nav-link" onClick={this.closeMobileMenu}>
                          About Us
                        </Link>
                      </li>
                    </>
                  )}
                </ul>

                <div className="nav-actions bottom-actions">
                  {/* Mobile auth buttons inside dropdown */}
                  <div className="mobile-only-auth">
                    {authValue.isAuthenticated ? (
                      <ProductConsumer>
                        {productValue => (
                          <div className="user-section">
                            <Link
                              to={authValue.user?.role === 'admin' ? "/admin-dashboard" : "/user-dashboard"}
                              className="dashboard-link"
                              onClick={this.closeMobileMenu}
                            >
                              {authValue.user?.role === 'admin' ? "Admin Dashboard" : "My Dashboard"}
                            </Link>
                            {authValue.user?.role === 'admin' ? (
                              <div className="user-greeting">
                                <PersonIcon style={{ fontSize: '1.2rem' }} />
                                {authValue.user?.username}
                              </div>
                            ) : (
                              <Link 
                                to="/profile" 
                                className="user-greeting profile-nav-link" 
                                onClick={this.closeMobileMenu}
                                title="View Profile"
                              >
                                <PersonIcon style={{ fontSize: '1.2rem' }} />
                                {authValue.user?.username}
                              </Link>
                            )}
                            <button className="btn-logout" onClick={() => {
                              authValue.logout();
                              productValue.clearUserSession();
                              this.closeMobileMenu();
                            }}>
                              <ExitToAppIcon style={{ fontSize: '1.1rem' }} />
                              Logout
                            </button>
                          </div>
                        )}
                      </ProductConsumer>
                    ) : (
                      <div className="auth-buttons">
                        <Link to="/login" onClick={this.closeMobileMenu}>
                          <button className="btn-auth btn-auth-outline">
                            Login
                          </button>
                        </Link>
                        <Link to="/signup" onClick={this.closeMobileMenu}>
                          <button className="btn-auth btn-signup">
                            Sign Up
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {authValue.isAuthenticated && authValue.user?.role !== 'admin' && (
                    <ProductConsumer>
                      {productValue => (
                        <Link to="/cart" className="cart-link" onClick={this.closeMobileMenu}>
                          <button className="btn-cart">
                            <span className="cart-icon">
                              <ShoppingCartIcon style={{ fontSize: '1.2rem' }} />
                              {productValue.cart.length > 0 && (
                                <span className="cart-badge">{productValue.cart.length}</span>
                              )}
                            </span>
                            My Cart
                          </button>
                        </Link>
                      )}
                    </ProductConsumer>
                  )}

                  {authValue.user?.role !== 'admin' && (
                    <ProductConsumer>
                      {productValue => {
                        this._authRole = authValue.user?.role;
                        return (
                          <form
                            className="ai-search-container"
                            onSubmit={(e) => this.handleAiSearch(e, productValue.setSearchTermDirectly)}
                          >
                            <div className="ai-search-wrapper">
                              <span className="ai-icon" title="AI Powered">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"/>
                                </svg>
                              </span>
                              <input
                                type="text"
                                placeholder="Describe a product..."
                                value={aiQuery}
                                onChange={(e) => this.setState({ aiQuery: e.target.value })}
                                className="ai-search-input"
                              />
                              <button type="submit" className="ai-search-btn" disabled={aiLoading}>
                                {aiLoading ? '...' : 'AI'}
                              </button>
                            </div>
                          </form>
                        );
                      }}
                    </ProductConsumer>
                  )}
                </div>
              </div>
            </div>
          </NavWrapper>
        )}
      </AuthConsumer>
    );
  }
}

export default withRouter(Navbar);

const NavWrapper = styled.nav`
  background: linear-gradient(135deg, var(--mainPink) 0%, var(--darkPink) 100%);
  position: sticky;
  top: 0;
  left: 0;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(212, 86, 125, 0.3);
  padding: 0.2rem 0;

  .nav-container.vertical-nav {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .nav-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-bottom: 0.25rem;
  }

  .nav-bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-top: 0.25rem;
  }

  .desktop-only {
    display: flex;
  }
  
  .mobile-only-auth {
    display: none;
  }

  .navbar-brand-wrapper {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-decoration: none;
    transition: var(--mainTransition);

    &:hover {
      transform: scale(1.05);
    }

    .navbar-logo {
      height: 35px;
      width: auto;
    }

    .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 1.4rem;
      font-weight: 700;
      color: white;
      letter-spacing: 1px;
    }
  }

  .mobile-menu-toggle {
    display: none;
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0.5rem;
    transition: var(--mainTransition);

    &:hover {
      transform: scale(1.1);
    }

    svg {
      font-size: 2rem;
    }
  }

  .navbar-nav {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 0.5rem;
  }

  .nav-item {
    .nav-link {
      color: white !important;
      font-size: 0.85rem;
      font-weight: 500;
      text-decoration: none;
      padding: 0.3rem 0.8rem;
      border-radius: 8px;
      transition: var(--mainTransition);
      display: block;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
      }
    }
  }

  .ai-search-container {
    margin-left: 0.5rem;
    max-width: 280px;
    width: 100%;
  }

  .ai-search-wrapper {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    overflow: hidden;
    transition: all 0.3s ease;

    &:focus-within {
      background: rgba(255, 255, 255, 0.25);
      border-color: white;
      box-shadow: 0 0 12px rgba(255,255,255,0.2);
    }
  }

  .ai-icon {
    padding: 0 0.5rem 0 0.7rem;
    display: flex;
    align-items: center;
    opacity: 0.9;
    animation: pulse 2s infinite;
    @keyframes pulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
  }

  .ai-search-input {
    background: none;
    border: none;
    color: white;
    width: 100%;
    font-family: 'Poppins', sans-serif;
    font-size: 0.78rem;
    padding: 0.3rem 0.3rem 0.3rem 0;

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.75);
      font-style: italic;
    }
  }

  .ai-search-btn {
    background: rgba(255,255,255,0.25);
    border: none;
    color: white;
    font-weight: 700;
    font-size: 0.72rem;
    padding: 0.3rem 0.7rem;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: background 0.2s ease;
    height: 100%;

    &:hover {
      background: rgba(255,255,255,0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

    &::placeholder {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 1rem;

    .dashboard-link {
      color: white;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 50px;
      transition: var(--mainTransition);
      
      &:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: white;
      }
    }

    .user-greeting {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      font-weight: 500;
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 50px;
      text-decoration: none;
      transition: var(--mainTransition);

      &.profile-nav-link:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
        color: white;
      }
    }

    .btn-logout {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 50px;
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: var(--mainTransition);

      &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
      }
    }
  }

  .auth-buttons {
    display: flex;
    gap: 0.5rem;

    .btn-auth {
      padding: 0.2rem 0.8rem;
      font-size: 0.75rem;
      border-radius: 50px;
      font-weight: 500;
      border: 1px solid var(--mainWhite);
      cursor: pointer;
      transition: var(--mainTransition);
    }
    
    .btn-auth-outline {
      background: transparent;
      color: white;
      &:hover {
        background: rgba(255, 255, 255, 0.15);
      }
    }

    .btn-signup {
      background: white;
      color: var(--mainPink);

      &:hover {
        background: var(--lightGrey);
      }
    }
  }

  .cart-link {
    text-decoration: none;

    .btn-cart {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 2rem;
      font-size: 0.75rem;
      border-radius: 50px;
      background: white;
      color: var(--mainPink);
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: var(--mainTransition);
      white-space: nowrap;

      .cart-icon {
        display: flex;
        align-items: center;
        position: relative;
      }

      .cart-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--mainBlack);
        color: white;
        font-size: 0.7rem;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        border: 2px solid white;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      }
    }
  }

  @media screen and (max-width: 992px) {
    .mobile-menu-toggle {
      display: block;
    }

    .desktop-only {
      display: none !important;
    }

    .mobile-only-auth {
      display: block;
      width: 100%;
      margin-bottom: 1rem;
    }

    .nav-top-row {
      border-bottom: none;
      padding-bottom: 0;
    }

    .nav-bottom-row {
      position: fixed;
      top: 70px;
      right: -100%;
      width: 300px;
      height: calc(100vh - 70px);
      background: linear-gradient(135deg, var(--mainPink) 0%, var(--darkPink) 100%);
      flex-direction: column;
      align-items: stretch;
      padding: 2rem 1rem;
      gap: 1.5rem;
      transition: right 0.3s ease-in-out;
      box-shadow: -5px 0 20px rgba(0, 0, 0, 0.2);
      overflow-y: auto;
      justify-content: flex-start;

      &.mobile-open {
        right: 0;
      }
    }

    .navbar-nav {
      flex-direction: column;
      width: 100%;
      gap: 0;
      margin-bottom: 1rem;

      .nav-item {
        width: 100%;

        .nav-link {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }
      }
    }

    .nav-actions {
      flex-direction: column;
      width: 100%;
      gap: 1rem;
    }

    .user-section {
      flex-direction: column;
      width: 100%;

      .user-greeting {
        width: 100%;
        justify-content: center;
      }

      .btn-logout {
        width: 100%;
        justify-content: center;
      }
    }

    .auth-buttons {
      flex-direction: column;
      width: 100%;

      a {
        width: 100%;

        .btn-auth {
          width: 100%;
          justify-content: center;
        }
      }
    }

    .cart-link {
      width: 100%;

      .btn-cart {
        width: 100%;
        justify-content: center;
      }
    }
  }

  @media screen and (max-width: 992px) {
    .search-container {
      margin: 1rem 0 0 0;
      max-width: 100%;
    }
  }

  @media screen and (max-width: 576px) {
    .navbar-brand-wrapper {
      .brand-name {
        font-size: 1.5rem;
      }

      .navbar-logo {
        height: 40px;
      }
    }

    .search-container {
      margin-top: 1rem;
    }
  }
`;
