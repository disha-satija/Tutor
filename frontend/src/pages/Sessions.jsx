import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import { marked } from 'marked';

export default function Sessions({ courseId = 1 }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Reflection & Note state
  const [reflection, setReflection] = useState(null);
  const [studentNote, setStudentNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // New Session Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDate, setNewDate] = useState('2026-08-31');
  const [newDay, setNewDay] = useState('Monday');
  const [newDuration, setNewDuration] = useState(1.0);
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [savingSession, setSavingSession] = useState(false);

  // Edit Session Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDuration, setEditDuration] = useState(1.0);

  // Delete Session Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [courseId]);

  const calculateDayOfWeek = (dateStr) => {
    if (!dateStr) return 'Monday';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dt.getDay()];
      }
    } catch (e) {}
    return 'Monday';
  };

  const handleDateChange = (val) => {
    setNewDate(val);
    setNewDay(calculateDayOfWeek(val));
  };

  const loadSessions = (selectId = null) => {
    setLoading(true);
    return apiFetch(`/sessions?course_id=${courseId}`)
      .then(data => {
        setSessions(data);
        if (data.length > 0) {
          let target = null;
          if (selectId !== null) {
            target = data.find(s => s.id === selectId) || data[0];
          } else if (selectedSession) {
            target = data.find(s => s.id === selectedSession.id) || data[0];
          } else {
            target = data[0];
          }
          selectSessionItem(target);
          return target;
        } else {
          setSelectedSession(null);
          setReflection(null);
          setNotes('');
          return null;
        }
      })
      .catch(err => {
        console.error(err);
        setSelectedSession(null);
        setReflection(null);
        setNotes('');
        return null;
      })
      .finally(() => setLoading(false));
  };

  const selectSessionItem = (sess) => {
    if (!sess) {
      setSelectedSession(null);
      setNotes('');
      setReflection(null);
      setStudentNote('');
      setNoteSaved(false);
      return;
    }
    setSelectedSession(sess);
    setNotes(sess.notes_content || '');
    setReflection(null);
    setStudentNote('');
    setNoteSaved(false);

    apiFetch(`/reflections/session/${sess.id}`)
      .then(refs => {
        if (refs.length > 0) {
          const ref = refs[0];
          setReflection(ref);
          if (ref.log_id) {
            apiFetch(`/logs/${ref.log_id}`)
              .then(logData => {
                if (logData && logData.student_notes && logData.student_notes.length > 0) {
                  setStudentNote(logData.student_notes[0].note_text);
                }
              })
              .catch(() => {});
          }
        }
      }).catch(() => {});
  };

  const handleSaveNewSession = async (andGenerate = false) => {
    if (!newDate.trim()) {
      alert('Please select a valid session date.');
      return;
    }
    if (!newTitle.trim()) {
      alert('Please enter a session title or topic.');
      return;
    }

    setSavingSession(true);
    try {
      const created = await apiFetch('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          course_id: courseId,
          date: newDate.trim(),
          duration_hours: parseFloat(newDuration) || 1.0,
          title: newTitle.trim(),
          notes_content: newNotes.trim()
        })
      });

      setShowAddModal(false);
      setNewTitle('');
      setNewNotes('');

      const target = await loadSessions(created.id);
      const targetId = target ? target.id : created.id;

      if (andGenerate && newNotes.trim()) {
        await triggerGenerateForSession(targetId, newNotes.trim());
      }
    } catch (err) {
      alert(`Error creating session: ${err.message}`);
    } finally {
      setSavingSession(false);
    }
  };

  const triggerGenerateForSession = async (sessId, notesContent) => {
    setGenerating(true);
    setReflection(null);
    try {
      const res = await apiFetch('/reflections/generate', {
        method: 'POST',
        body: JSON.stringify({
          course_id: courseId,
          session_id: sessId,
          notes: notesContent,
          contributor_name: 'Student'
        })
      });
      setReflection(res);
      await loadSessions(sessId);
    } catch (err) {
      alert(`Error generating reflection: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateReflection = async () => {
    if (!selectedSession) return;
    if (!notes.trim()) {
      alert('Please enter lecture notes before generating a reflection.');
      return;
    }
    triggerGenerateForSession(selectedSession.id, notes.trim());
  };

  const handleSaveStudentNote = async () => {
    if (!reflection || !reflection.log_id) {
      alert('No active prompt log ID found for this reflection.');
      return;
    }
    if (!studentNote.trim()) {
      alert('Please enter your note text before saving.');
      return;
    }

    try {
      await apiFetch(`/logs/${reflection.log_id}/note`, {
        method: 'POST',
        body: JSON.stringify({
          note_text: studentNote.trim(),
          contributor_name: 'Student'
        })
      });
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
    } catch (err) {
      alert(`Error saving note: ${err.message}`);
    }
  };

  const openEditModal = () => {
    if (!selectedSession) return;
    setEditTitle(selectedSession.title);
    setEditDate(selectedSession.date);
    setEditDuration(selectedSession.duration_hours);
    setShowEditModal(true);
  };

  const handleUpdateSession = async () => {
    if (!selectedSession) return;
    try {
      await apiFetch(`/sessions/${selectedSession.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          date: editDate,
          title: editTitle,
          duration_hours: parseFloat(editDuration) || 1.0,
          notes_content: notes
        })
      });
      setShowEditModal(false);
      loadSessions(selectedSession.id);
    } catch (err) {
      alert(`Error updating session: ${err.message}`);
    }
  };

  const promptDeleteSession = (sess, e) => {
    if (e) e.stopPropagation();
    setSessionToDelete(sess);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    const deletedId = sessionToDelete.id;
    setDeleting(true);
    try {
      await apiFetch(`/sessions/${deletedId}?course_id=${courseId}`, {
        method: 'DELETE'
      });
      setShowDeleteModal(false);
      setSessionToDelete(null);

      if (selectedSession && selectedSession.id === deletedId) {
        setSelectedSession(null);
        setReflection(null);
        setNotes('');
      }

      await loadSessions(null);
    } catch (err) {
      alert(`Error deleting session: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>📚 Class Reflection Journal (Newest First)</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Track class sessions, enter lecture notes, and synthesize grounded reflections with exactly 1 open question.
          </p>
        </div>
        <button className="btn btn-primary" style={{ padding: '10px 18px' }} onClick={() => setShowAddModal(true)}>
          ➕ Add New Class Session
        </button>
      </div>

      <div className="grid-2col">
        {/* Session Schedule Column (Newest First) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px' }}>Course Sessions ({sessions.length})</h3>
            <button className="btn btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setShowAddModal(true)}>
              + Add
            </button>
          </div>

          {loading ? <p>Loading class schedule...</p> : sessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => selectSessionItem(s)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: selectedSession?.id === s.id ? 'var(--accent)' : 'var(--border)',
                    background: selectedSession?.id === s.id ? 'var(--accent-light)' : 'var(--bg-main)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700' }}>
                    <span style={{ color: 'var(--primary)' }}>Session {s.display_session_number} &bull; {s.date} ({s.day_of_week})</span>
                    <span>{s.duration_hours} hr</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', margin: '4px 0' }}>{s.title}</div>
                  <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className={`badge-status ${s.notes_status}`}>Notes: {s.notes_status}</span>
                      <span className={`badge-status ${s.reflection_status}`}>Reflection: {s.reflection_status}</span>
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#dc2626' }}
                      title="Delete Session"
                      onClick={(e) => promptDeleteSession(s, e)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              No class sessions added yet for this course. Click <strong>"+ Add New Class Session"</strong> above to add the first session.
            </p>
          )}
        </div>

        {/* Notes & Reflection Workspace */}
        <div className="card">
          {selectedSession ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '700' }}>
                    Session {selectedSession.display_session_number} &bull; {selectedSession.date} ({selectedSession.day_of_week}) &bull; {selectedSession.duration_hours} Hours
                  </span>
                  <h3 style={{ fontSize: '17px', marginTop: '2px' }}>{selectedSession.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={openEditModal}>
                    ✍️ Edit
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px', color: '#dc2626' }} onClick={(e) => promptDeleteSession(selectedSession, e)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Enter Notes */}
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: '700' }}>Lecture Notes / Class Discussion</label>
                <textarea
                  rows={8}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter or paste notes from today's class session..."
                />
              </div>

              {/* Generate Reflection Action */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateReflection}
                  disabled={generating}
                  style={{ width: '100%', padding: '12px' }}
                >
                  {generating ? '✨ Synthesizing Reflection...' : '✨ Synthesize Class Reflection'}
                </button>
              </div>

              {/* Reflection Output Container */}
              {reflection && (
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px solid var(--accent-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 12px' }}>
                    <h3 style={{ fontSize: '16px', color: 'var(--primary)' }}>Structured Reflection Output</h3>
                    <span className="badge-status completed">Verified Grounded</span>
                  </div>

                  <div
                    style={{ fontSize: '13.5px', lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: marked.parse(reflection.structured_reflection) }}
                  />

                  {/* Student-Added Note Overlay Box */}
                  <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderLeft: '4px solid var(--warning)', borderRadius: '8px', padding: '16px', marginTop: '20px' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#b45309', margin: '4px 0 6px' }}>
                      ✍️ Student-Added Note (Saved to Shared Audit Trail)
                    </div>
                    <textarea
                      rows={3}
                      value={studentNote}
                      onChange={e => setStudentNote(e.target.value)}
                      placeholder="Add your reflective comment, professor's emphasis, or missing nuance..."
                    />
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button className="btn btn-success" style={{ fontSize: '12px' }} onClick={handleSaveStudentNote}>
                        Save Student Note
                      </button>
                      {noteSaved && <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>✓ Saved to Prompt Log</span>}
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
              Select a session date from the schedule on the left or click <strong>"+ Add New Class Session"</strong> to create a session.
            </p>
          )}
        </div>
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
              <button className="btn btn-primary" style={{ background: '#dc2626' }} onClick={handleConfirmDeleteSession} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Session Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '550px', margin: 0, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800' }}>➕ Add New Class Session</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>&times;</button>
            </div>

            <div className="form-group">
              <label>Session Date</label>
              <input
                type="date"
                value={newDate}
                onChange={e => handleDateChange(e.target.value)}
              />
              <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '700', marginTop: '4px' }}>
                Calculated Day: {newDay}
              </div>
            </div>

            <div className="form-group">
              <label>Session Duration</label>
              <select value={newDuration} onChange={e => setNewDuration(parseFloat(e.target.value))}>
                <option value={1.0}>1 Hour</option>
                <option value={2.0}>2 Hours</option>
                <option value={1.5}>1.5 Hours</option>
                <option value={3.0}>3 Hours</option>
              </select>
            </div>

            <div className="form-group">
              <label>Session Title / Topic</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Topic / Case Discussion"
              />
            </div>

            <div className="form-group">
              <label>Lecture Notes / Discussion (Optional)</label>
              <textarea
                rows={5}
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Paste class notes here if available..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleSaveNewSession(false)} disabled={savingSession}>
                Save Session
              </button>
              {newNotes.trim() && (
                <button className="btn btn-success" onClick={() => handleSaveNewSession(true)} disabled={savingSession}>
                  Save & Generate Reflection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', margin: 0, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800' }}>✍️ Edit Session Details</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowEditModal(false)}>&times;</button>
            </div>

            <div className="form-group">
              <label>Session Title / Topic</label>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Duration</label>
              <select value={editDuration} onChange={e => setEditDuration(parseFloat(e.target.value))}>
                <option value={1.0}>1 Hour</option>
                <option value={2.0}>2 Hours</option>
                <option value={1.5}>1.5 Hours</option>
                <option value={3.0}>3 Hours</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateSession}>Update Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
