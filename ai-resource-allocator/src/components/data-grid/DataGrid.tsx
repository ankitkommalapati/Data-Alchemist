// components/data-grid/DataGrid.tsx
'use client';

import { useState, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import { Edit2, Save, X, AlertTriangle } from 'lucide-react';
import { Client, Worker, Task, ValidationError } from '@/lib/types';
import { DataValidator } from '@/lib/validators';

interface DataGridProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  onDataChange: (type: 'clients' | 'workers' | 'tasks', data: any[]) => void;
}

export function DataGrid({ clients, workers, tasks, onDataChange }: DataGridProps) {
  const [activeTab, setActiveTab] = useState<'clients' | 'workers' | 'tasks'>('clients');
  const [editingCell, setEditingCell] = useState<{ row: number; column: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validator = useMemo(() => new DataValidator(), []);

  const validateData = () => {
    const errors = validator.validateAll(clients, workers, tasks);
    setValidationErrors(errors);
    return errors;
  };

  const handleCellEdit = (rowIndex: number, columnId: string, value: string) => {
    const currentData = activeTab === 'clients' ? clients : activeTab === 'workers' ? workers : tasks;
    const newData = [...currentData];
    (newData[rowIndex] as any)[columnId] = value;
    
    onDataChange(activeTab, newData);
    validateData();
  };

  const startEdit = (rowIndex: number, columnId: string, currentValue: string) => {
    setEditingCell({ row: rowIndex, column: columnId });
    setEditValue(currentValue || '');
  };

  const saveEdit = () => {
    if (editingCell) {
      handleCellEdit(editingCell.row, editingCell.column, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const createEditableCell = (getValue: () => any, row: any, column: any) => {
    const value = getValue();
    const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
    const hasError = validationErrors.some(
      error => error.entity === activeTab.slice(0, -1) && 
               error.field === column.id && 
               error.row === row.index
    );

    if (isEditing) {
      return (
        <div className="flex items-center space-x-1">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            className="w-full px-1 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
            <Save className="w-4 h-4" />
          </button>
          <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div 
        className={`flex items-center justify-between group cursor-pointer p-1 rounded ${
          hasError ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50'
        }`}
        onClick={() => startEdit(row.index, column.id, value)}
      >
        <span className={`${hasError ? 'text-red-700' : ''} truncate`}>
          {value || '—'}
        </span>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasError && <AlertTriangle className="w-4 h-4 text-red-500" />}
          <Edit2 className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    );
  };

  // Column definitions
  const clientColumns = useMemo(() => {
    const columnHelper = createColumnHelper<Client>();
    return [
      columnHelper.accessor('ClientID', {
        header: 'Client ID',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('ClientName', {
        header: 'Name',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('PriorityLevel', {
        header: 'Priority',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('RequestedTaskIDs', {
        header: 'Requested Tasks',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('GroupTag', {
        header: 'Group',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('AttributesJSON', {
        header: 'Attributes',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      })
    ];
  }, [editingCell, editValue, validationErrors, activeTab]);

  const workerColumns = useMemo(() => {
    const columnHelper = createColumnHelper<Worker>();
    return [
      columnHelper.accessor('WorkerID', {
        header: 'Worker ID',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('WorkerName', {
        header: 'Name',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('Skills', {
        header: 'Skills',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('AvailableSlots', {
        header: 'Available Slots',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('MaxLoadPerPhase', {
        header: 'Max Load',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('WorkerGroup', {
        header: 'Group',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('QualificationLevel', {
        header: 'Qualification',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      })
    ];
  }, [editingCell, editValue, validationErrors, activeTab]);

  const taskColumns = useMemo(() => {
    const columnHelper = createColumnHelper<Task>();
    return [
      columnHelper.accessor('TaskID', {
        header: 'Task ID',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('TaskName', {
        header: 'Name',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('Category', {
        header: 'Category',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('Duration', {
        header: 'Duration',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('RequiredSkills', {
        header: 'Required Skills',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('PreferredPhases', {
        header: 'Preferred Phases',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      }),
      columnHelper.accessor('MaxConcurrent', {
        header: 'Max Concurrent',
        cell: ({ getValue, row, column }) => createEditableCell(getValue, row, column)
      })
    ];
  }, [editingCell, editValue, validationErrors, activeTab]);

  const getCurrentData = () => {
    switch (activeTab) {
      case 'clients': return clients;
      case 'workers': return workers;
      case 'tasks': return tasks;
      default: return [];
    }
  };

  const getCurrentColumns = () => {
    switch (activeTab) {
      case 'clients': return clientColumns;
      case 'workers': return workerColumns;
      case 'tasks': return taskColumns;
      default: return [];
    }
  };

  const table = useReactTable({
    data: getCurrentData(),
    columns: getCurrentColumns(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const currentErrors = validationErrors.filter(error => 
    error.entity === activeTab.slice(0, -1) || error.row === -1
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Data Grid</h2>
        <button
          onClick={validateData}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Validate Data
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 border-b">
        {(['clients', 'workers', 'tasks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab} ({getCurrentData().length})
          </button>
        ))}
      </div>

      {/* Error Summary */}
      {currentErrors.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="font-medium text-red-800">Validation Issues ({currentErrors.length})</h3>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {currentErrors.slice(0, 5).map((error) => (
              <p key={error.id} className="text-sm text-red-700">
                Row {error.row + 1}, {error.field}: {error.message}
              </p>
            ))}
            {currentErrors.length > 5 && (
              <p className="text-sm text-red-600 font-medium">
                ...and {currentErrors.length - 5} more issues
              </p>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 whitespace-nowrap text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}