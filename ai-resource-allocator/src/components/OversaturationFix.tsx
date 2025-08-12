'use client';

import { useState } from 'react';
import { Zap, CheckCircle } from 'lucide-react';
import { Worker, ValidationError } from '@/lib/types';

interface OversaturationFixProps {
  workers: Worker[];
  validationErrors: ValidationError[];
  onWorkersFixed: (workers: Worker[]) => void;
  onFixComplete: () => void;
}

export function OversaturationFix({ 
  workers, 
  validationErrors, 
  onWorkersFixed, 
  onFixComplete 
}: OversaturationFixProps) {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string>('');

  const oversaturationErrors = validationErrors.filter(error => 
    error.message.includes('oversaturated')
  );

  const fixOversaturation = async () => {
    setIsFixing(true);
    
    // Strategy: Increase MaxLoadPerPhase for workers who can work in Phase 4
    const fixedWorkers = workers.map(worker => {
      const fixed = { ...worker };
      
      try {
        const availableSlots = JSON.parse(worker.AvailableSlots || '[]');
        
        // If worker can work in Phase 4, increase their capacity slightly
        if (Array.isArray(availableSlots) && availableSlots.includes(4)) {
          if (fixed.MaxLoadPerPhase < 6) { // Don't exceed reasonable limits
            fixed.MaxLoadPerPhase = Math.min(fixed.MaxLoadPerPhase + 1, 6);
          }
        }
      } catch {
        // Skip if can't parse AvailableSlots
      }
      
      return fixed;
    });

    onWorkersFixed(fixedWorkers);
    setFixResult('Increased capacity for workers available in Phase 4');
    setIsFixing(false);
    
    // Trigger re-validation
    setTimeout(() => {
      onFixComplete();
      setFixResult('');
    }, 2000);
  };

  if (oversaturationErrors.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-yellow-800 mb-1">Phase Oversaturation Detected</h4>
          <p className="text-sm text-yellow-700">
            {oversaturationErrors[0].message}
          </p>
        </div>
        
        <button
          onClick={fixOversaturation}
          disabled={isFixing}
          className="bg-yellow-500 text-white px-3 py-2 rounded-md hover:bg-yellow-600 disabled:opacity-50 transition-colors flex items-center text-sm"
        >
          <Zap className="w-4 h-4 mr-1" />
          {isFixing ? 'Fixing...' : 'Quick Fix'}
        </button>
      </div>
      
      {fixResult && (
        <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded flex items-center">
          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
          <span className="text-sm text-green-700">{fixResult}</span>
        </div>
      )}
    </div>
  );
}