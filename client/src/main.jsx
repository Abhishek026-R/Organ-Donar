import React, { createContext, useContext, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import './style.css';

const AuthContext = createContext(null);
const organs = ['Heart', 'Kidney', 'Lungs', 'Bone Marrow', 'Liver', 'Skin', 'Pancreas', 'Blood'];
const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const api = async (url, options) => {
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { ...(options?.body ? { 'Content-Type': 'application/json' } : {}), ...options?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
};
const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { api('/api/profile').then(setUser).catch(() => setUser(null)).finally(() => setReady(true)); }, []);
  if (!ready) return <div className="loading">Organ Connect</div>;
  return <AuthContext.Provider value={{ user, setUser }}><BrowserRouter><Header /><Routes>
    <Route path="/" element={<Home />} /><Route path="/donors" element={<Donors />} />
    <Route path="/requests" element={<Requests />} /><Route path="/register" element={<Register />} />
    <Route path="/login" element={<Login />} /><Route path="/dashboard" element={<Dashboard />} />
    <Route path="/login.html" element={<Login />} /><Route path="/register.html" element={<Register />} />
    <Route path="/donors.html" element={<Donors />} /><Route path="/requests.html" element={<Requests />} />
    <Route path="/dashboard.html" element={<Dashboard />} />
    <Route path="*" element={<Home />} />
  </Routes><footer>Organ Connect · Connecting people, giving hope.</footer></BrowserRouter></AuthContext.Provider>;
}

function Header() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  async function logout() { await api('/api/auth/logout', { method: 'POST' }); setUser(null); navigate('/'); }
  return <header className="topbar"><Link className="brand" to="/"><span className="brand-icon">OC</span> Organ Connect</Link><nav>
    <NavLink to="/">Home</NavLink><NavLink to="/donors">Find Donors</NavLink><NavLink to="/requests">Requests</NavLink>
    {user ? <><NavLink to="/dashboard">Dashboard</NavLink><button className="nav-button" onClick={logout}>Logout</button></> : <><NavLink to="/register">Register</NavLink><NavLink className="nav-login" to="/login">Login</NavLink></>}
  </nav></header>;
}

function Page({ eyebrow, title, children, narrow = false }) { return <main className={`page ${narrow ? 'narrow' : ''}`}><div className="page-heading"><span>{eyebrow}</span><h1>{title}</h1></div>{children}</main>; }
function Notice({ error, children }) { return children ? <div className={`notice ${error ? 'error' : ''}`} role="status">{children}</div> : null; }
function Select({ label, name, options, required = false, empty = 'Select…' }) { return <label className="field">{label}{required && <b> *</b>}<select name={name} required={required}><option value="">{empty}</option>{options.map(x => <option key={x}>{x}</option>)}</select></label>; }
function Input({ label, name, type = 'text', required = false, ...props }) { return <label className="field">{label}{required && <b> *</b>}<input name={name} type={type} required={required} {...props} /></label>; }

function Home() {
  const [results, setResults] = useState([]); const [message, setMessage] = useState(''); const [searched, setSearched] = useState(false);
  async function search(e) { e.preventDefault(); const f = new FormData(e.currentTarget); try { const qs = new URLSearchParams(); for (const k of ['blood_group','organ','location']) if (f.get(k)) qs.set(k, f.get(k)); setResults(await api(`/api/users?${qs}`)); setMessage(''); setSearched(true); } catch (err) { setMessage(err.message); } }
  return <><main className="hero"><div className="hero-copy"><span className="eyebrow">DONATION SAVES LIVES</span><h1>Give the gift<br />of life.</h1><p>Find a donor, share your commitment, and help connect people to the support they need.</p><div className="actions"><Link className="button" to="/register">Become a donor</Link><Link className="button outline" to="/donors">Find donors</Link></div></div><div className="hero-mark"><div className="heart">♥</div><span>One act can change everything.</span></div></main><section className="home-search"><div><span className="eyebrow">START HERE</span><h2>Find a donor near you</h2><p>Search registered donor profiles by blood group, organ, and location.</p></div><form className="search-form" onSubmit={search}><Select label="Blood group" name="blood_group" options={groups} /><Select label="Donation type" name="organ" options={organs} /><Input label="City or area" name="location" placeholder="e.g. Chennai" /><button className="button">Search donors</button></form><Notice error>{message}</Notice>{results.length > 0 && <DonorTable donors={results} />}{searched && results.length === 0 && !message && <div className="empty">No donors matched those filters.</div>}</section></>;
}

function DonorTable({ donors }) { return <div className="table-wrap"><table><thead><tr><th>Name</th><th>Group</th><th>Donation</th><th>City</th><th>Contact</th></tr></thead><tbody>{donors.map(d => <tr key={d._id}><td>{d.name}</td><td>{d.blood_group}</td><td>{d.organ || 'Blood'}</td><td>{d.location}</td><td><a href={`tel:${d.phone}`}>{d.phone}</a><br /><a href={`mailto:${d.email}`}>{d.email}</a></td></tr>)}</tbody></table></div>; }

