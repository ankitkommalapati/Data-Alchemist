export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string;
  GroupTag: string;
  AttributesJSON: string;
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string;
  AvailableSlots: string;
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: number;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;
  RequiredSkills: string;
  PreferredPhases: string;
  MaxConcurrent: number;
}

export interface ValidationError {
  id: string;
  entity: 'client' | 'worker' | 'task';
  field: string;
  row: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface BusinessRule {
  id: string;
  type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface FilteredResults {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
}

// Type guards for better type safety
export const isClient = (data: unknown): data is Client => {
  return typeof data === 'object' && data !== null && 'ClientID' in data;
};

export const isWorker = (data: unknown): data is Worker => {
  return typeof data === 'object' && data !== null && 'WorkerID' in data;
};

export const isTask = (data: unknown): data is Task => {
  return typeof data === 'object' && data !== null && 'TaskID' in data;
};