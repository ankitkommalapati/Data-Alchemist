'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DataGrid } from '@/components/data-grid/DataGrid';
import { ValidationPanel } from '@/components/validation/ValidationPanel';
import { RulesBuilder } from '@/components/rules/RulesBuilder';
import { ExportPanel } from '@/components/ExportPanel';
import { PrioritizationPanel } from '@/components/PrioritizationPanel';
import { AISearch } from '@/components/ai-features/AISearch';
import { AutoFixPanel } from '@/components/AutoFixPanel';
import { AdvancedIssuesPanel } from '@/components/AdvancedIssuesPanel';
import { OversaturationFix } from '@/components/OversaturationFix';
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
  const [isScrolled, setIsScrolled] = useState(false);

  const validator = new DataValidator();

  // Handle scroll for sticky navigation
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Force re-validation function
  const forceRevalidation = useCallback(() => {
    const errors = validator.validateAll(clients, workers, tasks);
    setValidationErrors(errors);
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
    console.log('Filtered results:', results);
  }, []);

  const handleWeightsChange = useCallback((weights: Record<string, number>) => {
    setPrioritizationWeights(weights);
  }, []);

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'upload': 
        return '';
      case 'data': 
        return `(${clients.length + workers.length + tasks.length})`;
      case 'rules': 
        return rules.length > 0 ? `(${rules.length})` : '';
      case 'prioritization': 
        return Object.keys(prioritizationWeights).length > 0 ? '(configured)' : '';
      case 'export': 
        return validationErrors.length === 0 ? '(ready)' : `(${validationErrors.length} issues)`;
      default: 
        return '';
    }
  };

  const getTabColor = (tab: string) => {
    if (activeTab === tab) return 'border-b-2 border-blue-500 text-blue-600 font-medium';
    
    switch (tab) {
      case 'data':
        return (clients.length + workers.length + tasks.length) > 0
          ? 'text-blue-600 hover:text-blue-700'
          : 'text-gray-600 hover:text-gray-900';
      case 'rules':
        return rules.length > 0
          ? 'text-purple-600 hover:text-purple-700'
          : 'text-gray-600 hover:text-gray-900';
      case 'prioritization':
        return Object.keys(prioritizationWeights).length > 0
          ? 'text-orange-600 hover:text-orange-700'
          : 'text-gray-600 hover:text-gray-900';
      case 'export':
        return validationErrors.length === 0 && clients.length > 0
          ? 'text-green-600 hover:text-green-700'
          : validationErrors.length > 0
          ? 'text-red-600 hover:text-red-700'
          : 'text-gray-600 hover:text-gray-900';
      default:
        return 'text-gray-600 hover:text-gray-900';
    }
  };

  const getTotalDataCount = () => clients.length + workers.length + tasks.length;

  const getValidationSummary = () => {
    const errors = validationErrors.filter(e => e.severity === 'error').length;
    const warnings = validationErrors.filter(e => e.severity === 'warning').length;
    return { errors, warnings, total: validationErrors.length };
  };

  const validationSummary = getValidationSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Header */}
      <header className={`transition-all duration-500 ease-in-out ${isScrolled ? 'opacity-0 -translate-y-8' : 'opacity-100 translate-y-0'}`}>
        <div className="text-center py-12 px-6">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🚀 AI Resource Allocation Configurator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform spreadsheet chaos into organized, validated data
          </p>
          
          {/* Quick Stats */}
          {getTotalDataCount() > 0 && (
            <div className="mt-6 flex flex-wrap justify-center items-center gap-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-900 font-medium">{clients.length} Clients</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-900 font-medium">{workers.length} Workers</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-gray-900 font-medium">{tasks.length} Tasks</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-gray-900 font-medium">{rules.length} Rules</span>
              </div>
              {validationSummary.errors > 0 && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-red-700 font-medium">{validationSummary.errors} Errors</span>
                </div>
              )}
              {validationSummary.warnings > 0 && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-yellow-700 font-medium">{validationSummary.warnings} Warnings</span>
                </div>
              )}
              {validationSummary.total === 0 && getTotalDataCount() > 0 && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-700 font-bold">All Validated ✓</span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Sticky Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ease-in-out ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-sm shadow-lg py-2' 
          : 'bg-transparent py-4'
      }`}>
        <div className="flex justify-center px-6">
          <div className="flex space-x-8 bg-white rounded-lg p-2 shadow-lg border border-gray-200">
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
                className={`px-6 py-3 rounded-md transition-all duration-200 text-base font-medium whitespace-nowrap ${getTabColor(tab.key)}`}
              >
                {tab.label} {getTabCount(tab.key)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content - Full Width */}
      <main className="px-4 sm:px-6 lg:px-8 xl:px-12 pb-12">
        <div className="max-w-none w-full">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-8 w-full">
              <FileUpload onDataUpload={handleDataUpload} />
              
              {/* Auto-Fix Panel */}
              {getTotalDataCount() > 0 && (
                <AutoFixPanel
                  clients={clients}
                  workers={workers}
                  tasks={tasks}
                  onDataFixed={handleDataChange}
                  onFixComplete={forceRevalidation}
                />
              )}
              
              {/* Advanced Issues Panel */}
              {validationErrors.length > 0 && (
                <AdvancedIssuesPanel
                  clients={clients}
                  workers={workers}
                  tasks={tasks}
                  validationErrors={validationErrors}
                  onDataFixed={handleDataChange}
                  onFixComplete={forceRevalidation}
                />
              )}
              
              {/* Oversaturation Quick Fix */}
              <OversaturationFix
                workers={workers}
                validationErrors={validationErrors}
                onWorkersFixed={(fixedWorkers) => handleDataChange('workers', fixedWorkers)}
                onFixComplete={forceRevalidation}
              />
              
              {/* Validation Results */}
              {validationErrors.length > 0 && (
                <ValidationPanel 
                  key={`validation-${validationErrors.length}-${Date.now()}`}
                  errors={validationErrors} 
                />
              )}
              
              {/* Success Message */}
              {getTotalDataCount() > 0 && validationErrors.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                  <div className="text-green-600 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 mb-3">Data Validation Complete!</h3>
                  <p className="text-green-700 mb-6 text-lg">
                    All {getTotalDataCount()} records have been validated successfully. Your data is ready for processing.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setActiveTab('rules')}
                      className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
                    >
                      Create Business Rules
                    </button>
                    <button
                      onClick={() => setActiveTab('export')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Export Data
                    </button>
                  </div>
                </div>
              )}
              
              {/* Manual Re-validate Button */}
              {getTotalDataCount() > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={forceRevalidation}
                    className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors flex items-center font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Re-run Validation
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-8 w-full">
              {getTotalDataCount() > 0 ? (
                <>
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
                </>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center max-w-2xl mx-auto">
                  <div className="text-gray-400 mb-6">
                    <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Data Loaded</h3>
                  <p className="text-gray-600 mb-6 text-lg">Upload your files in the Upload tab to view and edit your data here.</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors font-medium"
                  >
                    Go to Upload
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-8 w-full">
              {getTotalDataCount() > 0 ? (
                <RulesBuilder
                  clients={clients}
                  workers={workers}
                  tasks={tasks}
                  rules={rules}
                  onRulesChange={setRules}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center max-w-2xl mx-auto">
                  <div className="text-gray-400 mb-6">
                    <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Data Available for Rules</h3>
                  <p className="text-gray-600 mb-6 text-lg">Upload your data first to create business rules based on your clients, workers, and tasks.</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors font-medium"
                  >
                    Go to Upload
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Prioritization Tab */}
          {activeTab === 'prioritization' && (
            <div className="w-full">
              <PrioritizationPanel onWeightsChange={handleWeightsChange} />
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="w-full">
              <ExportPanel
                clients={clients}
                workers={workers}
                tasks={tasks}
                rules={rules}
                prioritizationWeights={prioritizationWeights}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}