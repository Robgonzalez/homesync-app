import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckSquare, DollarSign, Clock, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard({ session }) {
  const [recentTasks, setRecentTasks] = useState([])
  const [totalExpenses, setTotalExpenses] = useState(0)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    // Fetch pending tasks
    const { data: tasks } = await supabase
      .from('home_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (tasks) setRecentTasks(tasks)

    // Fetch this month's expenses
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const { data: expenses } = await supabase
      .from('home_expenses')
      .select('amount')
      .gte('date', startOfMonth.toISOString())

    if (expenses) {
      const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
      setTotalExpenses(total)
    }
  }

  const markTaskCompleted = async (id) => {
    await supabase.from('home_tasks').update({ status: 'completed' }).eq('id', id);
    fetchDashboardData();
  }

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Hola, {session.user.email.split('@')[0]} 👋</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Aquí tienes un resumen de lo que pasa en casa.</p>
      </header>

      <div className="card-grid" style={{ marginBottom: '3rem' }}>
        <div className="glass-panel card" style={{ borderTop: '4px solid var(--accent-primary)' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ margin: 0 }}>Tareas Pendientes</h3>
            <CheckSquare color="var(--accent-primary)" />
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>{recentTasks.length}</p>
          <Link to="/tasks" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>Ver todas las tareas →</Link>
        </div>

        <div className="glass-panel card" style={{ borderTop: '4px solid var(--danger)' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ margin: 0 }}>Gastos del Mes</h3>
            <DollarSign color="var(--danger)" />
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>${totalExpenses.toFixed(2)}</p>
          <Link to="/expenses" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>Ir a finanzas →</Link>
        </div>
      </div>

      <h2>Para hacer pronto</h2>
      <div className="glass-panel" style={{ padding: '1rem', marginTop: '1.5rem' }}>
        {recentTasks.length === 0 ? (
          <div className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>¡Todo limpio y ordenado! No hay tareas pendientes.</p>
          </div>
        ) : (
          recentTasks.map(task => (
            <div key={task.id} className="flex justify-between items-center" style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>{task.title}</h4>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {task.assigned_to && <span>Asignado a: {task.assigned_to}</span>}
                  {task.due_date && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> {new Date(task.due_date).toLocaleDateString()}</span>}
                </div>
              </div>
              <button 
                onClick={() => markTaskCompleted(task.id)}
                className="btn" 
                style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)', padding: '0.5rem 1rem' }}>
                <CheckSquare size={16} /> Completar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
