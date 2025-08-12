// components/AdvancedIssuesPanel.tsx
'use client';

import { useState } from 'react';
import { AlertTriangle, Info, CheckCircle, Zap } from 'lucide-react';
import { Client, Worker, Task, ValidationError } from '@/lib/types';

interface AdvancedIssuesPanelProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  validationErrors: ValidationError[];
  onDataFixed: (type: 'clients' | 'workers' | 'tasks', data: Client[] | Worker[] | Task[]) => void;
  onFixComplete: () => void;
}

export function AdvancedIssuesPanel({ 
  clients, 
  workers, 
  tasks, 
  validationErrors, 
  onDataFixed, 
  onFixComplete 
}: AdvancedIssuesPanelProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResults, setFixResults] = useState<string[]>([]);

  const advancedFix = async () => {
    setIsFixing(true);
    const results: string[] = [];

    // Fix circular dependencies
    const circularErrors = validationErrors.filter(error => 
      error.message.includes('circular dependency')
    );

    if (circularErrors.length > 0) {
      const fixedClients = clients.map(client => {
        const fixed = { ...client };
        
        if (fixed.RequestedTaskIDs) {
          const requestedIds = fixed.RequestedTaskIDs.split(',').map(id => id.trim());
          
          // Check if this client has circular dependencies
          const hasCircular = circularErrors.some(error => 
            requestedIds.some(id => error.message.includes(id))
          );
          
          if (hasCircular) {
            // Remove one of the circular tasks to break the cycle
            const circularPairs = circularErrors.map(error => {
              const match = error.message.match(/between (\w+) and (\w+)/);
              return match ? [match[1], match[2]] : [];
            }).filter(pair => pair.length === 2);
            
            let updatedIds = [...requestedIds];
            circularPairs.forEach(([task1, task2]) => {
              if (updatedIds.includes(task1) && updatedIds.includes(task2)) {
                // Remove the second task to break the cycle
                updatedIds = updatedIds.filter(id => id !== task2);
                results.push(`Fixed Client ${client.ClientID}: Removed ${task2} to break circular dependency with ${task1}`);
              }
            });
            
            fixed.RequestedTaskIDs = updatedIds.join(', ');
          }
        }
        
        return fixed;
      });

      onDataFixed('clients', fixedClients);
    }

    // Address phase oversaturation by adjusting worker capacity
    const oversaturationErrors = validationErrors.filter(error => 
      error.message.includes('oversaturated')
    );

    if (oversaturationErrors.length > 0) {
      const fixedWorkers = workers.map(worker => {
        const fixed = { ...worker };
        
        // Increase MaxLoadPerPhase for workers to help with oversaturation
        if (fixed.MaxLoadPerPhase < 5) { // Don't go above reasonable limits
          fixed.MaxLoadPerPhase = Math.min(fixed.MaxLoadPerPhase + 2, 5);
          results.push(`Increased Worker ${worker.WorkerID} MaxLoadPerPhase to ${fixed.MaxLoadPerPhase} to help with oversaturation`);
        }
        
        return fixed;
      });

      onDataFixed('workers', fixedWorkers);
    }

    // Alternative: Redistribute tasks across phases
    const phaseDistributionFix = () => {
      const fixedTasks = tasks.map(task => {
        const fixed = { ...task };
        
        // For tasks in oversaturated phases, expand their preferred phases
        try {
          let phases: number[] = [];
          
          if (fixed.PreferredPhases) {
            if (fixed.PreferredPhases.startsWith('[')) {
              phases = JSON.parse(fixed.PreferredPhases);
            } else if (fixed.PreferredPhases.includes('-')) {
              const [start, end] = fixed.PreferredPhases.split('-').map(n => parseInt(n.trim()));
              for (let i = start; i <= end; i++) {
                phases.push(i);
              }
            }
          }
          
          // If task is only in phases 2 or 3 (which are oversaturated), add more options
          if (phases.length <= 2 && (phases.includes(2) || phases.includes(3))) {
            // Add phases 1, 4, and 5 as options
            const expandedPhases = [...new Set([...phases, 1, 4, 5])].sort();
            fixed.PreferredPhases = JSON.stringify(expandedPhases);
            results.push(`Expanded Task ${task.TaskID} preferred phases to reduce oversaturation`);
          }
        } catch {
          // Skip if can't parse
        }
        
        return fixed;
      });

      onDataFixed('tasks', fixedTasks);
    };

    // Apply phase distribution fix if we have oversaturation
    if (oversaturationErrors.length > 0) {
      phaseDistributionFix();
    }

    setFixResults(results);
    setIsFixing(false);
    
    setTimeout(() => {
      onFixComplete();
    }, 100);
  };

  const getIssueStats = () => {
    const oversaturation = validationErrors.filter(e => e.message.includes('oversaturated')).length;
    const circular = validationErrors.filter(e => e.message.includes('circular')).length;
    const skillCoverage = validationErrors.filter(e => e.message.includes('No worker')).length;
    
    return { oversaturation, circular, skillCoverage };
  };

  const stats = getIssueStats();
  const hasAdvancedIssues = stats.oversaturation > 0 || stats.circular > 0 || stats.skillCoverage > 0;

  if (!hasAdvancedIssues) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-center p-4 text-green-600">
          <CheckCircle className="w-6 h-6 mr-2" />
          <span className="font-medium">No advanced issues detected!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
          <h3 className="text-xl font-semibold">Advanced Issues Detected</h3>
        </div>
        
        <button
          onClick={advancedFix}
          disabled={isFixing}
          className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 disabled:opacity-50 transition-colors flex items-center"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isFixing ? 'Fixing...' : 'Fix Advanced Issues'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {stats.oversaturation > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-medium text-red-800">Phase Oversaturation</span>
            </div>
            <p className="text-sm text-red-700">{stats.oversaturation} phases have more work than worker capacity</p>
          </div>
        )}

        {stats.circular > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Info className="w-5 h-5 text-orange-600 mr-2" />
              <span className="font-medium text-orange-800">Circular Dependencies</span>
            </div>
            <p className="text-sm text-orange-700">{stats.circular} potential circular task dependencies</p>
          </div>
        )}

        {stats.skillCoverage > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-medium text-yellow-800">Skill Gaps</span>
            </div>
            <p className="text-sm text-yellow-700">{stats.skillCoverage} tasks need skills no worker has</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-blue-900 mb-2">What this will fix:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {stats.oversaturation > 0 && <li>• Increase worker capacity and redistribute tasks across phases</li>}
          {stats.circular > 0 && <li>• Remove circular task dependencies from client requests</li>}
          {stats.skillCoverage > 0 && <li>• Highlight skill gaps that need manual attention</li>}
        </ul>
      </div>

      {fixResults.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium text-green-800">Advanced fixes applied ({fixResults.length}):</span>
          </div>
          <ul className="text-sm text-green-700 space-y-1 max-h-40 overflow-y-auto">
            {fixResults.map((result, index) => (
              <li key={index}>• {result}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}