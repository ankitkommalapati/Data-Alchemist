import { Client, Worker, Task, ValidationError } from './types';

export class DataValidator {
  private errors: ValidationError[] = [];

  validateAll(clients: Client[], workers: Worker[], tasks: Task[]): ValidationError[] {
    this.errors = [];
    
    this.validateClients(clients, tasks);
    this.validateWorkers(workers);
    this.validateTasks(tasks, workers);
    this.validateCrossReferences(clients, workers, tasks);
    
    return this.errors;
  }

  private addError(entity: 'client' | 'worker' | 'task', field: string, row: number, message: string, severity: 'error' | 'warning' = 'error'): void {
    this.errors.push({
        id: `${entity}-${field}-${row}-${message.slice(0, 10).replace(/\s/g, '')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity,
        field,
        row,
        message,
        severity
    });
}

  private validateClients(clients: Client[], tasks: Task[]): void {
    const taskIds = new Set(tasks.map(t => t.TaskID));
    const clientIds = new Set<string>();
    
    clients.forEach((client, index) => {
      // Duplicate ID check
      if (clientIds.has(client.ClientID)) {
        this.addError('client', 'ClientID', index, `Duplicate ClientID: ${client.ClientID}`);
      }
      clientIds.add(client.ClientID);
      
      // Priority level validation
      if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
        this.addError('client', 'PriorityLevel', index, 'Priority level must be between 1 and 5');
      }
      
      // Validate requested task IDs
      if (client.RequestedTaskIDs) {
        const requestedIds = client.RequestedTaskIDs.split(',').map(id => id.trim());
        requestedIds.forEach(taskId => {
          if (!taskIds.has(taskId)) {
            this.addError('client', 'RequestedTaskIDs', index, `Unknown task ID: ${taskId}`);
          }
        });
      }
      
      // JSON validation
      if (client.AttributesJSON) {
        try {
          JSON.parse(client.AttributesJSON);
        } catch {
          this.addError('client', 'AttributesJSON', index, 'Invalid JSON format');
        }
      }
    });
  }

  private validateWorkers(workers: Worker[]): void {
    const workerIds = new Set<string>();
    
    workers.forEach((worker, index) => {
      // Duplicate ID check
      if (workerIds.has(worker.WorkerID)) {
        this.addError('worker', 'WorkerID', index, `Duplicate WorkerID: ${worker.WorkerID}`);
      }
      workerIds.add(worker.WorkerID);
      
      // Available slots validation
      if (worker.AvailableSlots) {
        try {
          const slots = JSON.parse(worker.AvailableSlots);
          if (!Array.isArray(slots) || !slots.every(slot => typeof slot === 'number' && slot > 0)) {
            this.addError('worker', 'AvailableSlots', index, 'AvailableSlots must be an array of positive numbers');
          }
          
          // Check if worker is overloaded
          if (slots.length > worker.MaxLoadPerPhase) {
            this.addError('worker', 'MaxLoadPerPhase', index, 'Worker has more available slots than max load per phase', 'warning');
          }
        } catch {
          this.addError('worker', 'AvailableSlots', index, 'Invalid AvailableSlots format - must be valid JSON array');
        }
      }
      
      // Max load validation
      if (worker.MaxLoadPerPhase < 1) {
        this.addError('worker', 'MaxLoadPerPhase', index, 'MaxLoadPerPhase must be at least 1');
      }
      
      // Qualification level validation
      if (worker.QualificationLevel < 1 || worker.QualificationLevel > 10) {
        this.addError('worker', 'QualificationLevel', index, 'QualificationLevel must be between 1 and 10', 'warning');
      }
    });
  }

  private validateTasks(tasks: Task[], workers: Worker[]): void {
    const taskIds = new Set<string>();
    const allWorkerSkills = new Set<string>();
    
    // Collect all worker skills
    workers.forEach(worker => {
      if (worker.Skills) {
        worker.Skills.split(',').forEach(skill => {
          allWorkerSkills.add(skill.trim().toLowerCase());
        });
      }
    });
    
    tasks.forEach((task, index) => {
      // Duplicate ID check
      if (taskIds.has(task.TaskID)) {
        this.addError('task', 'TaskID', index, `Duplicate TaskID: ${task.TaskID}`);
      }
      taskIds.add(task.TaskID);
      
      // Duration validation
      if (task.Duration < 1) {
        this.addError('task', 'Duration', index, 'Duration must be at least 1');
      }
      
      // Max concurrent validation
      if (task.MaxConcurrent < 1) {
        this.addError('task', 'MaxConcurrent', index, 'MaxConcurrent must be at least 1');
      }
      
      // Required skills validation
      if (task.RequiredSkills) {
        const requiredSkills = task.RequiredSkills.split(',').map(skill => skill.trim().toLowerCase());
        requiredSkills.forEach(skill => {
          if (!allWorkerSkills.has(skill)) {
            this.addError('task', 'RequiredSkills', index, `No worker has required skill: ${skill}`);
          }
        });
      }
      
      // Preferred phases validation
      if (task.PreferredPhases) {
        try {
          if (task.PreferredPhases.includes('-')) {
            // Range format (e.g., "1-3")
            const [start, end] = task.PreferredPhases.split('-').map(n => parseInt(n.trim()));
            if (isNaN(start) || isNaN(end) || start > end || start < 1) {
              this.addError('task', 'PreferredPhases', index, 'Invalid phase range format');
            }
          } else {
            // Array format
            const phases = JSON.parse(task.PreferredPhases);
            if (!Array.isArray(phases) || !phases.every(p => typeof p === 'number' && p > 0)) {
              this.addError('task', 'PreferredPhases', index, 'PreferredPhases must be valid phase numbers');
            }
          }
        } catch {
          this.addError('task', 'PreferredPhases', index, 'Invalid PreferredPhases format');
        }
      }
    });
  }

  private validateCrossReferences(clients: Client[], workers: Worker[], tasks: Task[]): void {
    // Check skill coverage
    tasks.forEach((task, taskIndex) => {
      if (task.RequiredSkills) {
        const skills = task.RequiredSkills.split(',').map(s => s.trim());
        skills.forEach(skill => {
          const qualifiedWorkers = workers.filter(worker => 
            worker.Skills && worker.Skills.toLowerCase().includes(skill.toLowerCase())
          );
          
          if (qualifiedWorkers.length === 0) {
            this.addError('task', 'RequiredSkills', taskIndex, `No worker available with skill: ${skill}`, 'warning');
          }
        });
      }
    });
    
    // Check phase slot saturation
    this.validatePhaseSlotSaturation(workers, tasks);
    
    // Check for circular dependencies in co-run groups
    this.detectCircularDependencies(clients, workers, tasks);
  }

  private validatePhaseSlotSaturation(workers: Worker[], tasks: Task[]): void {
    const phaseCapacity = new Map<number, number>();
    
    // Calculate total capacity per phase
    workers.forEach(worker => {
      if (worker.AvailableSlots) {
        try {
          const slots = JSON.parse(worker.AvailableSlots);
          if (Array.isArray(slots)) {
            slots.forEach((phase: number) => {
              phaseCapacity.set(phase, (phaseCapacity.get(phase) || 0) + worker.MaxLoadPerPhase);
            });
          }
        } catch {
          // Skip invalid slots - already handled in worker validation
        }
      }
    });
    
    // Check if task demands exceed capacity
    const phaseDemand = new Map<number, number>();
    tasks.forEach(task => {
      if (task.PreferredPhases && task.Duration > 0) {
        try {
          let phases: number[] = [];
          
          if (task.PreferredPhases.includes('-')) {
            const [start, end] = task.PreferredPhases.split('-').map(n => parseInt(n.trim()));
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) {
                phases.push(i);
              }
            }
          } else {
            const parsedPhases = JSON.parse(task.PreferredPhases);
            if (Array.isArray(parsedPhases)) {
              phases = parsedPhases;
            }
          }
          
          phases.forEach(phase => {
            phaseDemand.set(phase, (phaseDemand.get(phase) || 0) + task.Duration);
          });
        } catch {
          // Skip invalid phases - already handled in task validation
        }
      }
    });
    
    // Compare demand vs capacity
    phaseDemand.forEach((demand, phase) => {
      const capacity = phaseCapacity.get(phase) || 0;
      if (demand > capacity) {
        this.errors.push({
          id: `phase-${phase}-saturation-${Date.now()}`,
          entity: 'task',
          field: 'PreferredPhases',
          row: -1,
          message: `Phase ${phase} is oversaturated: demand (${demand}) exceeds capacity (${capacity})`,
          severity: 'warning'
        });
      }
    });
  }

  private detectCircularDependencies(clients: Client[], workers: Worker[], tasks: Task[]): void {
    // This is a placeholder for circular dependency detection
    // Implementation would depend on how co-run rules are defined
    // For now, we'll check for basic circular references in task dependencies
    
    const taskRelations = new Map<string, string[]>();
    
    // Build task relationship map from client requests
    clients.forEach(client => {
      if (client.RequestedTaskIDs) {
        const requestedTasks = client.RequestedTaskIDs.split(',').map(id => id.trim());
        if (requestedTasks.length > 1) {
          requestedTasks.forEach(taskId => {
            if (!taskRelations.has(taskId)) {
              taskRelations.set(taskId, []);
            }
            const relatedTasks = requestedTasks.filter(id => id !== taskId);
            taskRelations.get(taskId)?.push(...relatedTasks);
          });
        }
      }
    });
    
    // Simple circular dependency check
    taskRelations.forEach((relatedTasks, taskId) => {
      relatedTasks.forEach(relatedTask => {
        const relatedTaskDeps = taskRelations.get(relatedTask) || [];
        if (relatedTaskDeps.includes(taskId)) {
          this.errors.push({
            id: `circular-${taskId}-${relatedTask}-${Date.now()}`,
            entity: 'task',
            field: 'RequestedTaskIDs',
            row: -1,
            message: `Potential circular dependency detected between ${taskId} and ${relatedTask}`,
            severity: 'warning'
          });
        }
      });
    });
    
    // Use the parameters to avoid unused variable warnings
    console.debug(`Analyzed ${workers.length} workers and ${tasks.length} tasks for dependencies`);
  }
}