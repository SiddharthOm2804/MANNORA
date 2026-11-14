import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try { const response = await api.get('/auth/me'); setUser(response.data.data); setError(''); }
    catch (err) { setUser(null); if (!err.response) setError('Cannot reach the account service. Check the server connection and try again.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await api.post(`/auth/${mode}`, {
        email: data.get('email'), password: data.get('password'), displayName: data.get('displayName'),
      });
      setUser(response.data.data);
    } catch (err) { setError(err.response?.data?.message || 'Unable to sign in right now. Please try again.'); }
    finally { setBusy(false); }
  };

  const logout = async () => { try { await api.post('/auth/logout'); } finally { setUser(null); } };

  if (loading) return <div className="auth-gate-status" role="status">Checking your secure session…</div>;
  if (!user) return <main className="auth-gate"><form className="auth-card" onSubmit={submit}>
    <div className="auth-kicker">MANNORA · CITY SIMULATION LAB</div>
    <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
    <p>Your worlds are private to your account.</p>
    {mode === 'register' && <label>Your name<input name="displayName" autoComplete="name" minLength="2" maxLength="80" required /></label>}
    <label>Email<input type="email" name="email" autoComplete="email" maxLength="254" required /></label>
    <label>Password<input type="password" name="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 12 : 1} maxLength="128" required />{mode === 'register' && <small>Use at least 12 characters.</small>}</label>
    {error && <div className="auth-error" role="alert">{error}</div>}
    <button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    <button type="button" className="auth-switch" onClick={() => { setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}>{mode === 'login' ? 'New to MANNORA? Create an account' : 'Already have an account? Sign in'}</button>
  </form></main>;

  return <><div className="auth-session"><span>{user.displayName}</span><button onClick={logout}>Sign out</button></div>{children}</>;
}
