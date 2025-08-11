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

export function RulesBuilder({ clients, workers, tasks, rules, onRulesChange }: RulesBuilderProps) {
  const [showAddRule, setShowAddRule] = useState(false);
  const [naturalLanguageRule, setNaturalLanguageRule] = useState('');
  const [newRule, setNewRule] = useState<Partial<BusinessRule>>({
    type: 'coRun',
    name: '',
    description: '',
    parameters: {}
  });

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
    switch (rule.type) {
      case 'coRun':
        return (
          <div className="text-sm text-gray-600">
            Tasks: {rule.parameters.tasks?.join(', ') || 'None specified'}
          </div>
        );
      case 'slotRestriction':
        return (
          <div className="text-sm text-gray-600">
            Group: {rule.parameters.group}, Max Slots: {rule.parameters.maxSlots}
          </div>
        );
      case 'loadLimit':
        return (
          <div className="text-sm text-gray-600">
            Worker Group: {rule.parameters.workerGroup}, Max Load: {rule.parameters.maxLoad}
          </div>
        );
      case 'phaseWindow':
        return (
          <div className="text-sm text-gray-600">
            Task: {rule.parameters.taskId}, Allowed Phases: {rule.parameters.allowedPhases?.join(', ')}
          </div>
        );
      default:
        return <div className="text-sm text-gray-600">Custom parameters</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Business Rules</h2>
        <button
          onClick={() => setShowAddRule(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </button>
      </div>

      {/* Natural Language Rule Input */}
      <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Wand2 className="w-6 h-6 text-purple-600 mr-2" />
          <h3 className="text-xl font-semibold text-gray-900">AI Rule Creator</h3>
        </div>
        
        <div className="space-y-4">
          <textarea
            value={naturalLanguageRule}
            onChange={(e) => setNaturalLanguageRule(e.target.value)}
            placeholder="Describe your rule in plain English (e.g., 'Tasks T12 and T14 should run together' or 'Limit GroupA to 5 slots per phase')"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Try: "T12 and T14 run together", "Limit GroupA to 3 slots", "T20 only in phase 1,2"
            </div>
            <button
              onClick={parseNaturalLanguageRule}
              disabled={!naturalLanguageRule.trim()}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              Create Rule
            </button>
          </div>
        </div>
      </div>

      {/* Existing Rules */}
      <div className="space-y-4 mb-6">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No rules defined yet. Add your first rule above!
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium mr-3 ${
                      rule.type === 'coRun' ? 'bg-blue-100 text-blue-800' :
                      rule.type === 'slotRestriction' ? 'bg-green-100 text-green-800' :
                      rule.type === 'loadLimit' ? 'bg-yellow-100 text-yellow-800' :
                      rule.type === 'phaseWindow' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.type}
                    </span>
                    <h4 className="font-medium text-gray-900">{rule.name}</h4>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{rule.description}</p>
                  {renderRuleParameters(rule)}
                </div>
                
                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Rule</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Type
                </label>
                <select
                  value={newRule.type}
                  onChange={(e) => setNewRule({...newRule, type: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="coRun">Co-Run</option>
                  <option value="slotRestriction">Slot Restriction</option>
                  <option value="loadLimit">Load Limit</option>
                  <option value="phaseWindow">Phase Window</option>
                  <option value="patternMatch">Pattern Match</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter rule name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this rule does"
                  rows={3}
                />
              </div>
              
              {/* Rule-specific parameters */}
              {newRule.type === 'coRun' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task IDs (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="T1, T2, T3"
                    onChange={(e) => setNewRule({
                      ...newRule, 
                      parameters: {...newRule.parameters, tasks: e.target.value.split(',').map(t => t.trim())}
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              
              {newRule.type === 'slotRestriction' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group
                    </label>
                    <select
                      onChange={(e) => setNewRule({
                        ...newRule, 
                        parameters: {...newRule.parameters, group: e.target.value}
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select group</option>
                      <option value="GroupA">GroupA</option>
                      <option value="GroupB">GroupB</option>
                      <option value="GroupC">GroupC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Slots
                    </label>
                    <input
                      type="number"
                      min="1"
                      onChange={(e) => setNewRule({
                        ...newRule, 
                        parameters: {...newRule.parameters, maxSlots: parseInt(e.target.value)}
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddRule(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createManualRule}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
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