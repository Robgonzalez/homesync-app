import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { KeyRound, Mail, UserPlus, LogIn, Sparkles } from 'lucide-react'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage({ type: 'success', text: '¡Revisa tu correo para confirmar tu cuenta!' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.error_description || error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    if (!email) {
      setMessage({ type: 'error', text: 'Por favor, ingresa tu correo primero.' })
      return
    }
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
      })
      if (error) throw error
      setMessage({ type: 'success', text: '¡Revisa tu correo! Te enviamos un enlace mágico para entrar sin clave.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.error_description || error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>HomeSync</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Administra tu hogar de forma inteligente
        </p>

        {message.text && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            color: message.type === 'error' ? 'var(--danger)' : 'var(--success)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="tu@email.com"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Procesando...' : (isSignUp ? <><UserPlus size={18}/> Crear Cuenta</> : <><LogIn size={18}/> Iniciar Sesión</>)}
          </button>
          
          {!isSignUp && (
            <button 
              type="button"
              onClick={handleMagicLink}
              className="btn" 
              style={{ width: '100%', marginTop: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }} 
              disabled={loading}
            >
              <Sparkles size={18} style={{ color: '#a78bfa' }}/> Enviar Link Mágico
            </button>
          )}
        </form>

        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--accent-primary)', 
              fontWeight: 600, 
              marginLeft: '0.5rem', 
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}>
            {isSignUp ? 'Inicia sesión aquí' : 'Regístrate aquí'}
          </button>
        </p>
      </div>
    </div>
  )
}
