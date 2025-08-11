// components/data-grid/DataGrid.tsx (simplified version to get started)
'use client';

import { Client, Worker, Task } from '@/lib/types';

interface DataGridProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  onDataChange: (type: 'clients' | 'workers' | 'tasks', data: Client[] | Worker[] | Task[]) => void;
}

export function DataGrid({ clients, workers, tasks }: DataGridProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Data Overview</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
          <div className="text-sm text-blue-800">Clients</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{workers.length}</div>
          <div className="text-sm text-green-800">Workers</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{tasks.length}</div>
          <div className="text-sm text-purple-800">Tasks</div>
        </div>
      </div>
      <p className="text-gray-600 mt-4 text-center">
        Full data grid implementation coming soon...
      </p>
    </div>
  );
}