import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

export default function Dashboard({ courseId = 1, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch(`/dashboard?course_id=${courseId}`),
      apiFetch(`/dashboard/overview?course_id=${courseId}`)
    ]).then(([dashStats, overData]) => {
      setStats(dashStats);
      setOverview(overData);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [courseId]);

  return (
    <div>
      {/* Welcome Hero Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: '#ffffff', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.5px' }}>
              {stats?.course_name || 'Designing Corporate Startup Synergies'}
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: '800', marginTop: '10px' }}>
              {stats?.course_name || 'AI Course Tutor Workspace'}
            </h1>
            <p style={{ opacity: 0.85, fontSize: '14px', marginTop: '4px', maxWidth: '600px' }}>
              Your shared AI workspace for class reflections and continuous assessment insights.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" style={{ background: '#2563eb', padding: '12px 22px', fontSize: '15px' }} onClick={() => onNavigate('reflections')}>
              📚 Start Class Reflection
            </button>
            {courseId === 1 && (
              <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 22px', fontSize: '15px' }} onClick={() => onNavigate('news')}>
                📰 Explore Fortnightly News
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Database Stats Counters */}
      <div className="grid-4col">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)' }}>
            {stats ? `${stats.completed_reflections} / ${stats.total_sessions}` : '0 / 0'}
          </div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Class Reflections</div>
          <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>Continuous Assessment</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)' }}>
            {stats ? stats.total_sessions : 0}
          </div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Class Sessions</div>
          <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>Course Schedule</p>
        </div>

        {courseId === 1 ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--warning)' }}>
              {stats ? stats.total_news_items : 0}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Collaboration News Items</div>
            <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>CVC Deals & Alliances</p>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--warning)' }}>
              {stats ? stats.completed_reflections : 0}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Completed Reflections</div>
            <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>Philosophy Portfolio</p>
          </div>
        )}

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent)' }}>
            {stats ? stats.total_logs : 0}
          </div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>Prompt Log Entries</div>
          <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>Shared Audit Trail</p>
        </div>
      </div>

      {/* Quick Action Shortcuts Grid */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>⚡ Quick Shortcuts</h3>
        <div className="grid-3col">
          <div
            onClick={() => onNavigate('reflections')}
            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', cursor: 'pointer', transition: 'transform 0.2s' }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>📚</div>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>Class Reflections</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Create a structured reflection from raw lecture notes.</p>
          </div>

          <div
            onClick={() => onNavigate('logs')}
            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', cursor: 'pointer', transition: 'transform 0.2s' }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>📋</div>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>Prompt Log</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Review shared Student Prompt $\rightarrow$ AI $\rightarrow$ Note audit sequence.</p>
          </div>

          <div
            onClick={() => onNavigate('sessions')}
            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', cursor: 'pointer', transition: 'transform 0.2s' }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>📅</div>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>Course Sessions</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>View class session schedule and completion status.</p>
          </div>
        </div>
      </div>

      {/* Session Schedule Matrix */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px' }}>📅 Course Class Sessions Matrix ({stats?.total_sessions || 0} Sessions)</h3>
          <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={() => onNavigate('sessions')}>Open Schedule</button>
        </div>

        {loading ? <p>Loading course schedule...</p> : overview && overview.session_schedule_status && overview.session_schedule_status.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {overview.session_schedule_status.map(s => (
              <div key={s.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', background: 'var(--bg-main)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--primary)' }}>Session {s.display_session_number} &bull; {s.date} ({s.day})</span>
                  <span>{s.duration} hr</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', margin: '4px 0' }}>{s.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span className={`badge-status ${s.reflection_status}`}>
                    {s.reflection_status === 'completed' ? '✓ Reflection Saved' : 'Pending Notes'}
                  </span>
                  <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => onNavigate('reflections')}>
                    Synthesize
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            No class sessions added yet for this course. Click <strong>"Start Class Reflection"</strong> above or go to <strong>Course Sessions</strong> to add the first session.
          </p>
        )}
      </div>
    </div>
  );
}
