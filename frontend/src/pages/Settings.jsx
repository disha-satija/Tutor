import React, { useState, useEffect, useContext } from 'react';
import { apiFetch } from '../api/client';
import { ContributorContext } from '../context/ContributorContext';

export default function Settings() {
  const { contributorName, setContributorName } = useContext(ContributorContext);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/health')
      .then(data => setHealth(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="card">
        <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>⚙️ Shared Workspace Settings & Status</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          System information and contributor preferences for Corporate Startup Tutor.
        </p>
      </div>

      <div className="grid-2col">
        {/* Contributor Preferences */}
        <div className="card">
          <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>👤 Contributor Identity</h3>
          <div className="form-group">
            <label>Default Contributor Name</label>
            <input
              type="text"
              value={contributorName}
              onChange={e => setContributorName(e.target.value)}
              placeholder="e.g. Sakshi / Alex"
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              This name is attached to your created reflections, student notes, and news searches. No password or login required.
            </p>
          </div>
        </div>

        {/* Backend & Environment Health */}
        <div className="card">
          <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>🖥️ Backend & Security Status</h3>
          {loading ? <p>Checking backend connection...</p> : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                <span style={{ fontWeight: '600' }}>Course:</span>
                <span>{health?.course}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                <span style={{ fontWeight: '600' }}>System Status:</span>
                <span style={{ color: 'var(--success)', fontWeight: '700' }}>● {health?.status.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                <span style={{ fontWeight: '600' }}>API Key Security:</span>
                <span style={{ color: 'var(--success)', fontWeight: '700' }}>✓ Stored Strictly Server-Side (.env)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
