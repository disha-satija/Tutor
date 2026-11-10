// ENT 3805 - Corporate Startup Tutor Frontend Logic

document.addEventListener('DOMContentLoaded', () => {
  let currentLogId = null;

  // DOM Elements
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const statusText = document.getElementById('status-text');

  // Reflection Elements
  const studentNameInput = document.getElementById('student-name');
  const classNotesInput = document.getElementById('class-notes');
  const btnLoadSample = document.getElementById('btn-load-sample');
  const btnGenerateReflection = document.getElementById('btn-generate-reflection');
  const btnClearNotes = document.getElementById('btn-clear-notes');
  
  const reflectionPlaceholder = document.getElementById('reflection-placeholder');
  const reflectionLoader = document.getElementById('reflection-loader');
  const reflectionOutput = document.getElementById('reflection-output');
  const reflectionMarkdown = document.getElementById('reflection-markdown');
  
  // Student Note Elements
  const inputStudentNote = document.getElementById('input-student-note');
  const btnSaveNote = document.getElementById('btn-save-note');
  const noteSavedToast = document.getElementById('note-saved-toast');

  // News Elements
  const newsGrid = document.getElementById('news-grid');
  const btnOpenNewsModal = document.getElementById('btn-open-news-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const newsModal = document.getElementById('news-modal');
  const btnSubmitNewsAnalysis = document.getElementById('btn-submit-news-analysis');
  const newsInputText = document.getElementById('news-input-text');
  const newsStudentName = document.getElementById('news-student-name');

  // Log Elements
  const logsContainer = document.getElementById('logs-container');
  const btnRefreshLogs = document.getElementById('btn-refresh-logs');

  // 1. Initial Status Check
  async function checkSystemStatus() {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        const providerName = data.llm_provider.toUpperCase();
        statusText.textContent = `Backend Ready (${providerName} Engine)`;
      } else {
        statusText.textContent = 'Backend Offline';
      }
    } catch (e) {
      statusText.textContent = 'Backend Connection Error';
    }
  }

  // 2. Tab Navigation
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      navBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');

      if (targetTab === 'news') {
        loadNewsItems();
      } else if (targetTab === 'log') {
        loadPromptLogs();
      }
    });
  });

  // 3. Load Sample Notes
  btnLoadSample.addEventListener('click', () => {
    classNotesInput.value = 
      "Today's class discussed why corporations collaborate with startups, benefits of startup innovation, corporate resources and market access, strategic partnerships, and challenges such as cultural differences and integration. We also examined how corporate venture capital (CVC) funds differ from traditional VC funds in strategic return expectations versus purely financial returns.";
  });

  btnClearNotes.addEventListener('click', () => {
    classNotesInput.value = '';
    reflectionOutput.classList.add('hidden');
    reflectionPlaceholder.classList.remove('hidden');
    currentLogId = null;
  });

  // 4. Generate Class Reflection
  btnGenerateReflection.addEventListener('click', async () => {
    const notes = classNotesInput.value.trim();
    const studentName = studentNameInput.value.trim() || 'Alex Rivers';

    if (!notes) {
      alert('Please enter your lecture notes before generating a reflection.');
      return;
    }

    // UI Loading state
    reflectionPlaceholder.classList.add('hidden');
    reflectionOutput.classList.add('hidden');
    reflectionLoader.classList.remove('hidden');
    noteSavedToast.classList.add('hidden');
    inputStudentNote.value = '';

    try {
      const response = await fetch('/api/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_name: studentName, notes: notes })
      });

      if (!response.ok) {
        throw new Error('Failed to generate reflection from server');
      }

      const data = await response.json();
      currentLogId = data.id;

      // Render Markdown using marked library
      reflectionMarkdown.innerHTML = marked.parse(data.ai_response);

      reflectionLoader.classList.add('hidden');
      reflectionOutput.classList.remove('hidden');
    } catch (err) {
      reflectionLoader.classList.add('hidden');
      reflectionPlaceholder.classList.remove('hidden');
      alert(`Error: ${err.message}`);
    }
  });

  // 5. Save Student Note
  btnSaveNote.addEventListener('click', async () => {
    const noteText = inputStudentNote.value.trim();

    if (!currentLogId) {
      alert('No active reflection log ID found. Please generate a reflection first.');
      return;
    }

    if (!noteText) {
      alert('Please enter a note before saving.');
      return;
    }

    try {
      const res = await fetch(`/api/logs/${currentLogId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_note: noteText })
      });

      if (res.ok) {
        noteSavedToast.classList.remove('hidden');
        setTimeout(() => {
          noteSavedToast.classList.add('hidden');
        }, 3000);
      } else {
        alert('Failed to save student note to log.');
      }
    } catch (e) {
      alert(`Error saving note: ${e.message}`);
    }
  });

  // 6. Load Fortnightly News Items
  async function loadNewsItems() {
    try {
      const res = await fetch('/api/news');
      if (!res.ok) return;

      const newsItems = await res.json();
      newsGrid.innerHTML = '';

      if (newsItems.length === 0) {
        newsGrid.innerHTML = '<p class="placeholder-box">No fortnightly news items available yet.</p>';
        return;
      }

      newsItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
          <div>
            <div class="news-meta">
              <span>📅 ${escapeHtml(item.date)}</span>
              <span>Source: <a href="${escapeHtml(item.source_url)}" target="_blank" rel="noopener">${escapeHtml(item.source)}</a></span>
            </div>
            <h3 class="news-title">${escapeHtml(item.title)}</h3>
            <div class="news-partners">
              <span class="partner-tag corp">🏢 ${escapeHtml(item.corporate)}</span>
              <span class="partner-tag startup">🚀 ${escapeHtml(item.startup)}</span>
            </div>
            
            <div class="news-section-title">What Happened</div>
            <p style="font-size: 13px;">${escapeHtml(item.what_happened)}</p>

            <div class="news-section-title">Summary</div>
            <p style="font-size: 13px;">${escapeHtml(item.summary)}</p>

            <div class="news-section-title">Why it Matters for Collaboration</div>
            <p style="font-size: 13px; color: var(--primary-dark); font-weight: 500;">${escapeHtml(item.why_it_matters)}</p>
          </div>
          <div>
            <span class="news-concept-badge">💡 ${escapeHtml(item.relevant_course_concept)}</span>
          </div>
        `;
        newsGrid.appendChild(card);
      });
    } catch (e) {
      console.error('Error loading news:', e);
    }
  }

  // News Modal Logic
  btnOpenNewsModal.addEventListener('click', () => newsModal.classList.remove('hidden'));
  btnCloseModal.addEventListener('click', () => newsModal.classList.add('hidden'));

  btnSubmitNewsAnalysis.addEventListener('click', async () => {
    const text = newsInputText.value.trim();
    const student = newsStudentName.value.trim() || 'Alex Rivers';

    if (!text) {
      alert('Please paste news article content.');
      return;
    }

    try {
      const res = await fetch('/api/news/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_name: student, news_text: text })
      });

      if (res.ok) {
        newsModal.classList.add('hidden');
        newsInputText.value = '';
        alert('News analysis saved to Prompt Log!');
        // Switch to Log tab
        document.querySelector('[data-tab="log"]').click();
      }
    } catch (e) {
      alert(`Error submitting news: ${e.message}`);
    }
  });

  // 7. Load & Render Prompt Logs
  async function loadPromptLogs() {
    try {
      const res = await fetch('/api/logs');
      if (!res.ok) return;

      const logs = await res.json();
      logsContainer.innerHTML = '';

      if (logs.length === 0) {
        logsContainer.innerHTML = '<div class="placeholder-box"><p>No prompt logs recorded yet. Create a class reflection to view log history.</p></div>';
        return;
      }

      logs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const modeBadge = log.mode === 'reflection' ? '📚 Class Reflection' : '📰 News Analysis';

        entry.innerHTML = `
          <div class="log-header">
            <div>
              <span class="log-id">#LOG-${log.id}</span> &bull; 
              <span class="log-student">Student: ${escapeHtml(log.student_name)}</span> &bull;
              <span>${modeBadge}</span>
            </div>
            <span class="log-time">🕒 ${escapeHtml(log.timestamp)}</span>
          </div>

          <div class="log-flow-body">
            
            <!-- Step 1: Student Prompt -->
            <div class="flow-box prompt-box">
              <div class="flow-title">1. Student Prompt / Notes</div>
              <div style="font-size: 13.5px; white-space: pre-wrap;">${escapeHtml(log.prompt)}</div>
            </div>

            <div class="flow-arrow">↓</div>

            <!-- Step 2: AI Response -->
            <div class="flow-box ai-box">
              <div class="flow-title">2. AI Tutor Response</div>
              <div class="markdown-body" style="font-size: 13.5px;">${marked.parse(log.ai_response)}</div>
            </div>

            <div class="flow-arrow">↓</div>

            <!-- Step 3: Student Note -->
            <div class="flow-box note-box">
              <div class="flow-title">3. Student-Added Note</div>
              <div class="log-note-content" id="log-note-display-${log.id}">
                ${log.student_note ? escapeHtml(log.student_note) : '<em style="color: var(--text-muted);">No student note attached yet.</em>'}
              </div>
              <div style="margin-top: 8px;">
                <button class="btn-text btn-edit-log-note" data-id="${log.id}">✍️ Add / Edit Note</button>
              </div>
            </div>

          </div>
        `;
        logsContainer.appendChild(entry);
      });

      // Attach inline edit handlers for student notes in log view
      document.querySelectorAll('.btn-edit-log-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          promptInlineNoteEdit(id);
        });
      });

    } catch (e) {
      console.error('Error fetching logs:', e);
    }
  }

  btnRefreshLogs.addEventListener('click', loadPromptLogs);

  function promptInlineNoteEdit(logId) {
    const existingTextEl = document.getElementById(`log-note-display-${logId}`);
    const currentNote = existingTextEl ? existingTextEl.textContent.trim() : '';

    const newNote = prompt('Enter/Edit your Student Note for this interaction:', currentNote === 'No student note attached yet.' ? '' : currentNote);
    if (newNote !== null) {
      fetch(`/api/logs/${logId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_note: newNote })
      }).then(res => {
        if (res.ok) {
          loadPromptLogs();
        }
      });
    }
  }

  // Utility HTML Escape
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initialize
  checkSystemStatus();
});
