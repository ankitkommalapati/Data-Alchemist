'use client';

import { useState, useCallback } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Client, Worker, Task } from '@/lib/types';

interface AISearchProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  onFilter: (results: { clients: Client[]; workers: Worker[]; tasks: Task[] }) => void;
}

export function AISearch({ clients, workers, tasks, onFilter }: AISearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions] = useState([
    "All tasks with duration more than 2 phases",
    "Workers available in phase 1 and 2",
    "High priority clients in GroupA",
    "Tasks requiring JavaScript skills",
    "Workers with qualification level above 3"
  ]);

  const parseNaturalLanguageQuery = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    const filters: any = {
      clients: (client: Client) => true,
      workers: (worker: Worker) => true,
      tasks: (task: Task) => true
    };

    // Duration filters
    if (lowercaseQuery.includes('duration more than')) {
      const match = lowercaseQuery.match(/duration more than (\d+)/);
      if (match) {
        const threshold = parseInt(match[1]);
        filters.tasks = (task: Task) => task.Duration > threshold;
      }
    }

    // Priority filters
    if (lowercaseQuery.includes('high priority')) {
      filters.clients = (client: Client) => client.PriorityLevel >= 4;
    }
    if (lowercaseQuery.includes('low priority')) {
      filters.clients = (client: Client) => client.PriorityLevel <= 2;
    }

    // Group filters
    const groupMatch = lowercaseQuery.match(/group\s*([a-z])/);
    if (groupMatch) {
      const group = `Group${groupMatch[1].toUpperCase()}`;
      filters.clients = (client: Client) => client.GroupTag === group;
    }

    // Skills filters
    const skillsMatch = lowercaseQuery.match(/requiring\s+([a-z\s]+)\s+skills?/);
    if (skillsMatch) {
      const skill = skillsMatch[1].trim();
      filters.tasks = (task: Task) => task.RequiredSkills.toLowerCase().includes(skill);
    }

    // Phase filters
    const phaseMatch = lowercaseQuery.match(/available in phase\s+(\d+)(?:\s+and\s+(\d+))?/);
    if (phaseMatch) {
      const phase1 = phaseMatch[1];
      const phase2 = phaseMatch[2];
      filters.workers = (worker: Worker) => {
        const slots = worker.AvailableSlots;
        return phase2 ? 
          slots.includes(phase1) && slots.includes(phase2) :
          slots.includes(phase1);
      };
    }

    return filters;
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const filters = parseNaturalLanguageQuery(query);
    
    const filteredResults = {
      clients: clients.filter(filters.clients),
      workers: workers.filter(filters.workers),
      tasks: tasks.filter(filters.tasks)
    };
    
    onFilter(filteredResults);
    setIsSearching(false);
  }, [query, clients, workers, tasks, parseNaturalLanguageQuery, onFilter]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-4">
        <Sparkles className="w-6 h-6 text-blue-500 mr-2" />
        <h3 className="text-xl font-semibold">AI-Powered Search</h3>
      </div>
      
      <div className="flex space-x-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search with natural language (e.g., 'All tasks with duration more than 2 phases')"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setQuery(suggestion)}
              className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}