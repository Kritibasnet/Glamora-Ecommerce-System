import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { AuthConsumer } from '../context/AuthContext';

const ProtectedRoute = ({ component: Component, adminOnly, ...rest }) => (
    <AuthConsumer>
        {value => (
            <Route
                {...rest}
                render={props => {
                    if (value.loading) return <div>Loading...</div>;

                    if (!value.isAuthenticated) {
                        return <Redirect to="/login" />;
                    }

                    if (adminOnly && (!value.user || value.user.role !== 'admin')) {
                        return <Redirect to="/" />;
                    }

                    return <Component {...props} />;
                }}
            />
        )}
    </AuthConsumer>
);

export default ProtectedRoute;
