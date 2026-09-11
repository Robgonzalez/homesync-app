import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { Home, CheckSquare, DollarSign, LogOut, Loader } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Expenses from './pages/Expenses'
import Auth from './pages/Auth'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Loader className="spinner" size={48} color="var(--accent-primary)" />
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="app-container">
      <nav className="navbar glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Home size={24} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>HomeSync</h2>
        </div>
        
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/tasks" className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckSquare size={18}/> Tareas</span>
          </Link>
          <Link to="/expenses" className={`nav-link ${location.pathname === '/expenses' ? 'active' : ''}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={18}/> Gastos</span>
          </Link>
        </div>

        <button onClick={handleSignOut} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
          <LogOut size={20} /> Salir
        </button>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard session={session} />} />
          <Route path="/tasks" element={<Tasks session={session} />} />
          <Route path="/expenses" element={<Expenses session={session} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
