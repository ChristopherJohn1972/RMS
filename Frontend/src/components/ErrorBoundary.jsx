import React from 'react';

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, maxWidth: 500, margin: '60px auto', font: '14px/1.5 system-ui, sans-serif', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <h2 style={{ color: '#dc2626', marginBottom: 8, fontSize: 18 }}>Something went wrong</h2>
          <p style={{ color: '#6b7280', marginBottom: 12 }}>{this.state.error.message}</p>
          <pre style={{ fontSize: 11, color: '#9ca3af', overflow: 'auto', maxHeight: 200, background: '#f9fafb', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>{this.state.error.stack}</pre>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} style={{ marginTop: 16, padding: '10px 24px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Clear &amp; Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
