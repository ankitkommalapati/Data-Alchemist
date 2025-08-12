'use client';

import { useState } from 'react';
import { Brain, AlertTriangle, CheckCircle, Lightbulb, Zap } from 'lucide-react';
import { Client, Worker, Task } from '@/lib/types';

interface AIValidatorProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  onSuggestionApply: (suggestion: ValidationSuggestion) => void;
}

interface ValidationSuggestion {
  id: string;
  type: 'fix' | 'warning' | 'optimization';
  entity: 'client' | 'worker' | 'task';
  field: string;
  row: number;
  issue: string;
  suggestion: string;
  confidence: number;
  autoApplicable: boolean;
  value?: string | number | boolean | Record<string, unknown>;
}

export function AIValidator({ clients, workers, tasks, onSuggestionApply }: AIValidatorProps) {
  const [suggestions, setSuggestions] = useState<ValidationSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newSuggestions: ValidationSuggestion[] = [];
    
    // Analyze clients
    clients.forEach((client, index) => {
      // Check for missing AttributesJSON
      if (!client.AttributesJSON || client.AttributesJSON.trim() === '') {
        newSuggestions.push({
          id: `client-${index}-attributes`,
          type: 'optimization',
          entity: 'client',
          field: 'AttributesJSON',
          row: index,
          issue: 'Missing client attributes',
          suggestion: 'Add default attributes for better tracking',
          confidence: 85,
          autoApplicable: true,
          value: '{"status":"active","region":"default"}'
        });
      }
      
      // Check priority distribution
      if (client.PriorityLevel === 3) {
        const highPriorityCount = clients.filter(c => c.PriorityLevel >= 4).length;
        const totalCount = clients.length;
        if (highPriorityCount / totalCount > 0.7) {
          newSuggestions.push({
            id: `client-${index}-priority`,
            type: 'warning',
            entity: 'client',
            field: 'PriorityLevel',
            row: index,
            issue: 'Priority inflation detected',
            suggestion: 'Consider lowering priority to 2 for better distribution',
            confidence: 72,
            autoApplicable: true,
            value: 2
          });
        }
      }
    });

    // Analyze workers
    workers.forEach((worker, index) => {
      // Check for skill gaps
      const workerSkills = worker.Skills ? worker.Skills.split(',').map(s => s.trim()) : [];
      const allTaskSkills = tasks.flatMap(task => 
        task.RequiredSkills ? task.RequiredSkills.split(',').map(s => s.trim()) : []
      );
      
      const uniqueTaskSkills = [...new Set(allTaskSkills)];
      const missingSkills = uniqueTaskSkills.filter(skill => 
        !workerSkills.some(workerSkill => 
          workerSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      
      if (missingSkills.length > 0 && workerSkills.length < 3) {
        newSuggestions.push({
          id: `worker-${index}-skills`,
          type: 'optimization',
          entity: 'worker',
          field: 'Skills',
          row: index,
          issue: 'Limited skill coverage',
          suggestion: `Consider adding: ${missingSkills.slice(0, 2).join(', ')}`,
          confidence: 68,
          autoApplicable: false
        });
      }

      // Check availability patterns
      if (worker.AvailableSlots) {
        try {
          const slots = JSON.parse(worker.AvailableSlots);
          if (Array.isArray(slots) && slots.length === 1) {
            newSuggestions.push({
              id: `worker-${index}-availability`,
              type: 'optimization',
              entity: 'worker',
              field: 'AvailableSlots',
              row: index,
              issue: 'Limited availability',
              suggestion: 'Consider adding more available time slots',
              confidence: 75,
              autoApplicable: false
            });
          }
        } catch (e) {
          // Handled by regular validation
        }
      }
    });

    // Analyze tasks
    tasks.forEach((task, index) => {
      // Check for unrealistic durations
      if (task.Duration > 5) {
        newSuggestions.push({
          id: `task-${index}-duration`,
          type: 'warning',
          entity: 'task',
          field: 'Duration',
          row: index,
          issue: 'Very long task duration',
          suggestion: 'Consider breaking into smaller subtasks',
          confidence: 80,
          autoApplicable: false
        });
      }
      
      // Check MaxConcurrent vs available workers
      const qualifiedWorkers = workers.filter(worker => {
        const workerSkills = worker.Skills ? worker.Skills.split(',').map(s => s.trim().toLowerCase()) : [];
        const requiredSkills = task.RequiredSkills ? task.RequiredSkills.split(',').map(s => s.trim().toLowerCase()) : [];
        
        return requiredSkills.every(skill => 
          workerSkills.some(workerSkill => workerSkill.includes(skill))
        );
      });
      
      if (task.MaxConcurrent > qualifiedWorkers.length) {
        newSuggestions.push({
          id: `task-${index}-concurrent`,
          type: 'fix',
          entity: 'task',
          field: 'MaxConcurrent',
          row: index,
          issue: 'MaxConcurrent exceeds qualified workers',
          suggestion: `Reduce to ${qualifiedWorkers.length} (available qualified workers)`,
          confidence: 95,
          autoApplicable: true,
          value: qualifiedWorkers.length
        });
      }
    });

    setSuggestions(newSuggestions);
    setIsAnalyzing(false);
  };

  const applySuggestion = (suggestion: ValidationSuggestion) => {
    onSuggestionApply(suggestion);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const applySelectedSuggestions = () => {
    const toApply = suggestions.filter(s => selectedSuggestions.has(s.id) && s.autoApplicable);
    toApply.forEach(suggestion => applySuggestion(suggestion));
    setSelectedSuggestions(new Set());
  };

  const toggleSuggestionSelection = (suggestionId: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(suggestionId)) {
      newSelected.delete(suggestionId);
    } else {
      newSelected.add(suggestionId);
    }
    setSelectedSuggestions(newSelected);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'fix': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'optimization': return <Lightbulb className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSuggestionBorderColor = (type: string) => {
    switch (type) {
      case 'fix': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'optimization': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatSuggestionValue = (value: string | number | boolean | Record<string, unknown> | undefined): string => {
    if (value === undefined) return '';
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Brain className="w-6 h-6 text-purple-600 mr-2" />
          <div>
            <h3 className="text-xl font-semibold">AI Validation Assistant</h3>
            <p className="text-gray-600">Advanced pattern detection and optimization suggestions</p>
          </div>
        </div>
        
        <button
          onClick={runAIAnalysis}
          disabled={isAnalyzing}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>

      {isAnalyzing && (
        <div className="mb-6 bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-3"></div>
            <div>
              <p className="font-medium text-purple-800">AI is analyzing your data...</p>
              <p className="text-sm text-purple-600">Checking patterns, relationships, and optimization opportunities</p>
            </div>
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900">
              {suggestions.length} AI-Generated Suggestions
            </h4>
            
            {selectedSuggestions.size > 0 && (
              <button
                onClick={applySelectedSuggestions}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
              >
                Apply Selected ({selectedSuggestions.size})
              </button>
            )}
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`border rounded-lg p-4 ${getSuggestionBorderColor(suggestion.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {suggestion.autoApplicable && (
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.has(suggestion.id)}
                        onChange={() => toggleSuggestionSelection(suggestion.id)}
                        className="mt-1"
                      />
                    )}
                    
                    <div className="flex-shrink-0 mt-1">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 mr-2">{suggestion.issue}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            suggestion.type === 'fix' ? 'bg-red-100 text-red-800' :
                            suggestion.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {suggestion.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {suggestion.confidence}% confidence
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{suggestion.suggestion}</p>
                      
                      <div className="text-xs text-gray-500">
                        {suggestion.entity} • Row {suggestion.row + 1} • Field: {suggestion.field}
                      </div>
                      
                      {suggestion.value !== undefined && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Suggested value: </span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {formatSuggestionValue(suggestion.value)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {suggestion.autoApplicable && (
                    <button
                      onClick={() => applySuggestion(suggestion)}
                      className="ml-4 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isAnalyzing && suggestions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p>No suggestions available. Run AI analysis to get intelligent recommendations.</p>
        </div>
      )}
    </div>
  );
}