function Donors() { const [donors, setDonors] = useState([]); const [notice, setNotice] = useState(''); async function load(filters = {}) { const q = new URLSearchParams(Object.entries(filters).filter(([,v]) => v)); setDonors(await api(`/api/users?${q}`)); } useEffect(() => { load().catch(e => setNotice(e.message)); }, []); async function submit(e) { e.preventDefault(); const f = new FormData(e.currentTarget); try { await load(Object.fromEntries(f)); } catch (e) { setNotice(e.message); } } return <Page eyebrow="COMMUNITY" title="Find a donor"><p className="intro">Search donor profiles and contact them directly.</p><form className="filter-row" onSubmit={submit}><Select label="Blood group" name="blood_group" options={groups} empty="All groups" /><Select label="Donation type" name="organ" options={organs} empty="All types" /><Input label="City or area" name="location" placeholder="Any location" /><button className="button">Search</button></form><Notice error>{notice}</Notice>{donors.length ? <DonorTable donors={donors} /> : <div className="empty">No donors found. Try another search or register as a donor.</div>}</Page>; }

function Register() { const { setUser } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState(''); async function submit(e) { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); try { const result = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }); setUser(result.user); navigate('/dashboard'); } catch (e) { setError(e.message); } } return <Page eyebrow="JOIN THE COMMUNITY" title="Become a donor" narrow><p className="intro">Create a profile so people in need can reach you.</p><form className="form-card form-grid" onSubmit={submit}><Input label="Full name" name="name" required /><Input label="Email" name="email" type="email" required /><Input label="Phone" name="phone" type="tel" required pattern="[0-9]{10}" placeholder="10-digit number" /><Select label="Blood group" name="blood_group" options={groups} required /><Select label="Donation type" name="organ" options={organs} empty="Blood" /><Input label="City" name="location" required /><Input label="Password" name="password" type="password" required minLength="8" /><label className="field span-two">Notes (optional)<textarea name="notes" rows="3" /></label><Notice error>{error}</Notice><button className="button span-two">Create account</button></form></Page>; }

function Login() { const { setUser } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState(''); async function submit(e) { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); try { const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }); setUser(result.user); navigate('/dashboard'); } catch (e) { setError(e.message); } } return <Page eyebrow="WELCOME BACK" title="Log in" narrow><p className="intro">Access your profile and manage your requests.</p><form className="form-card" onSubmit={submit}><Input label="Email" name="email" type="email" required /><Input label="Password" name="password" type="password" required /><Notice error>{error}</Notice><button className="button full">Log in</button><p className="form-foot">New here? <Link to="/register">Create an account</Link></p></form></Page>; }

function Requests() { const { user } = useAuth(); const [requests, setRequests] = useState([]); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); async function load() { const data = await api('/api/requests'); setRequests(data); } useEffect(() => { load().catch(e => setError(e.message)); }, []); async function submit(e) { e.preventDefault(); const form = e.currentTarget; const data = Object.fromEntries(new FormData(form)); try { await api('/api/requests', { method: 'POST', body: JSON.stringify(data) }); form.reset(); await load(); setError(''); setSuccess('Request posted successfully.'); } catch (e) { setSuccess(''); setError(e.message); } } return <Page eyebrow="HELP SOMEONE IN NEED" title="Blood requests"><p className="intro">Browse active requests or post one when you are logged in.</p>{user ? <form className="form-card form-grid" onSubmit={submit}><Input label="Patient name" name="patient_name" required /><Input label="Hospital" name="hospital" required /><Input label="City" name="location" required /><Select label="Blood group" name="blood_group" options={groups} required /><Select label="Organ" name="organ" options={organs} empty="Blood" /><Input label="Date needed" name="date_needed" type="date" required /><Select label="Urgency" name="urgency" options={['Normal','High','Critical']} /><button className="button span-two">Post request</button></form> : <div className="notice">Please <Link to="/login">log in</Link> to post a request.</div>}<Notice error>{error}</Notice><Notice>{success}</Notice><div className="request-list">{requests.map(r => <article className="request-card" key={r._id}><div><span className={`tag ${r.urgency?.toLowerCase()}`}>{r.urgency}</span><h3>{r.patient_name}</h3><p>{r.blood_group} · {r.organ || 'Blood'} · {r.location}</p><p>{r.hospital} · Needed {r.date_needed}</p></div><div className="contact"><b>Contact</b><a href={`tel:${r.contact?.phone}`}>{r.contact?.phone}</a><a href={`mailto:${r.contact?.email}`}>{r.contact?.email}</a></div></article>)}</div>{requests.length === 0 && <div className="empty">No active requests yet.</div>}</Page>; }

function Dashboard() { const { user } = useAuth(); const [requests, setRequests] = useState([]); const [error, setError] = useState(''); async function load() { setRequests(await api(`/api/requests?user_id=${user.id}`)); } useEffect(() => { if (user) load().catch(e => setError(e.message)); }, [user]); async function remove(id) { try { await api(`/api/requests/${id}`, { method: 'DELETE' }); await load(); } catch (e) { setError(e.message); } } if (!user) return <Page eyebrow="YOUR ACCOUNT" title="Dashboard"><p className="intro">Please <Link to="/login">log in</Link> to view your dashboard.</p></Page>; return <Page eyebrow="YOUR ACCOUNT" title={`Welcome, ${user.name}`}><div className="dashboard-grid"><section className="form-card"><h2>Your donor profile</h2><dl className="profile-list">{[['Email',user.email],['Phone',user.phone],['Blood group',user.blood_group],['Donation type',user.organ || 'Blood'],['City',user.location],['Notes',user.notes || '—']].map(([k,v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl></section><section className="form-card"><h2>Your requests</h2><Notice error>{error}</Notice>{requests.length ? requests.map(r => <div className="my-request" key={r._id}><div><b>{r.patient_name}</b><span>{r.blood_group} · {r.location} · {r.urgency}</span></div><button className="remove" onClick={() => remove(r._id)}>Remove</button></div>) : <p className="muted">You have not posted any requests yet.</p>}</section></div></Page>; }

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
