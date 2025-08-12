'use client';

import { useState } from 'react';
import { Wrench, CheckCircle } from 'lucide-react';
import { Client, Worker, Task } from '@/lib/types';

interface AutoFixPanelProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  onDataFixed: (type: 'clients' | 'workers' | 'tasks', data: Client[] | Worker[] | Task[]) => void;
  onFixComplete: () => void; // New prop to trigger re-validation
}

export function AutoFixPanel({ clients, workers, tasks, onDataFixed, onFixComplete }: AutoFixPanelProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResults, setFixResults] = useState<string[]>([]);

  const autoFixData = async () => {
    setIsFixing(true);
    const results: string[] = [];

    // Get all task IDs for reference validation
    const allTaskIds = new Set(tasks.map(task => task.TaskID));

    // Fix clients
    const fixedClients = clients.map(client => {
      const fixed = { ...client };
      
      // Fix AttributesJSON
      if (fixed.AttributesJSON && fixed.AttributesJSON.trim()) {
        try {
          JSON.parse(fixed.AttributesJSON);
        } catch {
          // If it's not valid JSON, convert to a JSON string
          if (!fixed.AttributesJSON.includes('{') && !fixed.AttributesJSON.includes('[')) {
            fixed.AttributesJSON = JSON.stringify({ message: fixed.AttributesJSON });
            results.push(`Fixed Client ${client.ClientID}: Converted text to JSON`);
          } else {
            // Try to fix common JSON issues
            const fixedJson = fixed.AttributesJSON
              .replace(/'/g, '"') // Replace single quotes with double quotes
              .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to unquoted keys
              .replace(/:\s*([^",$$$${}]+)(?=[,}])/g, ':"$1"'); // Add quotes to unquoted string values
            
            try {
              JSON.parse(fixedJson);
              fixed.AttributesJSON = fixedJson;
              results.push(`Fixed Client ${client.ClientID}: Repaired malformed JSON`);
            } catch {
              // If still can't fix, wrap the whole thing as a message
              fixed.AttributesJSON = JSON.stringify({ originalData: fixed.AttributesJSON });
              results.push(`Fixed Client ${client.ClientID}: Wrapped invalid JSON as data object`);
            }
          }
        }
      }

      // Clean up RequestedTaskIDs - remove references to non-existent tasks
      if (fixed.RequestedTaskIDs) {
        const requestedIds = fixed.RequestedTaskIDs.split(',').map(id => id.trim());
        const validIds = requestedIds.filter(id => id && allTaskIds.has(id));
        
        if (validIds.length !== requestedIds.length) {
          const removedIds = requestedIds.filter(id => id && !allTaskIds.has(id));
          fixed.RequestedTaskIDs = validIds.join(', ');
          results.push(`Fixed Client ${client.ClientID}: Removed invalid task IDs: ${removedIds.join(', ')}`);
        }
      }
      
      return fixed;
    });

    // Fix tasks - handle PreferredPhases format issues
    const fixedTasks = tasks.map(task => {
      const fixed = { ...task };
      
      // Fix PreferredPhases
      if (fixed.PreferredPhases && fixed.PreferredPhases.trim()) {
  const phases = fixed.PreferredPhases.trim();
  
  // Handle bracket notation with spaces like "[2 - 4]" or "[1 - 3]"
  if (phases.startsWith('[') && phases.endsWith(']')) {
    const innerContent = phases.slice(1, -1).trim();
    
    if (innerContent.includes('-')) {
      // Range format inside brackets: [2 - 4] or [1-3]
      const parts = innerContent.split('-').map(p => p.trim());
      if (parts.length === 2) {
        const start = parseInt(parts[0]);
        const end = parseInt(parts[1]);
        if (!isNaN(start) && !isNaN(end) && start <= end && start > 0) {
          const phaseArray = [];
          for (let i = start; i <= end; i++) {
            phaseArray.push(i);
          }
          fixed.PreferredPhases = JSON.stringify(phaseArray);
          results.push(`Fixed Task ${task.TaskID}: Converted bracket range [${start} - ${end}] to array`);
        }
      }
    } else {
      // Try to parse as existing array - might just need cleanup
      try {
        const parsed = JSON.parse(phases);
        if (Array.isArray(parsed)) {
          // It's already a valid array, no changes needed
          results.push(`Task ${task.TaskID}: PreferredPhases already in valid array format`);
        }
      } catch {
        // If it can't parse, try to convert comma-separated values inside brackets
        const values = innerContent.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0);
        if (values.length > 0) {
          fixed.PreferredPhases = JSON.stringify(values);
          results.push(`Fixed Task ${task.TaskID}: Converted bracket content to valid array`);
        }
      }
    }
  }
  // Handle simple range notation like "2-4" or "1-3"
  else if (phases.includes('-') && !phases.includes('[')) {
    const parts = phases.split('-').map(p => p.trim());
    if (parts.length === 2) {
      const start = parseInt(parts[0]);
      const end = parseInt(parts[1]);
      if (!isNaN(start) && !isNaN(end) && start <= end && start > 0) {
        const phaseArray = [];
        for (let i = start; i <= end; i++) {
          phaseArray.push(i);
        }
        fixed.PreferredPhases = JSON.stringify(phaseArray);
        results.push(`Fixed Task ${task.TaskID}: Converted range ${start}-${end} to array`);
      }
    }
  }
  // Handle comma-separated values
  else if (phases.includes(',') && !phases.startsWith('[')) {
    const phaseNumbers = phases.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p) && p > 0);
    if (phaseNumbers.length > 0) {
      fixed.PreferredPhases = JSON.stringify(phaseNumbers);
      results.push(`Fixed Task ${task.TaskID}: Converted comma-separated phases to array`);
    }
  }
  // Handle single number
  else if (/^\d+$/.test(phases)) {
    fixed.PreferredPhases = JSON.stringify([parseInt(phases)]);
    results.push(`Fixed Task ${task.TaskID}: Converted single phase to array`);
  }
}      
      return fixed;
    });

    // Fix workers (AvailableSlots format)
    const fixedWorkers = workers.map(worker => {
      const fixed = { ...worker };
      
      if (fixed.AvailableSlots && fixed.AvailableSlots.trim()) {
        try {
          JSON.parse(fixed.AvailableSlots);
        } catch {
          // Try to convert comma-separated or other formats
          const slots = fixed.AvailableSlots.trim();
          if (slots.includes(',')) {
            const slotNumbers = slots.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s) && s > 0);
            if (slotNumbers.length > 0) {
              fixed.AvailableSlots = JSON.stringify(slotNumbers);
              results.push(`Fixed Worker ${worker.WorkerID}: Converted slots to array format`);
            }
          } else if (/^\d+$/.test(slots)) {
            // Single number
            fixed.AvailableSlots = JSON.stringify([parseInt(slots)]);
            results.push(`Fixed Worker ${worker.WorkerID}: Converted single slot to array format`);
          }
        }
      }

      // Fix MaxLoadPerPhase if it's less than available slots
      try {
        const availableSlots = JSON.parse(fixed.AvailableSlots || '[]');
        if (Array.isArray(availableSlots) && availableSlots.length > fixed.MaxLoadPerPhase) {
          fixed.MaxLoadPerPhase = availableSlots.length;
          results.push(`Fixed Worker ${worker.WorkerID}: Adjusted MaxLoadPerPhase to match available slots`);
        }
      } catch {
        // Skip if can't parse
      }
      
      return fixed;
    });

    // Apply fixes
    onDataFixed('clients', fixedClients);
    onDataFixed('workers', fixedWorkers);
    onDataFixed('tasks', fixedTasks);
    
    setFixResults(results);
    setIsFixing(false);
    
    // Trigger re-validation after a short delay to allow state updates
    setTimeout(() => {
      onFixComplete();
    }, 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Wrench className="w-6 h-6 text-orange-600 mr-2" />
          <h3 className="text-xl font-bold text-gray-900">Auto-Fix Common Issues</h3>
        </div>
        
        <button
          onClick={autoFixData}
          disabled={isFixing}
          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center font-medium"
        >
          <Wrench className="w-4 h-4 mr-2" />
          {isFixing ? 'Fixing...' : 'Auto-Fix Issues'}
        </button>
      </div>
      
      <p className="text-gray-700 mb-4 font-medium">
        Automatically fix common formatting issues like invalid JSON, phase formats, and missing task references.
      </p>
      
      {fixResults.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-semibold text-green-800">Fixed {fixResults.length} issues:</span>
          </div>
          <ul className="text-sm text-green-800 space-y-1 max-h-40 overflow-y-auto font-medium">
            {fixResults.map((result, index) => (
              <li key={index}>• {result}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}