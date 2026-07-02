import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

const PrivateRoute = ({ children, roles }) => {
    const { user, loading } = React.useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    if (!user) return <Navigate to="/login" />;
    
    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" />; // Or forbidden page
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app-container">
                    <nav className="navbar">
                        <h2>Restaurant Reservations</h2>
                    </nav>
                    <div className="main-content">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            
                            <Route path="/" element={
                                <PrivateRoute roles={['customer']}>
                                    <Dashboard />
                                </PrivateRoute>
                            } />
                            
                            <Route path="/admin" element={
                                <PrivateRoute roles={['admin']}>
                                    <AdminDashboard />
                                </PrivateRoute>
                            } />
                        </Routes>
                    </div>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
