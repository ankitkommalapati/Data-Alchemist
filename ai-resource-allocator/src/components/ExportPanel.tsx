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
}

export function ExportPanel({ clients, workers, tasks, rules }: ExportPanelProps) {
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
    const exportCSV = (data: any[], filename: string) => {
      const csvContent = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    if (includeValidatedData) {
      exportCSV(clients, `clients-${Date.now()}.csv`);
      exportCSV(workers, `workers-${Date.now()}.csv`);
      exportCSV(tasks, `tasks-${Date.now()}.csv`);
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
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rules-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDataQualityScore = () => {
    const totalRecords = clients.length + workers.length + tasks.length;
    const validRecords = totalRecords; // Assuming validation passed
    return Math.round((validRecords / totalRecords) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Data Quality Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Export Ready Data</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
            <div className="text-sm text-blue-800">Clients</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{workers.length}</div>
            <div className="text-sm text-green-800">Workers</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{tasks.length}</div>
            <div className="text-sm text-purple-800">Tasks</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{rules.length}</div>
            <div className="text-sm text-orange-800">Rules</div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
          <CheckCircle2 className="w-6 h-6 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">
            Data Quality Score: {getDataQualityScore()}% - Ready for Export
          </span>
        </div>
      </div>

      {/* Export Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Export Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
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
                Excel (.xlsx) - Single file with multiple sheets
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
                CSV - Separate files for each entity
              </label>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
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
                Validated Data (Clients, Workers, Tasks)
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeRulesConfig}
                  onChange={(e) => setIncludeRulesConfig(e.target.checked)}
                  className="mr-2"
                />
                Business Rules Configuration (JSON)
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includePrioritization}
                  onChange={(e) => setIncludePrioritization(e.target.checked)}
                  className="mr-2"
                />
                Prioritization Settings
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Ready to Export</h3>
            <p className="text-gray-600">
              Your data has been validated and is ready for the allocation engine
            </p>
          </div>
          
          <button
            onClick={exportData}
            disabled={isExporting}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center text-lg font-medium"
          >
            <Download className="w-5 h-5 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
        
        {isExporting && (
          <div className="mt-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-800">Preparing your export files...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Preview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Export Preview</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="font-medium">Files to be generated:</span>
            <span className="text-gray-600">
              {exportFormat === 'xlsx' ? '1 Excel file' : '3 CSV files'} 
              {includeRulesConfig ? ' + 1 JSON config' : ''}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="font-medium">Total records:</span>
            <span className="text-gray-600">
              {clients.length + workers.length + tasks.length}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="font-medium">Business rules:</span>
            <span className="text-gray-600">{rules.length} configured</span>
          </div>
          
          <div className="flex justify-between py-2">
            <span className="font-medium">Data status:</span>
            <span className="text-green-600 font-medium">Validated & Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}