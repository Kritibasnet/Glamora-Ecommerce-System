import React, { Component } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from './components/Navbar';
import Details from './components/Details';
import Default from './components/Default';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Modal from './components/Modal';
import Login from './components/Login';
import Signup from './components/Signup';
import AboutUs from './components/AboutUs';
import Ratings from './components/Ratings';
import TopThisWeek from './components/TopThisWeek';
import UserDashboard from './components/UserDashboard';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import LandingPage from './components/LandingPage';
import EsewaSuccess from './components/EsewaSuccess';
import EsewaFailure from './components/EsewaFailure';
import { AuthProvider, AuthConsumer } from './context/AuthContext';
import ChatWidget from './components/ChatWidget';
import PromoPopup from './components/PromoPopup';
import { RecommendedProductPopup } from './components/RecommendationPopup';

class App extends Component {
  // Trigger HMR rebuild
  componentDidMount() {
    document.title = 'Glamora - Premium Cosmetics';
  }

  render() {
    return (
      <AuthProvider>
        <React.Fragment>
          <Navbar />
          <Switch>
            <Route exact path="/" render={(props) => (
              <AuthConsumer>
                {({ isAuthenticated, user }) => {
                  if (isAuthenticated) {
                    if (user?.role === 'admin') {
                      return <Redirect to="/admin-dashboard" />;
                    }
                    return <LandingPage {...props} />;
                  }
                  return <ProductList {...props} />;
                }}
              </AuthConsumer>
            )} />
            <Route path="/home" render={(props) => (
              <AuthConsumer>
                {({ isAuthenticated, user }) => {
                  if (isAuthenticated && user?.role === 'admin') {
                    return <Redirect to="/admin-dashboard" />;
                  }
                  return <ProductList {...props} />;
                }}
              </AuthConsumer>
            )} />
            <Route path="/details" render={(props) => (
              <AuthConsumer>
                {({ isAuthenticated, user }) => {
                  if (isAuthenticated && user?.role === 'admin') {
                    return <Redirect to="/admin-dashboard" />;
                  }
                  return <Details {...props} />;
                }}
              </AuthConsumer>
            )} />
            <Route
              path="/cart"
              render={(props) => (
                <AuthConsumer>
                  {auth => {
                    if (!auth.isAuthenticated) {
                      return <Redirect to="/login" />;
                    }
                    return auth.user?.role === 'admin' ?
                      <Redirect to="/admin-dashboard" /> :
                      <Cart {...props} />;
                  }}
                </AuthConsumer>
              )}
            />
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/about" render={(props) => (
              <AuthConsumer>
                {({ isAuthenticated, user }) => {
                  if (isAuthenticated && user?.role === 'admin') {
                    return <Redirect to="/admin-dashboard" />;
                  }
                  return <AboutUs {...props} />;
                }}
              </AuthConsumer>
            )} />
            <Route path="/top-week" render={(props) => (
              <AuthConsumer>
                {({ isAuthenticated, user }) => {
                  if (isAuthenticated && user?.role === 'admin') {
                    return <Redirect to="/admin-dashboard" />;
                  }
                  return <TopThisWeek {...props} />;
                }}
              </AuthConsumer>
            )} />

            <ProtectedRoute path="/user-dashboard" component={UserDashboard} />
            <ProtectedRoute path="/profile" component={UserProfile} />
            <ProtectedRoute path="/admin-dashboard" component={AdminDashboard} adminOnly={true} />

            <Route path="/esewa-success" component={EsewaSuccess} />
            <Route path="/esewa-failure" component={EsewaFailure} />

            <Route component={Default} />
          </Switch>
          <Modal />
          <ChatWidget />
          <PromoPopup />
          <RecommendedProductPopup />
        </React.Fragment>
      </AuthProvider>
    );
  }
}

export default App;
