// src/lib/taskGenerator.js

const USERS = {
  ROBERTO: 'Roberto',
  IGNACIO: 'Ignacio',
  DANCKO: 'Dancko'
};

const TASKS_CATALOG = [
  { id: 'loza', title: 'Lavar loza', frequency: 'diario', weight: 2, type: 'corta' },
  { id: 'cama', title: 'Hacer la cama', frequency: 'diario', weight: 2, type: 'corta' },
  { id: 'cena', title: 'Hacer cena y dejar comida', frequency: 'diario', weight: 5, type: 'pesada' },
  { id: 'bano', title: 'Lavar baño', frequency: 'cada_3_dias', weight: 6, type: 'pesada' },
  { id: 'habitacion', title: 'Ordenar la habitación', frequency: 'dia_por_medio', weight: 4, type: 'media' },
  { id: 'ropa', title: 'Lavar ropa de todos', frequency: 'dia_por_medio', weight: 4, type: 'media' },
  { id: 'basura', title: 'Botar la basura', frequency: 'dia_por_medio', weight: 1, type: 'corta' },
  { id: 'cocina', title: 'Ordenar cocina profundo', frequency: 'semanal', weight: 7, type: 'pesada' },
  { id: 'living', title: 'Ordenar living profundo', frequency: 'semanal', weight: 6, type: 'pesada' },
];

// Dancko's cycle reference: Sept 10, 2026 was Day 0 (Salió a las 9 AM)
// Cycle: 0: Salio 9AM, 1: Libre, 2: 8AM-8PM, 3: 8PM-8AM
const getDanckoCycleDay = (targetDate) => {
  const referenceDate = new Date(2026, 8, 10); // Month is 0-indexed in JS (8 = Sept)
  referenceDate.setHours(0,0,0,0);
  
  const target = new Date(targetDate);
  target.setHours(0,0,0,0);
  
  const diffTime = Math.abs(target - referenceDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays % 4; 
};

const getAvailability = (user, date) => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday...
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (user === USERS.ROBERTO) {
    // Roberto: WFH Mon-Fri. Great for short tasks.
    return { short: 1.5, medium: 1.0, heavy: 1.0 };
  }
  
  if (user === USERS.IGNACIO) {
    // Ignacio: Office Mon-Fri. Better for heavy tasks on weekends.
    if (isWeekend) return { short: 1.0, medium: 1.5, heavy: 1.5 };
    return { short: 0.5, medium: 1.0, heavy: 0.8 };
  }
  
  if (user === USERS.DANCKO) {
    const cycle = getDanckoCycleDay(date);
    switch(cycle) {
      case 0: return { short: 1.0, medium: 1.0, heavy: 0.5 }; // Salió 9AM, needs rest
      case 1: return { short: 1.0, medium: 1.5, heavy: 2.0 }; // Libre
      case 2: return { short: 0.2, medium: 0.2, heavy: 0.1 }; // 12h day shift
      case 3: return { short: 0.8, medium: 0.5, heavy: 0.2 }; // Night shift (free during day but sleeps)
    }
  }
  
  return { short: 1, medium: 1, heavy: 1 };
};

export const generateWeeklyTasks = (startDate) => {
  const generatedTasks = [];
  const start = new Date(startDate);
  
  // Track accumulated workload (points) to ensure fairness
  const workload = {
    [USERS.ROBERTO]: 0,
    [USERS.IGNACIO]: 0,
    [USERS.DANCKO]: 0
  };

  // Assign a task to the best suited person with the lowest current workload
  const assignTask = (taskDef, date) => {
    let bestUser = null;
    let bestScore = -9999;

    // Shuffle users to break ties randomly
    const shuffledUsers = Object.values(USERS).sort(() => Math.random() - 0.5);

    shuffledUsers.forEach(user => {
      const avail = getAvailability(user, date);
      let availMultiplier = 1;
      
      if (taskDef.type === 'corta') availMultiplier = avail.short;
      else if (taskDef.type === 'media') availMultiplier = avail.medium;
      else if (taskDef.type === 'pesada') availMultiplier = avail.heavy;

      // Score formula: Availability is key. 
      // We also heavily penalize if someone has done too much work compared to others.
      const currentLoad = workload[user];
      const maxLoad = Math.max(...Object.values(workload));
      const loadPenalty = maxLoad - currentLoad; // Higher difference = better score for this user

      const score = (availMultiplier * 10) + loadPenalty;
      
      // Añadimos un factor de "suerte" o aleatoriedad (-1.5 a +1.5) para que cada sugerencia sea diferente
      const jitter = (Math.random() * 3) - 1.5;
      const finalScore = score + jitter;

      // Hard constraint: If availability is too low (e.g. Dancko 12h shift for heavy task)
      if (availMultiplier < 0.3 && taskDef.type === 'pesada') return;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestUser = user;
      }
    });

    // Fallback if no one is "best" (e.g., everyone busy)
    if (!bestUser) {
      // Just pick the one with lowest workload
      bestUser = Object.keys(workload).reduce((a, b) => workload[a] < workload[b] ? a : b);
    }

    workload[bestUser] += taskDef.weight;
    
    generatedTasks.push({
      title: taskDef.title,
      description: `Generado automáticamente. (Peso: ${taskDef.weight})`,
      assigned_to: bestUser,
      due_date: new Date(date).toISOString(),
      status: 'pending'
    });
  };

  // Generate 7 days of tasks
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);

    TASKS_CATALOG.forEach(task => {
      let shouldAssignToday = false;

      if (task.frequency === 'diario') shouldAssignToday = true;
      if (task.frequency === 'dia_por_medio' && i % 2 === 0) shouldAssignToday = true;
      if (task.frequency === 'cada_3_dias' && i % 3 === 0) shouldAssignToday = true;
      
      // Semanal tasks: assign one on Saturday (i=5) and one on Sunday (i=6) for better distribution
      if (task.frequency === 'semanal') {
        if (task.id === 'cocina' && i === 5) shouldAssignToday = true; // Saturday
        if (task.id === 'living' && i === 6) shouldAssignToday = true; // Sunday
      }

      if (shouldAssignToday) {
        assignTask(task, currentDate);
      }
    });
  }

  return generatedTasks;
};
