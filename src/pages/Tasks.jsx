import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Sparkles, Users, User, Shuffle } from 'lucide-react'
import { generateWeeklyTasks } from '../lib/taskGenerator'
import { DndContext, useDraggable, useDroppable, closestCorners, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core'

function DraggableTask({ task, toggleTask, deleteTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className="kanban-card"
    >
      <div className="flex items-center" style={{ gap: '1rem' }}>
        <button 
          onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when clicking the button
          onClick={() => toggleTask(task)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.status === 'completed' ? 'var(--success)' : 'var(--text-secondary)' }}>
          {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
        </button>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
            {task.title}
          </h4>
          {task.assigned_to && (
            <span style={{ fontSize: '0.75rem', color: 'white', background: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '12px', marginTop: '4px', display: 'inline-block' }}>
              {task.assigned_to}
            </span>
          )}
        </div>
        <button 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => deleteTask(task.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.7, padding: '0.5rem' }}>
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}

function KanbanColumn({ id, title, tasks, toggleTask, deleteTask }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const style = {
    backgroundColor: isOver ? 'rgba(59, 130, 246, 0.1)' : undefined,
    border: isOver ? '1px dashed var(--accent-primary)' : '1px solid var(--glass-border)',
  };

  return (
    <div ref={setNodeRef} className="kanban-column" style={style}>
      <div className="kanban-header">
        <Calendar size={18} />
        {title}
      </div>
      <div className="kanban-cards">
        {tasks.map(task => (
          <DraggableTask key={task.id} task={task} toggleTask={toggleTask} deleteTask={deleteTask} />
        ))}
      </div>
    </div>
  )
}

export default function Tasks({ session }) {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [assignee, setAssignee] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [filterMode, setFilterMode] = useState('all') // 'all', 'Roberto', 'Ignacio', 'Dancko'

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Permite hacer click normal sin iniciar el drag en PC
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Requiere mantener presionado 250ms en celular para arrastrar (permite hacer scroll normal)
        tolerance: 5,
      }
    })
  );

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('home_tasks')
      .select('*')
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (data) setTasks(data)
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return

    const { data, error } = await supabase
      .from('home_tasks')
      .insert([
        { 
          title: newTask, 
          assigned_to: assignee || null,
          created_by: session.user.email,
          due_date: new Date().toISOString()
        }
      ])
      .select()

    if (!error && data) {
      setTasks([...tasks, data[0]])
      setNewTask('')
      setAssignee('')
    }
  }

  const toggleTask = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase
      .from('home_tasks')
      .update({ status: newStatus })
      .eq('id', task.id)

    if (!error) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    }
  }

  const deleteTask = async (id) => {
    await supabase.from('home_tasks').delete().eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  const handleGenerateWeekly = async () => {
    setIsGenerating(true)
    const today = new Date();
    const newTasks = generateWeeklyTasks(today);
    
    const tasksToInsert = newTasks.map(t => ({
      ...t,
      created_by: session.user.email
    }));

    const { error } = await supabase
      .from('home_tasks')
      .insert(tasksToInsert);

    if (!error) {
      await fetchTasks();
    } else {
      alert("Error al generar las tareas: " + error.message)
    }
    setIsGenerating(false)
  }

  const handleReshuffle = async () => {
    setIsGenerating(true)
    // Delete only pending tasks so we don't erase history of completed ones
    await supabase.from('home_tasks').delete().eq('status', 'pending');
    
    const today = new Date();
    const newTasks = generateWeeklyTasks(today);
    
    const tasksToInsert = newTasks.map(t => ({
      ...t,
      created_by: session.user.email
    }));

    const { error } = await supabase.from('home_tasks').insert(tasksToInsert);
    
    if (!error) {
      await fetchTasks();
    } else {
      alert("Error al regenerar las tareas: " + error.message)
    }
    setIsGenerating(false)
  }

  const handleDeleteAll = async () => {
    if (window.confirm("¿Estás seguro de que quieres borrar TODAS las tareas para empezar de cero?")) {
      await supabase.from('home_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
      setTasks([]);
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    // If dropped outside any droppable area
    if (!over) return;
    
    const taskId = active.id;
    const targetDateKey = over.id; // YYYY-MM-DD or 'Sin Fecha'
    
    const draggedTask = tasks.find(t => t.id === taskId);
    const currentDateKey = draggedTask.due_date ? 
      new Date(draggedTask.due_date).getFullYear() + '-' + String(new Date(draggedTask.due_date).getMonth() + 1).padStart(2, '0') + '-' + String(new Date(draggedTask.due_date).getDate()).padStart(2, '0') 
      : 'Sin Fecha';
    
    if (currentDateKey === targetDateKey) return; // Dropped in the same column

    let newDueDateIso = new Date().toISOString();
    
    if (targetDateKey !== 'Sin Fecha') {
      const parts = targetDateKey.split('-');
      if (parts.length === 3) {
        // Construct a Date at noon to avoid timezone shifting issues
        const targetDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        newDueDateIso = targetDate.toISOString();
      }
    }

    // Update locally immediately for snappy UI
    setTasks(tasks.map(t => t.id === taskId ? { ...t, due_date: newDueDateIso } : t));

    // Update DB
    await supabase.from('home_tasks').update({ due_date: newDueDateIso }).eq('id', taskId);
  }

  // Filtrado
  const filteredTasks = tasks.filter(t => {
    if (filterMode === 'all') return true;
    if (!t.assigned_to) return false;
    return t.assigned_to.toLowerCase() === filterMode.toLowerCase();
  });

  // Generar columnas base (Próximos 7 días)
  const baseColumns = {};
  const today = new Date();
  
  const getDateKey = (dateObj) => {
    return dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
  }

  for(let i=0; i<7; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    baseColumns[getDateKey(d)] = [];
  }

  // Agrupar tareas filtradas por fecha
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    let key = 'Sin Fecha';
    if (task.due_date) {
      const d = new Date(task.due_date);
      key = getDateKey(d);
    }
    
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, { ...baseColumns });

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="flex justify-between items-center">
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Tareas</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={handleDeleteAll} 
              className="icon-btn danger" 
              title="Borrar Todo"
            >
              <Trash2 size={20}/>
            </button>
            <button 
              onClick={handleReshuffle} 
              disabled={isGenerating}
              className="icon-btn" 
              title="Sugerir Otra Distribución"
            >
              <Shuffle size={20}/>
            </button>
            <button 
              onClick={handleGenerateWeekly} 
              disabled={isGenerating}
              className="btn" 
              style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)', color: 'white', border: 'none', padding: '0.5rem 1rem' }}
            >
              {isGenerating ? '...' : <><Sparkles size={18}/> <span className="hide-on-mobile" style={{ marginLeft: '4px' }}>Generar</span></>}
            </button>
          </div>
        </div>
      </div>

      <div className="tabs-container hide-scrollbar" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px', marginBottom: '1.5rem' }}>
        <button 
          className={`tab ${filterMode === 'all' ? 'active' : ''}`}
          onClick={() => setFilterMode('all')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <div className="flex items-center" style={{ gap: '0.5rem' }}><Users size={16}/> Todos</div>
        </button>
        <button 
          className={`tab ${filterMode === 'Roberto' ? 'active' : ''}`}
          onClick={() => setFilterMode('Roberto')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <div className="flex items-center" style={{ gap: '0.5rem' }}><User size={16}/> Roberto</div>
        </button>
        <button 
          className={`tab ${filterMode === 'Ignacio' ? 'active' : ''}`}
          onClick={() => setFilterMode('Ignacio')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <div className="flex items-center" style={{ gap: '0.5rem' }}><User size={16}/> Ignacio</div>
        </button>
        <button 
          className={`tab ${filterMode === 'Dancko' ? 'active' : ''}`}
          onClick={() => setFilterMode('Dancko')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <div className="flex items-center" style={{ gap: '0.5rem' }}><User size={16}/> Dancko</div>
        </button>
      </div>
      
      <div className="glass-panel" style={{ padding: '0.75rem', marginBottom: '2rem', borderRadius: '24px' }}>
        <form onSubmit={addTask} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input 
              className="form-input" 
              placeholder="Nueva tarea rápida..." 
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              required
              style={{ marginBottom: 0, borderRadius: '16px', background: 'transparent', border: 'none' }}
            />
          </div>
          <select 
            className="form-input" 
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            style={{ marginBottom: 0, width: '100px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '0 0.5rem' }}
          >
            <option value="">Libre</option>
            <option value="Roberto">Roberto</option>
            <option value="Ignacio">Ignacio</option>
            <option value="Dancko">Dancko</option>
          </select>
          <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={20} />
          </button>
        </form>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {Object.entries(groupedTasks).map(([dateKey, dateTasks]) => {
            let title = dateKey;
            if (dateKey !== 'Sin Fecha') {
              const parts = dateKey.split('-');
              const d = new Date(parts[0], parts[1] - 1, parts[2]);
              
              const todayKey = getDateKey(new Date());
              
              if (dateKey === todayKey) {
                title = 'Hoy';
              } else {
                const weekday = d.toLocaleDateString('es-ES', { weekday: 'long' });
                title = weekday.charAt(0).toUpperCase() + weekday.slice(1) + ' ' + d.getDate();
              }
            }
            
            return (
              <KanbanColumn 
                key={dateKey} 
                id={dateKey}
                title={title} 
                tasks={dateTasks} 
                toggleTask={toggleTask} 
                deleteTask={deleteTask} 
              />
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
