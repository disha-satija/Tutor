import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

export default function SessionsOverview({ courseId = 1, onNavigate }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [courseId]);

  const loadSessions = () => {
    setLoading(true);
    apiFetch(`/sessions?course_id=${courseId}`)
      .then(data => setSessions(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const promptDeleteSession = (s) => {
    setSessionToDelete(s);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/sessions/${sessionToDelete.id}`, { method: 'DELETE' });
      setShowDeleteModal(false);
      setSessionToDelete(null);
      loadSessions();
    } catch (err) {
      alert(`Error deleting session: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>📅 Semester Class Sessions Schedule (Newest First)</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Chronological overview of all course sessions. Add new sessions continuously throughout the semester.
          </p>
        </div>
        <button className="btn btn-primary" style={{ padding: '10px 18px' }} onClick={() => onNavigate('reflections')}>
          ➕ Add / Synthesize Reflection
        </button>
      </div>

      <div className="card">
        {loading ? <p>Loading schedule...</p> : sessions.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Session #</th>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Day & Duration</th>
                <th style={{ padding: '12px' }}>Session Topic / Title</th>
                <th style={{ padding: '12px' }}>Notes Status</th>
                <th style={{ padding: '12px' }}>Reflection Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: '800', color: 'var(--primary)' }}>Session {s.display_session_number}</td>
                  <td style={{ padding: '12px', fontWeight: '700' }}>{s.date}</td>
                  <td style={{ padding: '12px' }}>{s.day_of_week} ({s.duration_hours}h)</td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{s.title}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge-status ${s.notes_status}`}>{s.notes_status}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge-status ${s.reflection_status}`}>{s.reflection_status}</span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => onNavigate('reflections')}>
                        Synthesize Reflection
                      </button>
                      <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 10px', color: '#dc2626' }} onClick={() => promptDeleteSession(s)} title="Delete Session">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            No class sessions added yet for this course. Click <strong>"Add / Synthesize Reflection"</strong> above to add the first session.
          </p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="card" style={{ width: '90%', maxWidth: '480px', margin: 0, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', borderLeft: '5px solid #dc2626' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#dc2626' }}>🗑️ Delete this class session?</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowDeleteModal(false)}>&times;</button>
            </div>

            <p style={{ fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>
              Session #{sessionToDelete.display_session_number}: {sessionToDelete.title} ({sessionToDelete.date})
            </p>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              This will permanently remove the session and its associated reflection, student notes, and prompt-log records.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#dc2626' }} onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
