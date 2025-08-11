'use client';

import { useState, useCallback } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DataGrid } from '@/components/data-grid/DataGrid';
import { ValidationPanel } from '@/components/validation/ValidationPanel';
import { RulesBuilder } from '@/components/rules/RulesBuilder';
import { AISearch } from '@/components/ai-features/AISearch';
import { Client, Worker, Task, ValidationError, BusinessRule } from '@/lib/types';

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'data' | 'rules' | 'export'>('upload');

  const handleDataUpload = useCallback((data: any, type: 'clients' | 'workers' | 'tasks') => {
    switch (type) {
      case 'clients':
        setClients(data);
        break;
      case 'workers':
        setWorkers(data);
        break;
      case 'tasks':
        setTasks(data);
        break;
    }
  }, []);

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
          {['upload', 'data', 'rules', 'export'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-md capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === 'upload' && (
        <div className="space-y-6">
          <FileUpload onDataUpload={handleDataUpload} />
          <ValidationPanel errors={validationErrors} />
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6">
          <AISearch 
            clients={clients} 
            workers={workers} 
            tasks={tasks}
            onFilter={(filtered) => console.log('Filtered:', filtered)}
          />
          <DataGrid
            clients={clients}
            workers={workers}
            tasks={tasks}
            onDataChange={(type, data) => handleDataUpload(data, type)}
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

      {activeTab === 'export' && (
        <ExportPanel
          clients={clients}
          workers={workers}
          tasks={tasks}
          rules={rules}
        />
      )}
    </div>
  );
}