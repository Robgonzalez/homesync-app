import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, ShoppingCart, Zap, Sparkles, Home, MoreHorizontal, PieChart, FileText, Link as LinkIcon, ExternalLink } from 'lucide-react'

const DAILY_CATEGORIES = [
  { id: 'Supermercado', icon: ShoppingCart, color: '#3b82f6' },
  { id: 'Hogar y Limpieza', icon: Home, color: '#22c55e' },
  { id: 'Mascotas', icon: Sparkles, color: '#a855f7' },
  { id: 'Otros', icon: MoreHorizontal, color: '#94a3b8' }
]

const BILLS_CATEGORIES = [
  { id: 'Luz', icon: Zap, color: '#eab308' },
  { id: 'Agua', icon: Zap, color: '#3b82f6' },
  { id: 'Internet/TV', icon: Zap, color: '#ef4444' },
  { id: 'Gastos Comunes', icon: Home, color: '#22c55e' },
  { id: 'Arriendo', icon: Home, color: '#8b5cf6' },
  { id: 'Otro', icon: MoreHorizontal, color: '#94a3b8' }
]

const ALL_CATEGORIES = [...DAILY_CATEGORIES, ...BILLS_CATEGORIES]

const HOUSEHOLD_MEMBERS = ['Roberto', 'Ignacio', 'Dancko']

const formatCLP = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount)
}

