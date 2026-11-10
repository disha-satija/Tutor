import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

const DEFAULT_COURSES = [
  {
    id: 1,
    code: 'ENT 3805',
    name: 'Designing Corporate Startup Synergies'
  },
  {
    id: 2,
    code: 'ENG 4101',
    name: 'Engineering Philosophy of Technology'
  }
];

export default function SubjectSelection({ onSelectCourse }) {
  const [courses, setCourses] = useState(DEFAULT_COURSES);

  useEffect(() => {
    apiFetch('/courses')
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
        }
      })
      .catch(err => console.error('Error fetching courses, using default courses:', err));
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justify: 'center',
        alignItems: 'center',
        background: 'var(--bg-main)',
        padding: '24px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ width: '100%', maxWidth: '880px', margin: '0 auto', textAlign: 'center', marginTop: '6vh' }}>
        {/* Main Heading & Subtitle */}
        <div style={{ marginBottom: '38px' }}>
          <h1
            style={{
              fontSize: '34px',
              fontWeight: '900',
              color: 'var(--primary-dark)',
              margin: '0 0 10px 0',
              letterSpacing: '-0.5px'
            }}
          >
            CORPORATE STARTUP TUTOR
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#334155',
              fontWeight: '600',
              margin: 0
            }}
          >
            Select a course to continue to your workspace.
          </p>
        </div>

        {/* 2 Subject Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '28px',
            alignItems: 'stretch'
          }}
        >
          {courses.map(c => (
            <div
              key={c.id}
              className="card"
              style={{
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                alignItems: 'center',
                padding: '36px 28px 28px',
                height: '240px',
                borderRadius: '16px',
                border: '1.5px solid #c7d2fe',
                background: 'linear-gradient(135deg, #eef3ff 0%, #f5f1ff 100%)',
                boxShadow: '0 12px 28px -6px rgba(30, 58, 138, 0.09), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
              onClick={() => onSelectCourse(c)}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    color: 'var(--primary-dark)',
                    margin: 0,
                    lineHeight: '1.35',
                    textAlign: 'center'
                  }}
                >
                  {c.name}
                </h2>
              </div>

              <div style={{ width: '100%', marginTop: '20px' }}>
                <button
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '13px',
                    fontSize: '15px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCourse(c);
                  }}
                >
                  Enter Course →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
