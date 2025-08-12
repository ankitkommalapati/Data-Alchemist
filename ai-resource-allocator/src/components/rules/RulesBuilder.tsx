'use client';

import { useState } from 'react';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { BusinessRule, Client, Worker, Task } from '@/lib/types';

interface RulesBuilderProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  rules: BusinessRule[];
  onRulesChange: (rules: BusinessRule[]) => void;
}

interface RuleParameters {
  tasks?: string[];
  group?: string;
  maxSlots?: number;
  workerGroup?: string;
  maxLoad?: number;
  taskId?: string;
  allowedPhases?: number[];
}

export function RulesBuilder({ clients, workers, tasks, rules, onRulesChange }: RulesBuilderProps) {
  const [showAddRule, setShowAddRule] = useState(false);
  const [naturalLanguageRule, setNaturalLanguageRule] = useState('');
  const [newRule, setNewRule] = useState<Partial<BusinessRule>>({
    type: 'coRun',
    name: '',
    description: '',
    parameters: {}
  });

  // Get unique groups from clients and workers for dropdowns
  const clientGroups = [...new Set(clients.map(client => client.GroupTag).filter(Boolean))];
  const workerGroups = [...new Set(workers.map(worker => worker.WorkerGroup).filter(Boolean))];
  const taskIds = tasks.map(task => task.TaskID).filter(Boolean);

  const addRule = (rule: BusinessRule) => {
    onRulesChange([...rules, rule]);
    setShowAddRule(false);
    setNewRule({ type: 'coRun', name: '', description: '', parameters: {} });
  };

  const removeRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
  };

  const parseNaturalLanguageRule = async () => {
    // Simulate AI processing
    const lowercaseRule = naturalLanguageRule.toLowerCase();
    
    if (lowercaseRule.includes('run together') || lowercaseRule.includes('co-run')) {
      const taskMatches = naturalLanguageRule.match(/T\d+/g);
      if (taskMatches && taskMatches.length >= 2) {
        const rule: BusinessRule = {
          id: Date.now().toString(),
          type: 'coRun',
          name: `Co-run ${taskMatches.join(', ')}`,
          description: `Tasks ${taskMatches.join(', ')} must run together`,
          parameters: {
            tasks: taskMatches
          }
        };
        addRule(rule);
      }
    } else if (lowercaseRule.includes('limit') && lowercaseRule.includes('slots')) {
      const groupMatch = naturalLanguageRule.match(/group\s*([a-zA-Z]+)/i);
      const numberMatch = naturalLanguageRule.match(/(\d+)\s*slots?/);
      
      if (groupMatch && numberMatch) {
        const rule: BusinessRule = {
          id: Date.now().toString(),
          type: 'slotRestriction',
          name: `Slot limit for ${groupMatch[1]}`,
          description: `Limit ${groupMatch[1]} to ${numberMatch[1]} slots`,
          parameters: {
            group: groupMatch[1],
            maxSlots: parseInt(numberMatch[1])
          }
        };
        addRule(rule);
      }
    } else if (lowercaseRule.includes('phase') && (lowercaseRule.includes('only') || lowercaseRule.includes('restrict'))) {
      const taskMatch = naturalLanguageRule.match(/T\d+/);
      const phaseMatches = naturalLanguageRule.match(/phase\s*(\d+(?:\s*,\s*\d+)*)/);
      
      if (taskMatch && phaseMatches) {
        const phases = phaseMatches[1].split(',').map(p => parseInt(p.trim()));
        const rule: BusinessRule = {
          id: Date.now().toString(),
          type: 'phaseWindow',
          name: `Phase restriction for ${taskMatch[0]}`,
          description: `${taskMatch[0]} can only run in phases ${phases.join(', ')}`,
          parameters: {
            taskId: taskMatch[0],
            allowedPhases: phases
          }
        };
        addRule(rule);
      }
    }
    
    setNaturalLanguageRule('');
  };

  const createManualRule = () => {
    if (!newRule.name || !newRule.type) return;
    
    const rule: BusinessRule = {
      id: Date.now().toString(),
      type: newRule.type!,
      name: newRule.name!,
      description: newRule.description || '',
      parameters: newRule.parameters || {}
    };
    
    addRule(rule);
  };

  const renderRuleParameters = (rule: BusinessRule) => {
    const params = rule.parameters as RuleParameters;
    
    switch (rule.type) {
      case 'coRun':
        return (
          <div className="text-sm text-gray-700">
            Tasks: {params.tasks?.join(', ') || 'None specified'}
          </div>
        );
      case 'slotRestriction':
        return (
          <div className="text-sm text-gray-700">
            Group: {params.group || 'Not specified'}, Max Slots: {params.maxSlots || 'Not specified'}
          </div>
        );
      case 'loadLimit':
        return (
          <div className="text-sm text-gray-700">
            Worker Group: {params.workerGroup || 'Not specified'}, Max Load: {params.maxLoad || 'Not specified'}
          </div>
        );
      case 'phaseWindow':
        return (
          <div className="text-sm text-gray-700">
            Task: {params.taskId || 'Not specified'}, Allowed Phases: {params.allowedPhases?.join(', ') || 'Not specified'}
          </div>
        );
      default:
        return <div className="text-sm text-gray-700">Custom parameters</div>;
    }
  };

  const updateNewRuleParameter = (key: string, value: string | number | string[] | number[]) => {
    setNewRule({
      ...newRule,
      parameters: { ...newRule.parameters, [key]: value }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Business Rules</h2>
        <button
          onClick={() => setShowAddRule(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </button>
      </div>

      {/* Natural Language Rule Input */}
      <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Wand2 className="w-6 h-6 text-purple-700 mr-2" />
          <h3 className="text-xl font-semibold text-gray-900">AI Rule Creator</h3>
        </div>
        
        <div className="space-y-4">
          <textarea
            value={naturalLanguageRule}
            onChange={(e) => setNaturalLanguageRule(e.target.value)}
            placeholder="Describe your rule in plain English (e.g., 'Tasks T12 and T14 should run together' or 'Limit GroupA to 5 slots per phase')"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
            rows={3}
          />
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Try: <span className="font-mono bg-white px-2 py-1 rounded border text-gray-800">&ldquo;T12 and T14 run together&rdquo;</span>, 
              <span className="font-mono bg-white px-2 py-1 rounded border text-gray-800 ml-1">&ldquo;Limit GroupA to 3 slots&rdquo;</span>, 
              <span className="font-mono bg-white px-2 py-1 rounded border text-gray-800 ml-1">&ldquo;T20 only in phase 1,2&rdquo;</span>
            </div>
            <button
              onClick={parseNaturalLanguageRule}
              disabled={!naturalLanguageRule.trim()}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Rule
            </button>
          </div>
        </div>

        {/* Available Data Summary */}
        <div className="mt-6 pt-4 border-t border-purple-200">
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <span className="font-medium text-purple-900">Available Tasks:</span>
              <div className="text-purple-800 max-h-20 overflow-y-auto mt-1 bg-white p-2 rounded border">
                {taskIds.length > 0 ? taskIds.slice(0, 5).join(', ') + (taskIds.length > 5 ? '...' : '') : 'No tasks loaded'}
              </div>
            </div>
            <div>
              <span className="font-medium text-purple-900">Client Groups:</span>
              <div className="text-purple-800 mt-1 bg-white p-2 rounded border">
                {clientGroups.length > 0 ? clientGroups.join(', ') : 'No groups found'}
              </div>
            </div>
            <div>
              <span className="font-medium text-purple-900">Worker Groups:</span>
              <div className="text-purple-800 mt-1 bg-white p-2 rounded border">
                {workerGroups.length > 0 ? workerGroups.join(', ') : 'No groups found'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Rules */}
      <div className="space-y-4 mb-6">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No rules defined yet</h4>
            <p className="text-gray-600">Add your first rule using the AI Rule Creator above!</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium mr-3 ${
                      rule.type === 'coRun' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      rule.type === 'slotRestriction' ? 'bg-green-100 text-green-800 border border-green-200' :
                      rule.type === 'loadLimit' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      rule.type === 'phaseWindow' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {rule.type}
                    </span>
                    <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{rule.description}</p>
                  {renderRuleParameters(rule)}
                </div>
                
                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                  title="Delete rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Rule Creation Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Rule</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Rule Type
                </label>
                <select
                  value={newRule.type}
                  onChange={(e) => setNewRule({...newRule, type: e.target.value as BusinessRule['type']})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="coRun">Co-Run</option>
                  <option value="slotRestriction">Slot Restriction</option>
                  <option value="loadLimit">Load Limit</option>
                  <option value="phaseWindow">Phase Window</option>
                  <option value="patternMatch">Pattern Match</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Enter rule name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Description
                </label>
                <textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="Describe what this rule does"
                  rows={3}
                />
              </div>
              
              {/* Rule-specific parameters */}
              {newRule.type === 'coRun' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Task IDs (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="T1, T2, T3"
                    onChange={(e) => updateNewRuleParameter('tasks', e.target.value.split(',').map(t => t.trim()))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                  {taskIds.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                      Available: {taskIds.slice(0, 10).join(', ')}
                    </div>
                  )}
                </div>
              )}
              
              {newRule.type === 'slotRestriction' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Group
                    </label>
                    <select
                      onChange={(e) => updateNewRuleParameter('group', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select group</option>
                      {clientGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Max Slots
                    </label>
                    <input
                      type="number"
                      min="1"
                      onChange={(e) => updateNewRuleParameter('maxSlots', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="Enter max slots"
                    />
                  </div>
                </div>
              )}

              {newRule.type === 'loadLimit' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Worker Group
                    </label>
                    <select
                      onChange={(e) => updateNewRuleParameter('workerGroup', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select group</option>
                      {workerGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Max Load
                    </label>
                    <input
                      type="number"
                      min="1"
                      onChange={(e) => updateNewRuleParameter('maxLoad', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="Enter max load"
                    />
                  </div>
                </div>
              )}

              {newRule.type === 'phaseWindow' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Task ID
                    </label>
                    <select
                      onChange={(e) => updateNewRuleParameter('taskId', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select task</option>
                      {taskIds.map(taskId => (
                        <option key={taskId} value={taskId}>{taskId}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Allowed Phases (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="1, 2, 3"
                      onChange={(e) => updateNewRuleParameter('allowedPhases', e.target.value.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddRule(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createManualRule}
                disabled={!newRule.name}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}