export default function Expenses() {
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'daily', 'bills'
  const [expenses, setExpenses] = useState([])
  
  // Form States
  const [newTitle, setNewTitle] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [category, setCategory] = useState('')
  const [paidBy, setPaidBy] = useState('Roberto')
  const [receiptUrl, setReceiptUrl] = useState('')

  useEffect(() => {
    fetchExpenses()
  }, [])

  // When tab changes, reset form defaults
  useEffect(() => {
    setNewTitle('')
    setNewAmount('')
    setReceiptUrl('')
    if (activeTab === 'daily') setCategory('Supermercado')
    if (activeTab === 'bills') setCategory('Luz')
  }, [activeTab])

  const fetchExpenses = async () => {
    const { data } = await supabase
      .from('home_expenses')
      .select('*')
      .order('date', { ascending: false })
    
    if (data) setExpenses(data)
  }

  const addExpense = async (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !newAmount) return

    const expenseType = activeTab === 'bills' ? 'bill' : 'daily'

    const { data, error } = await supabase
      .from('home_expenses')
      .insert([
        { 
          title: newTitle, 
          amount: parseFloat(newAmount),
          paid_by: paidBy,
          category: category,
          expense_type: expenseType,
          receipt_url: receiptUrl || null
        }
      ])
      .select()

    if (!error && data) {
      setExpenses([data[0], ...expenses])
      setNewTitle('')
      setNewAmount('')
      setReceiptUrl('')
    } else if (error) {
      alert("Error guardando: " + error.message)
    }
  }

  const deleteExpense = async (id) => {
    if(window.confirm("¿Estás seguro de eliminar este registro?")) {
      await supabase.from('home_expenses').delete().eq('id', id)
      setExpenses(expenses.filter(e => e.id !== id))
    }
  }

  // Calculate Transparency Data
  const { total, contributions } = useMemo(() => {
    const contrib = {}
    HOUSEHOLD_MEMBERS.forEach(m => contrib[m] = 0)
    
    let totalSpent = 0;
    
    expenses.forEach(exp => {
      totalSpent += Number(exp.amount)
      if (contrib[exp.paid_by] !== undefined) {
        contrib[exp.paid_by] += Number(exp.amount)
      } else {
        contrib[exp.paid_by] = Number(exp.amount)
      }
    })

    const contributionsArray = HOUSEHOLD_MEMBERS.map(name => {
      const amount = contrib[name]
      const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0
      return { name, amount, percentage }
    }).sort((a, b) => b.amount - a.amount)

    return { total: totalSpent, contributions: contributionsArray }
  }, [expenses])

  const getCategoryIcon = (catId) => {
    const cat = ALL_CATEGORIES.find(c => c.id === catId) || ALL_CATEGORIES[ALL_CATEGORIES.length - 1];
    const IconComponent = cat.icon;
    return <IconComponent size={20} color={cat.color} />;
  }

  // Components for cleaner render
  const ExpenseFeedItem = ({ expense }) => (
    <div className="flex justify-between items-center" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-start" style={{ gap: '1rem', flex: 1 }}>
        <div style={{ 
          width: '40px', height: '40px', 
          borderRadius: '12px', 
          background: 'rgba(255,255,255,0.05)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          {getCategoryIcon(expense.category)}
        </div>
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600 }}>{expense.paid_by}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>pagó</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCLP(expense.amount)}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>por</span>
            <span style={{ fontWeight: 500 }}>{expense.title}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{new Date(expense.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            {expense.category && <span>• {expense.category}</span>}
            {expense.expense_type === 'bill' && <span style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', padding: '2px 6px', borderRadius: '4px' }}>Cuenta/Fijo</span>}
          </div>
          {expense.receipt_url && (
            <a href={expense.receipt_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none', marginTop: '6px', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
              <ExternalLink size={12}/> Ver Boleta
            </a>
          )}
        </div>
      </div>
      <button 
        onClick={() => deleteExpense(expense.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.5rem', opacity: 0.5, transition: 'opacity 0.2s', flexShrink: 0 }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
        title="Eliminar registro"
      >
        <Trash2 size={18} />
      </button>
    </div>
  )

  const dailyExpenses = expenses.filter(e => e.expense_type !== 'bill')
  const billExpenses = expenses.filter(e => e.expense_type === 'bill')

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>Finanzas del Hogar</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Control y transparencia de los gastos de la casa.</p>
      
      {/* Navegación por Pestañas */}
      <div className="tabs-container" style={{ flexWrap: 'wrap' }}>
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <div className="flex items-center" style={{ gap: '0.5rem' }}><PieChart size={18}/> Vista General</div>
        </button>
        <button 
          className={`tab ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          <div className="flex items-center" style={{ gap: '0.5rem' }}><ShoppingCart size={18}/> Gastos Comunes</div>
        </button>
        <button 
          className={`tab ${activeTab === 'bills' ? 'active' : ''}`}
          onClick={() => setActiveTab('bills')}
        >
          <div className="flex items-center" style={{ gap: '0.5rem' }}><FileText size={18}/> Cuentas y Boletas</div>
        </button>
      </div>

      {/* --- VISTA GENERAL --- */}
      {activeTab === 'overview' && (
        <div className="tab-content fade-in">
          <div className="card-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <div className="glass-panel card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '1rem' }}>Gasto Total de la Casa</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {formatCLP(total)}
              </div>
            </div>

            <div className="glass-panel card">
              <h3 style={{ margin: '0 0 1rem 0' }}>Aportes de este mes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {contributions.map(c => (
                  <div key={c.name}>
                    <div className="flex justify-between" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <span>{c.name}</span>
                      <span style={{ fontWeight: 500 }}>{formatCLP(c.amount)}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${c.percentage}%`, 
                        height: '100%', 
                        background: c.name === 'Roberto' ? '#3b82f6' : c.name === 'Ignacio' ? '#eab308' : '#a855f7',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out'
                      }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 style={{ marginBottom: '1rem' }}>Muro de Actividad General</h2>
          <div className="glass-panel" style={{ padding: '1rem 0' }}>
            {expenses.length === 0 ? (
              <div className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
                <p>Todavía no hay aportes registrados este mes.</p>
              </div>
            ) : (
              expenses.map(expense => <ExpenseFeedItem key={expense.id} expense={expense} />)
            )}
          </div>
        </div>
      )}

      {/* --- GASTOS COMUNES --- */}
      {activeTab === 'daily' && (
        <div className="tab-content fade-in">
          <div className="glass-panel card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Registrar Compra del Día</h3>
            <form onSubmit={addExpense}>
              <div className="flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label className="form-label">¿Qué compraste?</label>
                  <input 
                    className="form-input" 
                    placeholder="Ej. Líder, Pan, Feria..." 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group" style={{ flex: '1 1 120px' }}>
                  <label className="form-label">Monto (CLP)</label>
                  <input 
                    className="form-input" 
                    type="number"
                    placeholder="15000" 
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group" style={{ flex: '1 1 150px' }}>
                  <label className="form-label">Categoría</label>
                  <select 
                    className="form-input" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ height: '42px' }}
                  >
                    {DAILY_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ flex: '1 1 150px' }}>
                  <label className="form-label">¿Quién pagó?</label>
                  <select 
                    className="form-input" 
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    style={{ height: '42px' }}
                  >
                    {HOUSEHOLD_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <Plus size={18} /> Registrar Gasto
                </button>
              </div>
            </form>
          </div>

          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Historial de Gastos Comunes</h3>
          <div className="glass-panel" style={{ padding: '1rem 0' }}>
            {dailyExpenses.length === 0 ? (
              <div className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
                <p>No hay gastos comunes registrados.</p>
              </div>
            ) : (
              dailyExpenses.map(expense => <ExpenseFeedItem key={expense.id} expense={expense} />)
            )}
          </div>
        </div>
      )}

      {/* --- CUENTAS Y BOLETAS --- */}
      {activeTab === 'bills' && (
        <div className="tab-content fade-in">
          <div className="glass-panel card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent-primary)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Registrar Cuenta o Gasto Fijo</h3>
            <form onSubmit={addExpense}>
              <div className="flex" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label className="form-label">Nombre de la cuenta</label>
                  <input 
                    className="form-input" 
                    placeholder="Ej. Gasto Común Octubre, VTR..." 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group" style={{ flex: '1 1 120px' }}>
                  <label className="form-label">Monto (CLP)</label>
                  <input 
                    className="form-input" 
                    type="number"
                    placeholder="25000" 
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group" style={{ flex: '1 1 150px' }}>
                  <label className="form-label">Categoría</label>
                  <select 
                    className="form-input" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ height: '42px' }}
                  >
                    {BILLS_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ flex: '1 1 150px' }}>
                  <label className="form-label">¿Quién la pagó?</label>
                  <select 
                    className="form-input" 
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    style={{ height: '42px' }}
                  >
                    {HOUSEHOLD_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* URL Comprobante */}
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label flex items-center" style={{ gap: '0.5rem' }}>
                  <LinkIcon size={14}/> Enlace al comprobante o boleta (Opcional)
                </label>
                <input 
                  className="form-input" 
                  placeholder="https://link-a-tu-boleta.com/archivo.pdf" 
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Pega aquí el enlace a la cartola, foto o comprobante PDF para respaldar el pago.
                </p>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <Plus size={18} /> Registrar Cuenta
                </button>
              </div>
            </form>
          </div>

          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Historial de Cuentas Fijas</h3>
          <div className="glass-panel" style={{ padding: '1rem 0' }}>
            {billExpenses.length === 0 ? (
              <div className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
                <p>No hay cuentas ni boletas registradas.</p>
              </div>
            ) : (
              billExpenses.map(expense => <ExpenseFeedItem key={expense.id} expense={expense} />)
            )}
          </div>
        </div>
      )}

    </div>
  )
}
