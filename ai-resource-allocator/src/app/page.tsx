'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DataGrid } from '@/components/data-grid/DataGrid';
import { ValidationPanel } from '@/components/validation/ValidationPanel';
import { RulesBuilder } from '@/components/rules/RulesBuilder';
import { ExportPanel } from '@/components/ExportPanel';
import { PrioritizationPanel } from '@/components/PrioritizationPanel';
import { AISearch } from '@/components/ai-features/AISearch';
import { Client, Worker, Task, ValidationError, BusinessRule } from '@/lib/types';
import { DataValidator } from '@/lib/validators';

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [prioritizationWeights, setPrioritizationWeights] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'upload' | 'data' | 'rules' | 'prioritization' | 'export'>('upload');

  const validator = new DataValidator();

  // Validate data whenever data changes
  useEffect(() => {
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
      const timeoutId = setTimeout(() => {
        const errors = validator.validateAll(clients, workers, tasks);
        setValidationErrors(errors);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setValidationErrors([]);
    }
    }, [clients, workers, tasks, validator]);

  const handleDataUpload = useCallback((data: Client[] | Worker[] | Task[], type: 'clients' | 'workers' | 'tasks') => {
    switch (type) {
      case 'clients':
        setClients(data as Client[]);
        break;
      case 'workers':
        setWorkers(data as Worker[]);
        break;
      case 'tasks':
        setTasks(data as Task[]);
        break;
    }
  }, []);

  const handleDataChange = useCallback((type: 'clients' | 'workers' | 'tasks', newData: Client[] | Worker[] | Task[]) => {
    handleDataUpload(newData, type);
  }, [handleDataUpload]);

  const handleFilteredResults = useCallback((results: { clients: Client[]; workers: Worker[]; tasks: Task[] }) => {
    // Handle filtered search results - could update display or highlight matches
    console.log('Filtered results:', results);
  }, []);

  const handleWeightsChange = useCallback((weights: Record<string, number>) => {
    setPrioritizationWeights(weights);
  }, []);

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'upload': return '';
      case 'data': return `(${clients.length + workers.length + tasks.length})`;
      case 'rules': return rules.length > 0 ? `(${rules.length})` : '';
      case 'prioritization': return Object.keys(prioritizationWeights).length > 0 ? '(configured)' : '';
      case 'export': return validationErrors.length === 0 ? '(ready)' : `(${validationErrors.length} issues)`;
      default: return '';
    }
  };

  const getTabColor = (tab: string) => {
    if (activeTab === tab) return 'border-b-2 border-blue-500 text-blue-600 font-medium';
    
    switch (tab) {
      case 'export':
        return validationErrors.length === 0 && clients.length > 0
          ? 'text-green-600 hover:text-green-700'
          : 'text-gray-600 hover:text-gray-900';
      default:
        return 'text-gray-600 hover:text-gray-900';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🚀 AI Resource Allocation Configurator
        </h1>
        <p className="text-gray-600">Transform spreadsheet chaos into organized, validated data</p>
      </header>

      <nav className="mb-6">
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow">
          {[
            { key: 'upload', label: 'Upload' },
            { key: 'data', label: 'Data' },
            { key: 'rules', label: 'Rules' },
            { key: 'prioritization', label: 'Priorities' },
            { key: 'export', label: 'Export' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-md transition-colors ${getTabColor(tab.key)}`}
            >
              {tab.label} {getTabCount(tab.key)}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === 'upload' && (
        <div className="space-y-6">
          <FileUpload onDataUpload={handleDataUpload} />
          {validationErrors.length > 0 && (
            <ValidationPanel 
              key={`validation-${validationErrors.length}-${Date.now()}`}
              errors={validationErrors} 
            />
          )}
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6">
          <AISearch 
            clients={clients} 
            workers={workers} 
            tasks={tasks}
            onFilter={handleFilteredResults}
          />
          <DataGrid
            clients={clients}
            workers={workers}
            tasks={tasks}
            onDataChange={handleDataChange}
          />
        </div>
      )}

      {activeTab === 'rules' && (
        <RulesBuilder
          clients={clients}
          workers={workers}
          tasks={tasks}
          rules={rules}
          onRulesChange={setRules}
        />
      )}

      {activeTab === 'prioritization' && (
        <PrioritizationPanel onWeightsChange={handleWeightsChange} />
      )}

      {activeTab === 'export' && (
        <ExportPanel
          clients={clients}
          workers={workers}
          tasks={tasks}
          rules={rules}
          prioritizationWeights={prioritizationWeights}
        />
      )}
    </div>
  );
}