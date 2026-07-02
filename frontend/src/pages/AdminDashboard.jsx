import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
    const { logout, user } = useContext(AuthContext);
    const [reservations, setReservations] = useState([]);
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        fetchReservations();
    }, [filterDate]);

    const fetchReservations = async () => {
        try {
            const url = filterDate ? `/reservations?date=${filterDate}` : '/reservations';
            const res = await api.get(url);
            setReservations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancel = async (id) => {
        if (window.confirm('Are you sure you want to cancel this reservation?')) {
            try {
                await api.delete(`/reservations/${id}`);
                fetchReservations();
            } catch (err) {
                alert('Failed to cancel reservation');
            }
        }
    };

    return (
        <div>
            <div className="header-action">
                <h2>Admin Dashboard</h2>
                <div>
                    <span style={{marginRight: '1rem'}}>Welcome, {user?.name} (Admin)</span>
                    <button className="btn btn-danger" onClick={logout}>Logout</button>
                </div>
            </div>

            <div className="card" style={{marginBottom: '2rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h3>All Reservations</h3>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <label>Filter by Date:</label>
                        <input type="date" className="form-control" style={{width: 'auto'}} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                        {filterDate && <button className="btn" onClick={() => setFilterDate('')}>Clear</button>}
                    </div>
                </div>
                
                <div className="table-container" style={{marginTop: '1.5rem'}}>
                    <table>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Table</th>
                                <th>Guests</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{color: 'var(--text-muted)', textAlign: 'center'}}>No reservations found.</td>
                                </tr>
                            ) : (
                                reservations.map(res => (
                                    <tr key={res._id}>
                                        <td>
                                            <div style={{fontWeight: '500', color: 'var(--text-main)'}}>{res.user?.name}</div>
                                            <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{res.user?.email}</div>
                                        </td>
                                        <td>{res.date}</td>
                                        <td>
                                            <span className="status-pill success">{res.timeSlot}</span>
                                        </td>
                                        <td>Table {res.table?.tableNumber} <br/><span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Cap: {res.table?.capacity}</span></td>
                                        <td>{res.guests}</td>
                                        <td>
                                            <button className="btn btn-danger" style={{padding: '0.5rem 1rem'}} onClick={() => handleCancel(res._id)}>Cancel</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
