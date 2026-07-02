import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
    const { logout, user } = useContext(AuthContext);
    const [tables, setTables] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [formData, setFormData] = useState({ tableId: '', date: '', timeSlot: '', guests: 1 });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchTables();
        fetchReservations();
    }, []);

    const fetchTables = async () => {
        try {
            const res = await api.get('/tables');
            setTables(res.data);
            if (res.data.length > 0) {
                setFormData(prev => ({ ...prev, tableId: res.data[0]._id }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReservations = async () => {
        try {
            const res = await api.get('/reservations');
            setReservations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleReserve = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.post('/reservations', formData);
            setSuccess('Reservation created successfully!');
            fetchReservations();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create reservation');
        }
    };

    const handleCancel = async (id) => {
        try {
            await api.delete(`/reservations/${id}`);
            fetchReservations();
        } catch (err) {
            alert('Failed to cancel reservation');
        }
    };

    return (
        <div>
            <div className="header-action">
                <h2>Customer Dashboard</h2>
                <div>
                    <span style={{marginRight: '1rem'}}>Welcome, {user?.name}</span>
                    <button className="btn btn-danger" onClick={logout}>Logout</button>
                </div>
            </div>

            <div className="grid">
                <div className="card">
                    <h3>Make a Reservation</h3>
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}
                    
                    <form onSubmit={handleReserve}>
                        <div className="form-group">
                            <label>Table</label>
                            <select className="form-control" value={formData.tableId} onChange={e => setFormData({...formData, tableId: e.target.value})} required>
                                {tables.map(table => (
                                    <option key={table._id} value={table._id}>
                                        Table {table.tableNumber} (Capacity: {table.capacity})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input type="date" className="form-control" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <label>Time Slot</label>
                            <select className="form-control" value={formData.timeSlot} onChange={e => setFormData({...formData, timeSlot: e.target.value})} required>
                                <option value="">Select a time</option>
                                <option value="17:00-18:00">17:00 - 18:00</option>
                                <option value="18:00-19:00">18:00 - 19:00</option>
                                <option value="19:00-20:00">19:00 - 20:00</option>
                                <option value="20:00-21:00">20:00 - 21:00</option>
                                <option value="21:00-22:00">21:00 - 22:00</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Number of Guests</label>
                            <input type="number" min="1" className="form-control" value={formData.guests} onChange={e => setFormData({...formData, guests: parseInt(e.target.value)})} required />
                        </div>
                        <button type="submit" className="btn" style={{width: '100%'}}>Book Table</button>
                    </form>
                </div>

                <div className="card">
                    <h3>My Reservations</h3>
                    {reservations.length === 0 ? (
                        <p style={{color: 'var(--text-muted)'}}>You have no upcoming reservations.</p>
                    ) : (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                            {reservations.map(res => (
                                <div key={res._id} style={{
                                    padding: '1.25rem', 
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--border-color)', 
                                    borderRadius: '12px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                    <div>
                                        <div style={{fontWeight: '600', marginBottom: '0.5rem', color: 'var(--primary-color)'}}>
                                            Table {res.table?.tableNumber}
                                        </div>
                                        <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem'}}>
                                            <span style={{marginRight: '1rem'}}>📅 {res.date}</span>
                                            <span>👥 {res.guests} Guests</span>
                                        </div>
                                        <div>
                                            <span className="status-pill success">{res.timeSlot}</span>
                                        </div>
                                    </div>
                                    <button className="btn btn-danger" onClick={() => handleCancel(res._id)}>Cancel</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
