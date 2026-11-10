import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useContext(AuthContext);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(email, fullName, password, role);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    login(demoEmail, demoPassword).catch(err => setError(err.message));
  };

  return (
    <div style={{ maxWidth: '420px', margin: '60px auto' }} className="card">
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ marginTop: '10px' }}>Corporate Startup Tutor</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {isRegister ? 'Create Account' : 'Sign In to Shared Tutor'}
        </p>
      </div>

      {error && <div style={{ color: 'red', fontSize: '13px', marginBottom: '12px' }}>⚠️ {error}</div>}

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="e.g. Alex Rivers" />
            </div>
            <div className="form-group">
              <label>Account Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="student">Student (Group Member)</option>
                <option value="instructor">Course Instructor</option>
              </select>
            </div>
          </>
        )}

        <div className="form-group">
          <label>Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@course.edu" />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
          {isRegister ? 'Register Account' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button className="btn-secondary" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--accent)' }} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register here'}
        </button>
      </div>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '12px' }}>
        <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>⚡ Quick Demo Accounts:</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ fontSize: '12px', flex: 1 }} onClick={() => handleQuickLogin('student@course.edu', 'student123')}>
            👤 Student Login
          </button>
          <button className="btn btn-secondary" style={{ fontSize: '12px', flex: 1 }} onClick={() => handleQuickLogin('instructor@course.edu', 'instructor123')}>
            🎓 Instructor Login
          </button>
        </div>
      </div>
    </div>
  );
}
