'use client';

import { AlertTriangle, CheckCircle, AlertCircle, Info, Zap } from 'lucide-react';
import { ValidationError } from '@/lib/types';

interface ValidationPanelProps {
  errors: ValidationError[];
  onQuickFix?: (errorType: string) => void;
}

export function ValidationPanel({ errors, onQuickFix }: ValidationPanelProps) {
  const errorsByType = errors.reduce((acc, error) => {
    acc[error.severity] = (acc[error.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const errorsByEntity = errors.reduce((acc, error) => {
    acc[error.entity] = (acc[error.entity] || []);
    acc[error.entity].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  if (errors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center p-8 text-green-600">
          <CheckCircle className="w-8 h-8 mr-3" />
          <div>
            <h3 className="font-semibold text-lg">All validations passed!</h3>
            <p className="text-green-700">Your data is clean and ready for processing.</p>
          </div>
        </div>
      </div>
    );
  }

  const getQuickFixButton = (error: ValidationError) => {
    if (error.message.includes('oversaturated') && onQuickFix) {
      return (
        <button
          onClick={() => onQuickFix('oversaturation')}
          className="ml-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 transition-colors flex items-center"
        >
          <Zap className="w-3 h-3 mr-1" />
          Quick Fix
        </button>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Validation Results</h3>
        <div className="flex space-x-4 text-sm">
          {errorsByType.error && (
            <span className="text-red-600 font-medium">
              {errorsByType.error} errors
            </span>
          )}
          {errorsByType.warning && (
            <span className="text-yellow-600 font-medium">
              {errorsByType.warning} warnings
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(errorsByEntity).map(([entity, entityErrors]) => (
          <div key={`entity-${entity}`} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 capitalize">
              {entity} Issues ({entityErrors.length})
            </h4>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {entityErrors.map((error, errorIndex) => (
                <div
                  key={`${error.entity}-${error.field}-${error.row}-${errorIndex}`}
                  className={`border rounded p-3 ${getSeverityColor(error.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      {getIcon(error.severity)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            Row {error.row + 1} • {error.field}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            error.severity === 'error' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {error.severity}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{error.message}</p>
                      </div>
                    </div>
                    {getQuickFixButton(error)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}