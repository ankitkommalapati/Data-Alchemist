'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface FileUploadProps {
  onDataUpload: (data: any[], type: 'clients' | 'workers' | 'tasks') => void;
}

export function FileUpload({ onDataUpload }: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<{
    clients?: 'uploading' | 'success' | 'error';
    workers?: 'uploading' | 'success' | 'error';
    tasks?: 'uploading' | 'success' | 'error';
  }>({});

  const intelligentColumnMapping = (headers: string[], expectedFields: string[]) => {
    const mapping: Record<string, string> = {};
    
    headers.forEach(header => {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      expectedFields.forEach(field => {
        const fieldNormalized = field.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (normalized.includes(fieldNormalized) || fieldNormalized.includes(normalized)) {
          mapping[header] = field;
        }
      });
    });
    
    return mapping;
  };

  const processFile = useCallback(async (file: File, type: 'clients' | 'workers' | 'tasks') => {
    setUploadStatus(prev => ({ ...prev, [type]: 'uploading' }));
    
    try {
      const fileBuffer = await file.arrayBuffer();
      let data: any[] = [];
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else if (file.name.endsWith('.csv')) {
        const text = new TextDecoder().decode(fileBuffer);
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        data = result.data as any[];
      }

      // AI-powered column mapping
      const expectedFields = {
        clients: ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'],
        workers: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'],
        tasks: ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent']
      };

      const headers = Object.keys(data[0] || {});
      const mapping = intelligentColumnMapping(headers, expectedFields[type]);
      
      // Apply mapping and normalize data
      const normalizedData = data.map(row => {
        const normalized: any = {};
        Object.entries(mapping).forEach(([originalKey, mappedKey]) => {
          normalized[mappedKey] = row[originalKey];
        });
        return normalized;
      });

      onDataUpload(normalizedData, type);
      setUploadStatus(prev => ({ ...prev, [type]: 'success' }));
    } catch (error) {
      console.error(`Error processing ${type} file:`, error);
      setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
    }
  }, [onDataUpload]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'clients' | 'workers' | 'tasks') => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file, type);
    }
  };

  const getStatusIcon = (status?: 'uploading' | 'success' | 'error') => {
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'error') return <div className="w-5 h-5 rounded-full bg-red-500" />;
    if (status === 'uploading') return <div className="w-5 h-5 rounded-full bg-yellow-500 animate-pulse" />;
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Data Upload</h2>
      <p className="text-gray-600 mb-6">Upload your CSV or XLSX files. Our AI will intelligently map columns even with non-standard headers.</p>
      
      <div className="grid md:grid-cols-3 gap-6">
        {(['clients', 'workers', 'tasks'] as const).map((type) => (
          <div key={type} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <div className="flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
              {getStatusIcon(uploadStatus[type])}
            </div>
            <h3 className="text-lg font-medium mb-2 capitalize">{type}</h3>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFileUpload(e, type)}
              className="hidden"
              id={`${type}-upload`}
            />
            <label
              htmlFor={`${type}-upload`}
              className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors inline-block"
            >
              Choose File
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}