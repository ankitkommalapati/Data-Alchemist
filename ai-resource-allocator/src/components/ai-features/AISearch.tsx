// components/ai-features/AISearch.tsx
'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Client, Worker, Task, FilteredResults } from '@/lib/types';

interface AISearchProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  onFilter: (results: FilteredResults) => void;
}

export function AISearch({ clients, workers, tasks, onFilter }: AISearchProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    // Basic search implementation
    onFilter({ clients, workers, tasks });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-4">AI Search (Coming Soon)</h3>
      <div className="flex space-x-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search with natural language..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-600"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center font-medium"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </button>
      </div>
    </div>
  );
}