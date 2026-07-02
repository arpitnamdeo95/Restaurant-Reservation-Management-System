import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
    const { logout, user } = useContext(AuthContext);
    const [reservations, setReservations] = useState([]);
    const [tables, setTables] = useState([]);
    const [filterDate, setFilterDate] = useState('');
    
    // Editing state
    const [editingReservation, setEditingReservation] = useState(null);
    const [editFormData, setEditFormData] = useState({ tableId: '', date: '', timeSlot: '', guests: 1 });
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    useEffect(() => {
        fetchReservations();
        fetchTables();
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

    const fetchTables = async () => {
        try {
            const res = await api.get('/tables');
            setTables(res.data);
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

    const handleStartEdit = (res) => {
        setEditingReservation(res);
        setEditFormData({
            tableId: res.table?._id || '',
            date: res.date || '',
            timeSlot: res.timeSlot || '',
            guests: res.guests || 1
        });
        setEditError('');
        setEditSuccess('');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setEditError('');
        setEditSuccess('');
        try {
            await api.put(`/reservations/${editingReservation._id}`, editFormData);
            setEditSuccess('Reservation updated successfully!');
            fetchReservations();
            setTimeout(() => setEditingReservation(null), 1000);
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to update reservation');
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
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
                    <h3>All Reservations</h3>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
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
                                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                                <button className="btn" style={{padding: '0.5rem 1rem'}} onClick={() => handleStartEdit(res)}>Edit</button>
                                                <button className="btn btn-danger" style={{padding: '0.5rem 1rem'}} onClick={() => handleCancel(res._id)}>Cancel</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Glassmorphic Edit Modal Overlay */}
            {editingReservation && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(8px)',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div className="card" style={{width: '90%', maxWidth: '500px', position: 'relative', border: '1px solid var(--border-hover)'}}>
                        <button 
                            onClick={() => setEditingReservation(null)}
                            style={{
                                position: 'absolute',
                                top: '1.25rem',
                                right: '1.25rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '1.75rem',
                                cursor: 'pointer'
                            }}
                        >
                            &times;
                        </button>
                        <h3 style={{marginBottom: '1.5rem'}}>Edit Reservation</h3>
                        {editError && <div className="error-message">{editError}</div>}
                        {editSuccess && <div className="success-message">{editSuccess}</div>}
                        
                        <form onSubmit={handleUpdate}>
                            <div className="form-group">
                                <label>Table Assignment</label>
                                <select 
                                    className="form-control" 
                                    value={editFormData.tableId} 
                                    onChange={e => setEditFormData({...editFormData, tableId: e.target.value})} 
                                    required
                                >
                                    {tables.map(table => (
                                        <option key={table._id} value={table._id}>
                                            Table {table.tableNumber} (Capacity: {table.capacity})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    value={editFormData.date} 
                                    onChange={e => setEditFormData({...editFormData, date: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Time Slot</label>
                                <select 
                                    className="form-control" 
                                    value={editFormData.timeSlot} 
                                    onChange={e => setEditFormData({...editFormData, timeSlot: e.target.value})} 
                                    required
                                >
                                    <option value="17:00-18:00">17:00 - 18:00</option>
                                    <option value="18:00-19:00">18:00 - 19:00</option>
                                    <option value="19:00-20:00">19:00 - 20:00</option>
                                    <option value="20:00-21:00">20:00 - 21:00</option>
                                    <option value="21:00-22:00">21:00 - 22:00</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Number of Guests</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    className="form-control" 
                                    value={editFormData.guests} 
                                    onChange={e => setEditFormData({...editFormData, guests: parseInt(e.target.value)})} 
                                    required 
                                />
                            </div>
                            <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
                                <button type="submit" className="btn" style={{flex: 1}}>Save Changes</button>
                                <button type="button" className="btn btn-danger" style={{flex: 1}} onClick={() => setEditingReservation(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
