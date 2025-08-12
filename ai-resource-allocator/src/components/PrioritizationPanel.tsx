'use client';

import { useState } from 'react';
import { Sliders, RotateCcw, Download } from 'lucide-react';

interface Priority {
  id: string;
  name: string;
  weight: number;
  description: string;
}

interface PrioritizationPanelProps {
  onWeightsChange: (weights: Record<string, number>) => void;
}

export function PrioritizationPanel({ onWeightsChange }: PrioritizationPanelProps) {
  const [priorities, setPriorities] = useState<Priority[]>([
    {
      id: 'priorityLevel',
      name: 'Client Priority Level',
      weight: 70,
      description: 'How much to favor high-priority clients'
    },
    {
      id: 'taskFulfillment',
      name: 'Task Fulfillment Rate',
      weight: 85,
      description: 'Preference for completing requested tasks'
    },
    {
      id: 'workerUtilization',
      name: 'Worker Utilization',
      weight: 60,
      description: 'Efficiency of resource allocation'
    },
    {
      id: 'fairness',
      name: 'Fairness Distribution',
      weight: 50,
      description: 'Equal treatment across clients/workers'
    },
    {
      id: 'skillMatching',
      name: 'Skill Matching Quality',
      weight: 80,
      description: 'How well worker skills match task requirements'
    },
    {
      id: 'timeWindow',
      name: 'Time Window Preferences',
      weight: 65,
      description: 'Respecting preferred phases and timing'
    }
  ]);

  const [activeProfile, setActiveProfile] = useState<string>('custom');

  const profiles = {
    'maximize-fulfillment': {
      name: 'Maximize Fulfillment',
      description: 'Focus on completing as many tasks as possible',
      weights: {
        priorityLevel: 60,
        taskFulfillment: 95,
        workerUtilization: 80,
        fairness: 40,
        skillMatching: 85,
        timeWindow: 50
      }
    },
    'fair-distribution': {
      name: 'Fair Distribution',
      description: 'Ensure equal treatment for all parties',
      weights: {
        priorityLevel: 30,
        taskFulfillment: 70,
        workerUtilization: 60,
        fairness: 90,
        skillMatching: 75,
        timeWindow: 60
      }
    },
    'minimize-workload': {
      name: 'Minimize Workload',
      description: 'Optimize for efficient resource usage',
      weights: {
        priorityLevel: 50,
        taskFulfillment: 60,
        workerUtilization: 95,
        fairness: 70,
        skillMatching: 80,
        timeWindow: 40
      }
    },
    'quality-focused': {
      name: 'Quality Focused',
      description: 'Prioritize skill matching and quality outcomes',
      weights: {
        priorityLevel: 80,
        taskFulfillment: 75,
        workerUtilization: 50,
        fairness: 60,
        skillMatching: 95,
        timeWindow: 85
      }
    }
  };

  const handleWeightChange = (id: string, newWeight: number) => {
    const updatedPriorities = priorities.map(priority =>
      priority.id === id ? { ...priority, weight: newWeight } : priority
    );
    setPriorities(updatedPriorities);
    
    const weights = updatedPriorities.reduce((acc, priority) => {
      acc[priority.id] = priority.weight;
      return acc;
    }, {} as Record<string, number>);
    
    onWeightsChange(weights);
    setActiveProfile('custom');
  };

  const applyProfile = (profileKey: string) => {
    const profile = profiles[profileKey as keyof typeof profiles];
    if (profile) {
      const updatedPriorities = priorities.map(priority => ({
        ...priority,
        weight: profile.weights[priority.id as keyof typeof profile.weights] || 50
      }));
      setPriorities(updatedPriorities);
      setActiveProfile(profileKey);
      onWeightsChange(profile.weights);
    }
  };

  const resetWeights = () => {
    const resetPriorities = priorities.map(priority => ({
      ...priority,
      weight: 50
    }));
    setPriorities(resetPriorities);
    setActiveProfile('custom');
    
    const weights = resetPriorities.reduce((acc, priority) => {
      acc[priority.id] = 50;
      return acc;
    }, {} as Record<string, number>);
    onWeightsChange(weights);
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 80) return 'bg-red-500';
    if (weight >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const exportConfiguration = () => {
    const config = {
      profile: activeProfile,
      weights: priorities.reduce((acc, p) => {
        acc[p.id] = p.weight;
        return acc;
      }, {} as Record<string, number>),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prioritization-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sliders className="w-6 h-6 mr-2" />
            Prioritization & Weights
          </h2>
          <p className="text-gray-700 mt-1 font-medium">
            Configure how the allocation algorithm should balance different criteria
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={resetWeights}
            className="flex items-center px-3 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </button>
          <button
            onClick={exportConfiguration}
            className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium"
          >
            <Download className="w-4 h-4 mr-1" />
            Export Config
          </button>
        </div>
      </div>

      {/* Profile Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Profiles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(profiles).map(([key, profile]) => (
            <div
              key={key}
              onClick={() => applyProfile(key)}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                activeProfile === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
              }`}
            >
              <h4 className="font-semibold text-gray-900 mb-2">{profile.name}</h4>
              <p className="text-sm text-gray-700">{profile.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weight Sliders */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-900">Fine-tune Priorities</h3>
        
        {priorities.map((priority) => (
          <div key={priority.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-gray-900">{priority.name}</h4>
                <p className="text-sm text-gray-700">{priority.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-bold text-gray-900 w-12 text-center">
                  {priority.weight}%
                </span>
                <div className={`w-3 h-3 rounded-full ${getWeightColor(priority.weight)}`} />
              </div>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={priority.weight}
                onChange={(e) => handleWeightChange(priority.id, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div 
                className="absolute top-0 left-0 h-2 bg-blue-500 rounded-lg transition-all duration-200 pointer-events-none"
                style={{ width: `${priority.weight}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Weight Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-bold text-gray-900 mb-3">Configuration Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {priorities.map((priority) => (
            <div key={priority.id} className="flex justify-between">
              <span className="text-gray-800 truncate mr-2 font-medium">{priority.name}:</span>
              <span className="font-bold text-gray-900">{priority.weight}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}