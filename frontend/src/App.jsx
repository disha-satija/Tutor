import React, { useState, useEffect } from 'react';
import SubjectSelection from './pages/SubjectSelection';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import FortnightlyNews from './pages/FortnightlyNews';
import PromptLog from './pages/PromptLog';
import SessionsOverview from './pages/SessionsOverview';

export default function App() {
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleSelectCourse = (course) => {
    setActiveCourse(course);
    setActiveTab('dashboard');
  };

  const handleSwitchSubject = () => {
    setActiveCourse(null);
  };

  if (!activeCourse) {
    return <SubjectSelection onSelectCourse={handleSelectCourse} />;
  }

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-title-box">
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800' }}>{activeCourse.name}</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Continuous Assessment AI Tutor Workspace &bull; Shared Platform
            </p>
          </div>
        </div>

        <div>
          <button className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 14px' }} onClick={handleSwitchSubject}>
            ← Switch Subject
          </button>
        </div>
      </header>

      {/* Main Navigation Bar */}
      <nav className="main-nav">
        <button className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          🏠 Dashboard
        </button>
        <button className={`nav-tab ${activeTab === 'reflections' ? 'active' : ''}`} onClick={() => setActiveTab('reflections')}>
          📚 Class Reflections
        </button>
        {activeCourse.id === 1 && (
          <button className={`nav-tab ${activeTab === 'news' ? 'active' : ''}`} onClick={() => setActiveTab('news')}>
            📰 Fortnightly News
          </button>
        )}
        <button className={`nav-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          📋 Prompt Log
        </button>
        <button className={`nav-tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
          📅 Course Sessions
        </button>
      </nav>

      {/* Main Content Render */}
      <main>
        {activeTab === 'dashboard' && <Dashboard courseId={activeCourse.id} onNavigate={setActiveTab} />}
        {activeTab === 'reflections' && <Sessions courseId={activeCourse.id} />}
        {activeTab === 'news' && activeCourse.id === 1 && <FortnightlyNews courseId={activeCourse.id} />}
        {activeTab === 'logs' && <PromptLog courseId={activeCourse.id} />}
        {activeTab === 'sessions' && <SessionsOverview courseId={activeCourse.id} onNavigate={setActiveTab} />}
      </main>

      <footer style={{ textAlign: 'center', margin: '40px 0 20px', fontSize: '12px', color: 'var(--text-muted)' }}>
        {activeCourse.name} — Continuous Assessment AI Tutor Platform
      </footer>
    </div>
  );
}
