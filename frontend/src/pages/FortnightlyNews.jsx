import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

export default function FortnightlyNews({ courseId = 1 }) {
  const contributorName = 'Student';

  // Data states
  const [fortnights, setFortnights] = useState([]);
  const [selectedFortnightId, setSelectedFortnightId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student notes state map: { [log_id]: noteText }
  const [studentNotes, setStudentNotes] = useState({});
  const [savedNoteStatus, setSavedNoteStatus] = useState({});

  // Modals state
  const [showAddFortnightModal, setShowAddFortnightModal] = useState(false);
  const [newFortnightTitle, setNewFortnightTitle] = useState('');
  const [newFortnightStart, setNewFortnightStart] = useState('2026-08-31');
  const [newFortnightEnd, setNewFortnightEnd] = useState('2026-09-13');
  const [newFortnightSummary, setNewFortnightSummary] = useState('');
  const [savingFortnight, setSavingFortnight] = useState(false);

  const [showAddNewsModal, setShowAddNewsModal] = useState(false);
  const [headline, setHeadline] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [pubDate, setPubDate] = useState('2026-09-01');
  const [corporateName, setCorporateName] = useState('');
  const [startupName, setStartupName] = useState('');
  const [articleText, setArticleText] = useState('');
  const [analyzingNews, setAnalyzingNews] = useState(false);

  // Edit News Modal
  const [showEditNewsModal, setShowEditNewsModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCorporate, setEditCorporate] = useState('');
  const [editStartup, setEditStartup] = useState('');
  const [editCollabType, setEditCollabType] = useState('');
  const [editWhatHappened, setEditWhatHappened] = useState('');
  const [editCorporateGains, setEditCorporateGains] = useState('');
  const [editStartupGains, setEditStartupGains] = useState('');
  const [editOverallMatters, setEditOverallMatters] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Modals
  const [showDeleteNewsModal, setShowDeleteNewsModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletingNews, setDeletingNews] = useState(false);

  const [showDeleteFortnightModal, setShowDeleteFortnightModal] = useState(false);
  const [deletingFortnight, setDeletingFortnight] = useState(false);

  useEffect(() => {
    loadFortnights();
  }, [courseId]);

  const loadFortnights = (targetFortnightId = null) => {
    setLoading(true);
    return apiFetch(`/news/fortnights?course_id=${courseId}`)
      .then(data => {
        setFortnights(data);
        if (data.length > 0) {
          let selId = targetFortnightId;
          if (!selId) {
            selId = selectedFortnightId && data.some(f => f.id === selectedFortnightId)
              ? selectedFortnightId
              : data[0].id;
          }
          setSelectedFortnightId(selId);

          // Populate student notes state map
          const notesMap = {};
          data.forEach(f => {
            if (f.news_items) {
              f.news_items.forEach(item => {
                if (item.log_id && item.student_note) {
                  notesMap[item.log_id] = item.student_note;
                }
              });
            }
          });
          setStudentNotes(prev => ({ ...notesMap, ...prev }));
        } else {
          setSelectedFortnightId(null);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const activeFortnight = fortnights.find(f => f.id === selectedFortnightId) || fortnights[0];

  // 1. Add Fortnight
  const handleCreateFortnight = async () => {
    if (!newFortnightTitle.trim()) {
      alert('Please enter a title for the fortnight period.');
      return;
    }
    setSavingFortnight(true);
    try {
      const created = await apiFetch('/news/fortnights', {
        method: 'POST',
        body: JSON.stringify({
          course_id: courseId,
          title: newFortnightTitle.trim(),
          start_date: newFortnightStart.trim(),
          end_date: newFortnightEnd.trim(),
          summary: newFortnightSummary.trim()
        })
      });
      setShowAddFortnightModal(false);
      setNewFortnightTitle('');
      setNewFortnightSummary('');
      await loadFortnights(created.id);
    } catch (err) {
      alert(`Error creating fortnight: ${err.message}`);
    } finally {
      setSavingFortnight(false);
    }
  };

  // 2. Add News Update (AI Analyze)
  const handleAnalyzeNews = async () => {
    if (!selectedFortnightId) {
      alert('Please select or create a fortnight period first.');
      return;
    }
    if (!sourceUrl.trim()) {
      alert('Please provide a source URL for the news update.');
      return;
    }
    if (!headline.trim() && !articleText.trim()) {
      alert('Please enter an article headline or paste the article content.');
      return;
    }

    setAnalyzingNews(true);
    try {
      await apiFetch('/news/analyze', {
        method: 'POST',
        body: JSON.stringify({
          course_id: courseId,
          fortnight_id: selectedFortnightId,
          title: headline.trim(),
          source: sourceName.trim(),
          source_url: sourceUrl.trim(),
          date: pubDate.trim(),
          corporate: corporateName.trim(),
          startup: startupName.trim(),
          article_text: articleText.trim(),
          contributor_name: contributorName
        })
      });

      setShowAddNewsModal(false);
      setHeadline('');
      setSourceName('');
      setSourceUrl('');
      setCorporateName('');
      setStartupName('');
      setArticleText('');

      await loadFortnights(selectedFortnightId);
    } catch (err) {
      alert(`Error analyzing news item: ${err.message}`);
    } finally {
      setAnalyzingNews(false);
    }
  };

  // 3. Save Student Note
  const handleSaveNote = async (logId) => {
    if (!logId) {
      alert('No active prompt log ID found for this news update.');
      return;
    }
    const noteVal = studentNotes[logId] || '';
    if (!noteVal.trim()) {
      alert('Please enter your note text before saving.');
      return;
    }

    try {
      await apiFetch(`/logs/${logId}/note`, {
        method: 'POST',
        body: JSON.stringify({
          note_text: noteVal.trim(),
          contributor_name: contributorName
        })
      });
      setSavedNoteStatus(prev => ({ ...prev, [logId]: true }));
      setTimeout(() => {
        setSavedNoteStatus(prev => ({ ...prev, [logId]: false }));
      }, 3000);
    } catch (err) {
      alert(`Error saving note: ${err.message}`);
    }
  };

  // 4. Edit News Modal Trigger & Action
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditSource(item.source);
    setEditSourceUrl(item.source_url);
    setEditDate(item.date);
    setEditCorporate(item.corporate);
    setEditStartup(item.startup);
    setEditCollabType(item.collaboration_type);
    setEditWhatHappened(item.what_happened);
    setEditCorporateGains(item.why_it_matters_corporate);
    setEditStartupGains(item.why_it_matters_startup);
    setEditOverallMatters(item.why_it_matters_overall);
    setShowEditNewsModal(true);
  };

  const handleUpdateNewsItem = async () => {
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      await apiFetch(`/news/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          source: editSource.trim(),
          source_url: editSourceUrl.trim(),
          date: editDate.trim(),
          corporate: editCorporate.trim(),
          startup: editStartup.trim(),
          collaboration_type: editCollabType.trim(),
          what_happened: editWhatHappened.trim(),
          why_it_matters_corporate: editCorporateGains.trim(),
          why_it_matters_startup: editStartupGains.trim(),
          why_it_matters_overall: editOverallMatters.trim()
        })
      });
      setShowEditNewsModal(false);
      setEditingItem(null);
      await loadFortnights(selectedFortnightId);
    } catch (err) {
      alert(`Error updating news update: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // 5. Delete News Item Trigger & Action
  const promptDeleteNews = (item) => {
    setItemToDelete(item);
    setShowDeleteNewsModal(true);
  };

  const handleConfirmDeleteNews = async () => {
    if (!itemToDelete) return;
    setDeletingNews(true);
    try {
      await apiFetch(`/news/${itemToDelete.id}`, {
        method: 'DELETE'
      });
      setShowDeleteNewsModal(false);
      setItemToDelete(null);
      await loadFortnights(selectedFortnightId);
    } catch (err) {
      alert(`Error deleting news item: ${err.message}`);
    } finally {
      setDeletingNews(false);
    }
  };

  // 6. Delete Fortnight Trigger & Action
  const promptDeleteFortnight = () => {
    if (!activeFortnight) return;
    setShowDeleteFortnightModal(true);
  };

  const handleConfirmDeleteFortnight = async () => {
    if (!activeFortnight) return;
    setDeletingFortnight(true);
    try {
      await apiFetch(`/news/fortnights/${activeFortnight.id}?course_id=${courseId}`, {
        method: 'DELETE'
      });
      setShowDeleteFortnightModal(false);
      setSelectedFortnightId(null);
      await loadFortnights(null);
    } catch (err) {
      alert(`Error deleting fortnight: ${err.message}`);
    } finally {
      setDeletingFortnight(false);
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>📰 Fortnightly Corporate-Startup Collaboration News</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Curate corporate-startup news, LinkedIn posts, CVC investments, and strategic alliances with AI-synthesized insights.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" style={{ padding: '10px 16px' }} onClick={() => setShowAddFortnightModal(true)}>
            📅 + New Fortnight
          </button>
          <button className="btn btn-primary" style={{ padding: '10px 18px' }} onClick={() => setShowAddNewsModal(true)} disabled={!selectedFortnightId}>
            ➕ Add News Update
          </button>
        </div>
      </div>

      {/* Fortnight Period Navigation Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>Fortnight Period:</span>
          {loading ? (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading periods...</span>
          ) : fortnights.length > 0 ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {fortnights.map(f => (
                <button
                  key={f.id}
                  className={`btn ${selectedFortnightId === f.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                  onClick={() => setSelectedFortnightId(f.id)}
                >
                  {f.title}
                </button>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No fortnight periods created yet.</span>
          )}
        </div>

        {activeFortnight && (
          <button
            className="btn-secondary"
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#dc2626', fontWeight: '600' }}
            onClick={promptDeleteFortnight}
          >
            🗑️ Delete Fortnight
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="card"><p>Loading fortnightly news updates...</p></div>
      ) : activeFortnight ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
              {activeFortnight.title} ({activeFortnight.news_items ? activeFortnight.news_items.length : 0} News Updates)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Range: {activeFortnight.start_date} to {activeFortnight.end_date}
            </span>
          </div>

          {activeFortnight.news_items && activeFortnight.news_items.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activeFortnight.news_items.map(item => (
                <div key={item.id} className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                  {/* Card Header & Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--accent)' }}>📅 {item.date}</span>
                        <span>&bull;</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Source: {item.source}</span>
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary-dark)' }}>{item.title}</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => openEditModal(item)}>
                        ✍️ Edit
                      </button>
                      <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px', color: '#dc2626' }} onClick={() => promptDeleteNews(item)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Corporate ↔ Startup Partners Visual Badge */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px', background: 'var(--bg-main)', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '4px' }}>
                      🏢 Corporate: {item.corporate}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '800' }}>↔</span>
                    <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '4px' }}>
                      🚀 Startup: {item.startup}
                    </span>
                  </div>

                  {/* NEWS SUMMARY */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      📌 NEWS SUMMARY
                    </div>
                    <p style={{ fontSize: '13.5px', lineHeight: '1.6' }}>{item.what_happened}</p>
                  </div>

                  {/* COLLABORATION TYPE */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      🤝 COLLABORATION TYPE
                    </div>
                    <span style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' }}>
                      {item.collaboration_type}
                    </span>
                  </div>

                  {/* WHY IT MATTERS FOR CORPORATE-STARTUP COLLABORATION */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      💡 WHY IT MATTERS FOR CORPORATE-STARTUP COLLABORATION
                    </div>
                    <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6' }}>
                      <div style={{ marginBottom: '6px' }}>
                        <strong style={{ color: '#1e40af' }}>Corporate Gains:</strong> {item.why_it_matters_corporate}
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <strong style={{ color: '#92400e' }}>Startup Gains:</strong> {item.why_it_matters_startup}
                      </div>
                      <div style={{ fontStyle: 'italic', color: 'var(--primary)', marginTop: '6px' }}>
                        <strong>Strategic Significance:</strong> {item.why_it_matters_overall}
                      </div>
                    </div>
                  </div>

                  {/* SOURCE LINK */}
                  <div style={{ marginBottom: '16px', fontSize: '13px' }}>
                    <strong>Source Link:</strong>{' '}
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--accent)', fontWeight: '700', textDecoration: 'underline' }}
                    >
                      🔗 {item.source} ({item.source_url})
                    </a>
                  </div>

                  {/* STUDENT NOTE OVERLAY BOX */}
                  <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderLeft: '4px solid var(--warning)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#b45309', marginBottom: '6px' }}>
                      ✍️ Student Note (Saved to Shared Audit Trail)
                    </div>
                    <textarea
                      rows={3}
                      value={studentNotes[item.log_id] !== undefined ? studentNotes[item.log_id] : (item.student_note || '')}
                      onChange={e => {
                        const val = e.target.value;
                        setStudentNotes(prev => ({ ...prev, [item.log_id]: val }));
                      }}
                      placeholder="Add your reflective comment, observation, or strategic takeaways from this collaboration news..."
                    />
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button className="btn btn-success" style={{ fontSize: '12px' }} onClick={() => handleSaveNote(item.log_id)}>
                        Save Student Note
                      </button>
                      {savedNoteStatus[item.log_id] && (
                        <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>✓ Saved to Prompt Log</span>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                No news updates added yet for <strong>{activeFortnight.title}</strong>. Click <strong>"➕ Add News Update"</strong> above to submit and analyze a news article or LinkedIn post.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            No fortnight periods available. Click <strong>"📅 + New Fortnight"</strong> above to create the first fortnight period.
          </p>
        </div>
      )}

      {/* Add Fortnight Modal */}
      {showAddFortnightModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', margin: 0, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800' }}>📅 Create New Fortnight Period</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowAddFortnightModal(false)}>&times;</button>
            </div>

            <div className="form-group">
              <label>Fortnight Title / Period Name</label>
              <input
                type="text"
                value={newFortnightTitle}
                onChange={e => setNewFortnightTitle(e.target.value)}
                placeholder="e.g. 31 August – 13 September 2026"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={newFortnightStart}
                  onChange={e => setNewFortnightStart(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={newFortnightEnd}
                  onChange={e => setNewFortnightEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Summary / Focus Area (Optional)</label>
              <textarea
                rows={3}
                value={newFortnightSummary}
                onChange={e => setNewFortnightSummary(e.target.value)}
                placeholder="e.g. Tracking clean-tech joint ventures and automotive CVC deals..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddFortnightModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateFortnight} disabled={savingFortnight}>
                {savingFortnight ? 'Creating...' : 'Create Fortnight'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add News Update Modal */}
      {showAddNewsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '620px', margin: 0, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800' }}>➕ Add News Update ({activeFortnight?.title})</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowAddNewsModal(false)}>&times;</button>
            </div>

            <div className="form-group">
              <label>Source URL / Link <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="url"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="e.g. https://www.techcrunch.com/2026/08/25/corp-startup-deal"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Article Headline / Post Title</label>
                <input
                  type="text"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="e.g. BMW i Ventures Backs Battery Tech Startup"
                />
              </div>
              <div className="form-group">
                <label>Source Name</label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={e => setSourceName(e.target.value)}
                  placeholder="e.g. LinkedIn Post, TechCrunch, Press Release"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Publication Date</label>
                <input
                  type="date"
                  value={pubDate}
                  onChange={e => setPubDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Corporate Name (Optional)</label>
                <input
                  type="text"
                  value={corporateName}
                  onChange={e => setCorporateName(e.target.value)}
                  placeholder="e.g. BMW Group"
                />
              </div>
              <div className="form-group">
                <label>Startup Name (Optional)</label>
                <input
                  type="text"
                  value={startupName}
                  onChange={e => setStartupName(e.target.value)}
                  placeholder="e.g. Bcomp"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Pasted Article Text / LinkedIn Post / Content</label>
              <textarea
                rows={6}
                value={articleText}
                onChange={e => setArticleText(e.target.value)}
                placeholder="Paste the full text, LinkedIn post body, or announcement content here..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddNewsModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAnalyzeNews} disabled={analyzingNews}>
                {analyzingNews ? '✨ Synthesizing News Analysis...' : '✨ Analyze & Save News Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit News Update Modal */}
      {showEditNewsModal && editingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '620px', margin: 0, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800' }}>✍️ Edit News Update</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowEditNewsModal(false)}>&times;</button>
            </div>

            <div className="form-group">
              <label>Headline</label>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Source Name</label>
                <input type="text" value={editSource} onChange={e => setEditSource(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Source URL</label>
                <input type="url" value={editSourceUrl} onChange={e => setEditSourceUrl(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Corporate Name</label>
                <input type="text" value={editCorporate} onChange={e => setEditCorporate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Startup Name</label>
                <input type="text" value={editStartup} onChange={e => setEditStartup(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Collaboration Type</label>
              <input type="text" value={editCollabType} onChange={e => setEditCollabType(e.target.value)} />
            </div>

            <div className="form-group">
              <label>What Happened</label>
              <textarea rows={3} value={editWhatHappened} onChange={e => setEditWhatHappened(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Corporate Gains</label>
              <textarea rows={2} value={editCorporateGains} onChange={e => setEditCorporateGains(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Startup Gains</label>
              <textarea rows={2} value={editStartupGains} onChange={e => setEditStartupGains(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Strategic Significance</label>
              <textarea rows={2} value={editOverallMatters} onChange={e => setEditOverallMatters(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setShowEditNewsModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateNewsItem} disabled={savingEdit}>
                {savingEdit ? 'Updating...' : 'Update News Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete News Confirmation Modal */}
      {showDeleteNewsModal && itemToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="card" style={{ width: '90%', maxWidth: '480px', margin: 0, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', borderLeft: '5px solid #dc2626' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#dc2626' }}>🗑️ Delete this news update?</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowDeleteNewsModal(false)}>&times;</button>
            </div>

            <p style={{ fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>
              {itemToDelete.title} ({itemToDelete.corporate} &bull; {itemToDelete.startup})
            </p>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              This will permanently delete this news update, its prompt log audit trail, and associated student notes.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteNewsModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#dc2626' }} onClick={handleConfirmDeleteNews} disabled={deletingNews}>
                {deletingNews ? 'Deleting...' : 'Delete News Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Fortnight Confirmation Modal */}
      {showDeleteFortnightModal && activeFortnight && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="card" style={{ width: '90%', maxWidth: '480px', margin: 0, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', borderLeft: '5px solid #dc2626' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#dc2626' }}>🗑️ Delete complete fortnight?</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowDeleteFortnightModal(false)}>&times;</button>
            </div>

            <p style={{ fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>
              {activeFortnight.title}
            </p>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              This will permanently delete this fortnight period and ALL associated news items, prompt log records, and student notes in this period.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteFortnightModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#dc2626' }} onClick={handleConfirmDeleteFortnight} disabled={deletingFortnight}>
                {deletingFortnight ? 'Deleting...' : 'Delete Fortnight'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
