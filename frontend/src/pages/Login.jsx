import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [activeTab, setActiveTab] = useState('customer');
    const [email, setEmail] = useState('customer@example.com');
    const [password, setPassword] = useState('customer123');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'admin') {
            setEmail('admin@example.com');
            setPassword('admin123');
        } else {
            setEmail('customer@example.com');
            setPassword('customer123');
        }
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            const user = JSON.parse(localStorage.getItem('user'));
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="card">
                <h2 style={{textAlign: 'center', marginBottom: '1.5rem'}}>Welcome Back</h2>
                
                {/* Role Switcher Tabs */}
                <div style={{
                    display: 'flex', 
                    borderRadius: '10px', 
                    background: 'rgba(0,0,0,0.2)', 
                    padding: '4px',
                    marginBottom: '2rem',
                    border: '1px solid var(--border-color)'
                }}>
                    <button 
                        type="button" 
                        onClick={() => handleTabChange('customer')}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: 'none',
                            borderRadius: '8px',
                            background: activeTab === 'customer' ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'transparent',
                            color: activeTab === 'customer' ? 'white' : 'var(--text-muted)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Customer Login
                    </button>
                    <button 
                        type="button" 
                        onClick={() => handleTabChange('admin')}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: 'none',
                            borderRadius: '8px',
                            background: activeTab === 'admin' ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'transparent',
                            color: activeTab === 'admin' ? 'white' : 'var(--text-muted)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Admin Login
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            className="form-control" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn" style={{width: '100%', marginTop: '1rem'}}>
                        Login as {activeTab === 'admin' ? 'Admin' : 'Customer'}
                    </button>
                </form>
                
                <p style={{marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)'}}>
                    Don't have an account? <Link to="/register" style={{color: 'var(--primary-color)', fontWeight: '500'}}>Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
