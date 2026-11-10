import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import { marked } from 'marked';

export default function PromptLog({ courseId = 1 }) {
  const contributorName = 'Student';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState('all');
  const [editingNoteLogId, setEditingNoteLogId] = useState(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadLogs();
  }, [courseId, modeFilter]);

  const loadLogs = () => {
    setLoading(true);
    const modeParam = modeFilter !== 'all' ? `&mode=${modeFilter}` : '';
    apiFetch(`/logs?course_id=${courseId}${modeParam}`)
      .then(data => setLogs(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleStartEditNote = (log) => {
    setEditingNoteLogId(log.id);
    const existing = log.student_notes && log.student_notes.length > 0 ? log.student_notes[0].note_text : '';
    setNoteText(existing);
  };

  const handleSaveNote = async (logId) => {
    if (!noteText.trim()) return;
    try {
      await apiFetch(`/logs/${logId}/note`, {
        method: 'POST',
        body: JSON.stringify({
          note_text: noteText.trim(),
          contributor_name: contributorName
        })
      });
      setEditingNoteLogId(null);
      loadLogs();
    } catch (err) {
      alert(`Error saving note: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>📋 Shared Visible Prompt & Reflection Log</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Official assignment evidence trail visible to group members and course instructor.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
            <option value="all">Filter: All Task Modes</option>
            <option value="reflection">Class Reflection Logs</option>
            <option value="news">Fortnightly News Logs</option>
          </select>
          <button className="btn btn-secondary" onClick={loadLogs}>🔄 Refresh Log</button>
        </div>
      </div>

      {/* Audit Visual Flow Legend */}
      <div className="card" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '13px', fontWeight: '600' }}>
        <span style={{ color: 'var(--accent)' }}>🔵 Student Prompt</span>
        <span>↓</span>
        <span style={{ color: 'var(--success)' }}>🟢 AI Tutor Response</span>
        <span>↓</span>
        <span style={{ color: 'var(--warning)' }}>🟠 Student-Added Note</span>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="card"><p>Loading prompt logs...</p></div>
      ) : logs.length > 0 ? (
        <div className="flow-container">
          {logs.map(log => (
            <div key={log.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', fontSize: '12px' }}>
                <div>
                  <span style={{ fontWeight: '700', color: 'var(--primary)' }}>#LOG-{log.id}</span> &bull;{' '}
                  <span style={{ fontWeight: '600' }}>Contributor: {log.contributor_name || 'Student'}</span> &bull;{' '}
                  <span style={{ textTransform: 'capitalize' }}>Task: {log.mode}</span>
                  {log.session_title && <span style={{ marginLeft: '6px', opacity: 0.8 }}>({log.session_title})</span>}
                </div>
                <span style={{ color: 'var(--text-muted)' }}>🕒 {new Date(log.timestamp).toLocaleString()}</span>
              </div>

              {/* Step 1: Student Prompt */}
              <div className="flow-card prompt">
                <div className="flow-label">1. Student Prompt / Raw Notes</div>
                <div style={{ fontSize: '13.5px', whiteSpace: 'pre-wrap' }}>{log.prompt_text}</div>
              </div>

              <div className="flow-arrow">↓</div>

              {/* Step 2: AI Response */}
              <div className="flow-card ai">
                <div className="flow-label">2. AI Tutor Response</div>
                <div
                  style={{ fontSize: '13.5px' }}
                  dangerouslySetInnerHTML={{ __html: marked.parse(log.ai_response) }}
                />
              </div>

              <div className="flow-arrow">↓</div>

              {/* Step 3: Student Note */}
              <div className="flow-card note">
                <div className="flow-label">3. Student-Added Note</div>
                {editingNoteLogId === log.id ? (
                  <div>
                    <textarea
                      rows={3}
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Add or update student note for this interaction..."
                    />
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <button className="btn btn-success" style={{ fontSize: '11px' }} onClick={() => handleSaveNote(log.id)}>Save Note</button>
                      <button className="btn btn-secondary" style={{ fontSize: '11px' }} onClick={() => setEditingNoteLogId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {log.student_notes && log.student_notes.length > 0 ? (
                      <div>
                        {log.student_notes.map(n => (
                          <div key={n.id} style={{ fontSize: '13px', fontWeight: '500', color: '#92400e' }}>
                            "{n.note_text}" <span style={{ fontSize: '11px', opacity: 0.7 }}>— Added by {n.contributor_name || 'Student'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <em style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>No student note attached yet.</em>
                    )}
                    <div style={{ marginTop: '6px' }}>
                      <button className="btn-secondary" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }} onClick={() => handleStartEditNote(log)}>
                        ✍️ {log.student_notes && log.student_notes.length > 0 ? 'Edit Note' : 'Add Note'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            No prompt log entries found for this course. Synthesize a class reflection to generate visible prompt log records.
          </p>
        </div>
      )}
    </div>
  );
}
