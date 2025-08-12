// lib/validators.ts
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
          if (taskId && !taskIds.has(taskId)) {
            this.addError('client', 'RequestedTaskIDs', index, `Unknown task ID: ${taskId}`);
          }
        });
      }
      
      // Improved JSON validation
      if (client.AttributesJSON && client.AttributesJSON.trim()) {
        try {
          // Try to parse as JSON first
          JSON.parse(client.AttributesJSON);
        } catch {
          // If it fails, check if it's a simple text string that should be converted
          if (client.AttributesJSON.includes('{') || client.AttributesJSON.includes('[')) {
            this.addError('client', 'AttributesJSON', index, 'Invalid JSON format - contains JSON characters but is malformed');
          } else {
            // If it's just text, suggest conversion to valid JSON
            this.addError('client', 'AttributesJSON', index, 'Non-JSON text detected - should be converted to valid JSON format', 'warning');
          }
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
      if (worker.AvailableSlots && worker.AvailableSlots.trim()) {
        try {
          const slots = JSON.parse(worker.AvailableSlots);
          if (!Array.isArray(slots)) {
            this.addError('worker', 'AvailableSlots', index, 'AvailableSlots must be an array format');
          } else if (!slots.every(slot => typeof slot === 'number' && slot > 0)) {
            this.addError('worker', 'AvailableSlots', index, 'AvailableSlots must contain only positive numbers');
          } else {
            // Check if worker is overloaded
            if (slots.length > worker.MaxLoadPerPhase) {
              this.addError('worker', 'MaxLoadPerPhase', index, 'Worker has more available slots than max load per phase', 'warning');
            }
          }
        } catch {
          // Try to detect comma-separated format
          if (worker.AvailableSlots.includes(',')) {
            this.addError('worker', 'AvailableSlots', index, 'Comma-separated slots detected - should be JSON array format like [1,2,3]', 'warning');
          } else {
            this.addError('worker', 'AvailableSlots', index, 'Invalid AvailableSlots format - must be valid JSON array like [1,2,3]');
          }
        }
      }
      
      // Max load validation
      if (worker.MaxLoadPerPhase < 1) {
        this.addError('worker', 'MaxLoadPerPhase', index, 'MaxLoadPerPhase must be at least 1');
      }
      
      // Qualification level validation
      if (worker.QualificationLevel < 1 || worker.QualificationLevel > 10) {
        this.addError('worker', 'QualificationLevel', index, 'QualificationLevel should be between 1 and 10', 'warning');
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
          if (skill && !allWorkerSkills.has(skill)) {
            this.addError('task', 'RequiredSkills', index, `No worker has required skill: ${skill}`, 'warning');
          }
        });
      }
      
      // Improved preferred phases validation
      if (task.PreferredPhases && task.PreferredPhases.trim()) {
  const phases = task.PreferredPhases.trim();
  let isValid = false;
  
  try {
    // Handle bracket notation with spaces like "[2 - 4]" or "[1-3]"
    if (phases.startsWith('[') && phases.endsWith(']')) {
      const innerContent = phases.slice(1, -1).trim();
      
      if (innerContent.includes('-')) {
        // Range format inside brackets: [2 - 4] or [1-3]
        const parts = innerContent.split('-').map(p => p.trim());
        if (parts.length === 2) {
          const start = parseInt(parts[0]);
          const end = parseInt(parts[1]);
          if (!isNaN(start) && !isNaN(end) && start > 0 && end > 0 && start <= end) {
            isValid = true;
          } else {
            this.addError('task', 'PreferredPhases', index, `Invalid range values in brackets: [${start} - ${end}]. Both values must be positive and start ≤ end`);
          }
        } else {
          this.addError('task', 'PreferredPhases', index, `Invalid bracket range format: ${phases}. Use format [1-3] or [2 - 4]`);
        }
      } else {
        // Try to parse as JSON array
        try {
          const parsedPhases = JSON.parse(phases);
          if (Array.isArray(parsedPhases)) {
            if (parsedPhases.every(p => typeof p === 'number' && p > 0)) {
              isValid = true;
            } else {
              this.addError('task', 'PreferredPhases', index, 'PreferredPhases array must contain positive numbers');
            }
          } else {
            this.addError('task', 'PreferredPhases', index, 'PreferredPhases must be an array when using bracket notation');
          }
        } catch {
          this.addError('task', 'PreferredPhases', index, `Invalid array format in brackets: ${phases}`);
        }
      }
    }
    // Handle simple range format like "1-3" (without brackets)
    else if (phases.includes('-') && !phases.includes('[') && !phases.includes(']')) {
      const parts = phases.split('-').map(p => p.trim());
      if (parts.length === 2) {
        const start = parseInt(parts[0]);
        const end = parseInt(parts[1]);
        if (!isNaN(start) && !isNaN(end) && start > 0 && end > 0 && start <= end) {
          isValid = true;
        } else {
          this.addError('task', 'PreferredPhases', index, `Invalid phase range: ${phases}. Expected format: "1-3"`);
        }
      } else {
        this.addError('task', 'PreferredPhases', index, `Invalid phase range format: ${phases}. Use format "1-3"`);
      }
    }
    // Handle comma-separated format
    else if (phases.includes(',')) {
      const phaseNumbers = phases.split(',').map(p => parseInt(p.trim()));
      if (phaseNumbers.every(p => !isNaN(p) && p > 0)) {
        isValid = true;
        // Just a suggestion, not an error
        this.addError('task', 'PreferredPhases', index, `Comma-separated phases detected: ${phases}. Consider using array format [${phaseNumbers.join(', ')}]`, 'warning');
      } else {
        this.addError('task', 'PreferredPhases', index, 'All phases must be positive numbers');
      }
    }
    // Handle single number
    else if (/^\d+$/.test(phases)) {
      const singlePhase = parseInt(phases);
      if (!isNaN(singlePhase) && singlePhase > 0) {
        isValid = true;
        // Just a suggestion, not an error
        this.addError('task', 'PreferredPhases', index, `Single phase detected: ${phases}. Consider using array format [${singlePhase}]`, 'warning');
      } else {
        this.addError('task', 'PreferredPhases', index, `Invalid phase number: ${phases}`);
      }
    }
    else {
      // Unknown format
      this.addError('task', 'PreferredPhases', index, `Unrecognized PreferredPhases format: ${phases}. Use formats like: "1-3", "[1-3]", "[1, 2, 3]", or "2"`);
    }
  } catch (error) {
    this.addError('task', 'PreferredPhases', index, `Error parsing PreferredPhases: ${task.PreferredPhases}`);
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
          if (skill) {
            const qualifiedWorkers = workers.filter(worker => 
              worker.Skills && worker.Skills.toLowerCase().includes(skill.toLowerCase())
            );
            
            if (qualifiedWorkers.length === 0) {
              this.addError('task', 'RequiredSkills', taskIndex, `No worker available with skill: ${skill}`, 'warning');
            }
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
              if (typeof phase === 'number' && phase > 0) {
                phaseCapacity.set(phase, (phaseCapacity.get(phase) || 0) + worker.MaxLoadPerPhase);
              }
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
          const phases = task.PreferredPhases.trim();
          let phaseNumbers: number[] = [];
          
          if (phases.includes('-')) {
            const [start, end] = phases.split('-').map(n => parseInt(n.trim()));
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) {
                phaseNumbers.push(i);
              }
            }
          } else if (phases.startsWith('[') && phases.endsWith(']')) {
            const parsedPhases = JSON.parse(phases);
            if (Array.isArray(parsedPhases)) {
              phaseNumbers = parsedPhases.filter(p => typeof p === 'number' && p > 0);
            }
          } else if (phases.includes(',')) {
            phaseNumbers = phases.split(',')
              .map(p => parseInt(p.trim()))
              .filter(p => !isNaN(p) && p > 0);
          } else if (/^\d+$/.test(phases)) {
            const singlePhase = parseInt(phases);
            if (!isNaN(singlePhase) && singlePhase > 0) {
              phaseNumbers = [singlePhase];
            }
          }
          
          phaseNumbers.forEach(phase => {
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
          id: `phase-${phase}-saturation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        const requestedTasks = client.RequestedTaskIDs.split(',').map(id => id.trim()).filter(id => id);
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
            id: `circular-${taskId}-${relatedTask}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            entity: 'task',
            field: 'RequestedTaskIDs',
            row: -1,
            message: `Potential circular dependency detected between ${taskId} and ${relatedTask}`,
            severity: 'warning'
          });
        }
      });
    });
    
    // Log analysis for debugging (removes unused parameter warnings)
    if (workers.length > 0 && tasks.length > 0) {
      console.debug(`Analyzed ${workers.length} workers and ${tasks.length} tasks for dependencies`);
    }
  }
}