import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

export default function InstructorOverview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/instructor/overview')
      .then(data => setOverview(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card"><p>Loading instructor overview...</p></div>;
  if (error) return <div className="card" style={{ color: 'red' }}>⚠️ Access Error: {error}</div>;

  const { stats, group_members, session_schedule_status } = overview;

  return (
    <div>
      <div className="card" style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🎓</span>
          <div>
            <h2 style={{ fontSize: '18px', color: '#92400e' }}>Course Instructor Audit & Overview Portal</h2>
            <p style={{ fontSize: '13px', color: '#b45309' }}>
              Shared evaluation space monitoring student prompts, AI tutor outputs, student-added notes, and reflection progress.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid-3col">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)' }}>{stats.completion_percentage}%</div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Semester Reflection Completion</div>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>{stats.completed_reflections} of {stats.total_sessions} Class Sessions Completed</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)' }}>{stats.total_prompt_logs}</div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Audit Log Interactions</div>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>Full Student Prompt $\rightarrow$ AI $\rightarrow$ Note Trail</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--warning)' }}>{stats.total_news_items}</div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Fortnightly News Items</div>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>Corporate-Startup Collaboration Updates</p>
        </div>
      </div>

      {/* Session Progress Matrix */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>📊 8-Session Reflection Matrix (Aug 3 – Aug 26, 2026)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Date</th>
              <th style={{ padding: '10px' }}>Day & Duration</th>
              <th style={{ padding: '10px' }}>Session Topic</th>
              <th style={{ padding: '10px' }}>Notes Status</th>
              <th style={{ padding: '10px' }}>Reflection Status</th>
            </tr>
          </thead>
          <tbody>
            {session_schedule_status.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px', fontWeight: '700' }}>{s.date}</td>
                <td style={{ padding: '10px' }}>{s.day} ({s.duration}h)</td>
                <td style={{ padding: '10px', fontWeight: '600' }}>{s.title}</td>
                <td style={{ padding: '10px' }}>
                  <span className={`badge-status ${s.notes_status}`}>{s.notes_status}</span>
                </td>
                <td style={{ padding: '10px' }}>
                  <span className={`badge-status ${s.reflection_status}`}>{s.reflection_status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Group Members List */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>👥 Syndicate Group Members</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {group_members.map(m => (
            <div key={m.id} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '8px', fontSize: '13px' }}>
              <div style={{ fontWeight: '700' }}>{m.full_name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.email}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
