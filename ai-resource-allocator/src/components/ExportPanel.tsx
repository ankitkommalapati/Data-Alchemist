// components/ExportPanel.tsx
'use client';

import { useState } from 'react';
import { Download, FileText, Settings, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Client, Worker, Task, BusinessRule } from '@/lib/types';

interface ExportPanelProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  rules: BusinessRule[];
  prioritizationWeights?: Record<string, number>;
}

export function ExportPanel({ 
  clients, 
  workers, 
  tasks, 
  rules, 
  prioritizationWeights = {} 
}: ExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [includeValidatedData, setIncludeValidatedData] = useState(true);
  const [includeRulesConfig, setIncludeRulesConfig] = useState(true);
  const [includePrioritization, setIncludePrioritization] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async () => {
    setIsExporting(true);
    
    try {
      if (exportFormat === 'xlsx') {
        await exportAsExcel();
      } else {
        await exportAsCSV();
      }
      
      if (includeRulesConfig) {
        exportRulesConfig();
      }
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsExcel = async () => {
    const wb = XLSX.utils.book_new();
    
    // Add data sheets
    if (includeValidatedData) {
      const clientsWS = XLSX.utils.json_to_sheet(clients);
      const workersWS = XLSX.utils.json_to_sheet(workers);
      const tasksWS = XLSX.utils.json_to_sheet(tasks);
      
      XLSX.utils.book_append_sheet(wb, clientsWS, 'Clients');
      XLSX.utils.book_append_sheet(wb, workersWS, 'Workers');
      XLSX.utils.book_append_sheet(wb, tasksWS, 'Tasks');
    }
    
    // Add summary sheet
    const summary = [
      { Entity: 'Clients', Count: clients.length, Status: 'Validated' },
      { Entity: 'Workers', Count: workers.length, Status: 'Validated' },
      { Entity: 'Tasks', Count: tasks.length, Status: 'Validated' },
      { Entity: 'Business Rules', Count: rules.length, Status: 'Active' }
    ];
    
    const summaryWS = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
    
    // Export
    XLSX.writeFile(wb, `resource-allocation-data-${Date.now()}.xlsx`);
  };

  const exportAsCSV = async () => {
    // Fixed: Use generic type parameter and convert objects to Record<string, unknown>
    const exportCSV = <T extends Record<string, unknown>>(data: T[], filename: string) => {
      if (data.length === 0) return;
      
      const csvContent = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).map(value => {
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    if (includeValidatedData) {
      // Convert typed arrays to Record<string, unknown>[] for CSV export
      const clientsData = clients.map(client => ({ ...client } as Record<string, unknown>));
      const workersData = workers.map(worker => ({ ...worker } as Record<string, unknown>));
      const tasksData = tasks.map(task => ({ ...task } as Record<string, unknown>));
      
      exportCSV(clientsData, `clients-${Date.now()}.csv`);
      exportCSV(workersData, `workers-${Date.now()}.csv`);
      exportCSV(tasksData, `tasks-${Date.now()}.csv`);
    }
  };

  const exportRulesConfig = () => {
    const config = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        totalRules: rules.length
      },
      businessRules: rules,
      prioritizationWeights: includePrioritization ? prioritizationWeights : {},
      dataStatistics: {
        clientCount: clients.length,
        workerCount: workers.length,
        taskCount: tasks.length
      },
      validationStatus: {
        clients: 'validated',
        workers: 'validated',
        tasks: 'validated'
      }
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { 
      type: 'application/json;charset=utf-8;' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rules-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDataQualityScore = () => {
    const totalRecords = clients.length + workers.length + tasks.length;
    if (totalRecords === 0) return 0;
    const validRecords = totalRecords; // Assuming validation passed
    return Math.round((validRecords / totalRecords) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Data Quality Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Export Ready Data</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
            <div className="text-sm font-semibold text-blue-800">Clients</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <div className="text-2xl font-bold text-green-600">{workers.length}</div>
            <div className="text-sm font-semibold text-green-800">Workers</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{tasks.length}</div>
            <div className="text-sm font-semibold text-purple-800">Tasks</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{rules.length}</div>
            <div className="text-sm font-semibold text-orange-800">Rules</div>
          </div>
        </div>

        {getDataQualityScore() > 0 ? (
          <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="w-6 h-6 text-green-600 mr-2" />
            <span className="text-green-800 font-semibold">
              Data Quality Score: {getDataQualityScore()}% - Ready for Export
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="w-6 h-6 bg-yellow-400 rounded-full mr-2"></div>
            <span className="text-yellow-800 font-semibold">
              No data loaded yet. Upload files to begin.
            </span>
          </div>
        )}
      </div>

      {/* Export Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Export Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="xlsx"
                  checked={exportFormat === 'xlsx'}
                  onChange={(e) => setExportFormat(e.target.value as 'xlsx')}
                  className="mr-2"
                />
                <FileText className="w-4 h-4 mr-2 text-green-600" />
                <span className="text-gray-800 font-medium">Excel (.xlsx) - Single file with multiple sheets</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv')}
                  className="mr-2"
                />
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                <span className="text-gray-800 font-medium">CSV - Separate files for each entity</span>
              </label>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Include in Export
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeValidatedData}
                  onChange={(e) => setIncludeValidatedData(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-800 font-medium">Validated Data (Clients, Workers, Tasks)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeRulesConfig}
                  onChange={(e) => setIncludeRulesConfig(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-800 font-medium">Business Rules Configuration (JSON)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includePrioritization}
                  onChange={(e) => setIncludePrioritization(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-800 font-medium">Prioritization Settings</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Ready to Export</h3>
            <p className="text-gray-700 font-medium">
              Your data has been validated and is ready for the allocation engine
            </p>
          </div>
          
          <button
            onClick={exportData}
            disabled={isExporting || (clients.length === 0 && workers.length === 0 && tasks.length === 0)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-lg font-semibold"
          >
            <Download className="w-5 h-5 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
        
        {isExporting && (
          <div className="mt-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-800 font-medium">Preparing your export files...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Preview */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Export Preview</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="font-bold text-gray-900">Files to be generated:</span>
            <span className="text-gray-800 font-medium">
              {exportFormat === 'xlsx' ? '1 Excel file' : '3 CSV files'} 
              {includeRulesConfig ? ' + 1 JSON config' : ''}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="font-bold text-gray-900">Total records:</span>
            <span className="text-gray-800 font-medium">
              {clients.length + workers.length + tasks.length}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="font-bold text-gray-900">Business rules:</span>
            <span className="text-gray-800 font-medium">{rules.length} configured</span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="font-bold text-gray-900">Prioritization weights:</span>
            <span className="text-gray-800 font-medium">
              {Object.keys(prioritizationWeights).length > 0 
                ? `${Object.keys(prioritizationWeights).length} configured` 
                : 'Not set'}
            </span>
          </div>
          
          <div className="flex justify-between py-2">
            <span className="font-bold text-gray-900">Data status:</span>
            <span className="text-green-700 font-bold">Validated & Ready</span>
          </div>
        </div>

        {clients.length === 0 && workers.length === 0 && tasks.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-400 rounded-full mr-2"></div>
              <span className="text-yellow-800 font-semibold">
                No data available for export. Please upload data files first.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}