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

  private addError(entity: 'client' | 'worker' | 'task', field: string, row: number, message: string, severity: 'error' | 'warning' = 'error') {
    this.errors.push({
      id: `${entity}-${field}-${row}-${Date.now()}`,
      entity,
      field,
      row,
      message,
      severity
    });
  }

  private validateWorkers(workers: Worker[]) {
    const workerIds = new Set();
    
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
        } catch (e) {
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

  private validateTasks(tasks: Task[], workers: Worker[]) {
    const taskIds = new Set();
    const allWorkerSkills = new Set();
    
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
        } catch (e) {
          this.addError('task', 'PreferredPhases', index, 'Invalid PreferredPhases format');
        }
      }
    });
  }

  private validateCrossReferences(clients: Client[], workers: Worker[], tasks: Task[]) {
    // Check skill coverage
    const taskSkillCoverage = new Map();
    
    tasks.forEach(task => {
      if (task.RequiredSkills) {
        const skills = task.RequiredSkills.split(',').map(s => s.trim());
        skills.forEach(skill => {
          const qualifiedWorkers = workers.filter(worker => 
            worker.Skills && worker.Skills.toLowerCase().includes(skill.toLowerCase())
          );
          
          if (qualifiedWorkers.length === 0) {
            taskSkillCoverage.set(task.TaskID, skill);
          }
        });
      }
    });
    
    // Check phase slot saturation
    this.validatePhaseSlotSaturation(workers, tasks);
    
    // Check for circular dependencies in co-run groups
    this.detectCircularDependencies(tasks);
  }

  private validatePhaseSlotSaturation(workers: Worker[], tasks: Task[]) {
    const phaseCapacity = new Map<number, number>();
    
    // Calculate total capacity per phase
    workers.forEach(worker => {
      if (worker.AvailableSlots) {
        try {
          const slots = JSON.parse(worker.AvailableSlots);
          slots.forEach((phase: number) => {
            phaseCapacity.set(phase, (phaseCapacity.get(phase) || 0) + worker.MaxLoadPerPhase);
          });
        } catch (e) {
          // Skip invalid slots
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
            for (let i = start; i <= end; i++) {
              phases.push(i);
            }
          } else {
            phases = JSON.parse(task.PreferredPhases);
          }
          
          phases.forEach(phase => {
            phaseDemand.set(phase, (phaseDemand.get(phase) || 0) + task.Duration);
          });
        } catch (e) {
          // Skip invalid phases
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

  private detectCircularDependencies(tasks: Task[]) {
    // This would detect circular co-run dependencies
    // Implementation depends on how co-run rules are stored
    // For now, we'll add a placeholder
    const coRunGroups = new Map();
    // TODO: Implement circular dependency detection
  }
}