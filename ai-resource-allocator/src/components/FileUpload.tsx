// components/FileUpload.tsx
'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, Download, AlertCircle } from 'lucide-react';
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

  const [loadingVersion, setLoadingVersion] = useState<'v1' | 'v2' | null>(null);

  const intelligentColumnMapping = (headers: string[], expectedFields: string[]) => {
    const mapping: Record<string, string> = {};
    
    headers.forEach(header => {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      expectedFields.forEach(field => {
        const fieldNormalized = field.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Exact match first
        if (normalized === fieldNormalized) {
          mapping[header] = field;
          return;
        }
        
        // Partial matches for common variations
        if (normalized.includes(fieldNormalized) || fieldNormalized.includes(normalized)) {
          mapping[header] = field;
          return;
        }
        
        // Special cases for common naming variations
        // components/FileUpload.tsx (continued)

        // Special cases for common naming variations
        const specialMappings: Record<string, string[]> = {
          'ClientID': ['clientid', 'client_id', 'id', 'clientidentifier'],
          'ClientName': ['clientname', 'client_name', 'name', 'company', 'organization'],
          'PriorityLevel': ['prioritylevel', 'priority_level', 'priority', 'prio'],
          'RequestedTaskIDs': ['requestedtaskids', 'requested_task_ids', 'tasks', 'requestedtasks'],
          'GroupTag': ['grouptag', 'group_tag', 'group', 'clientgroup'],
          'AttributesJSON': ['attributesjson', 'attributes_json', 'attributes', 'metadata'],
          'WorkerID': ['workerid', 'worker_id', 'id', 'employeeid'],
          'WorkerName': ['workername', 'worker_name', 'name', 'employee', 'fullname'],
          'Skills': ['skills', 'skill', 'capabilities', 'expertise'],
          'AvailableSlots': ['availableslots', 'available_slots', 'slots', 'availability'],
          'MaxLoadPerPhase': ['maxloadperphase', 'max_load_per_phase', 'maxload', 'capacity'],
          'WorkerGroup': ['workergroup', 'worker_group', 'group', 'team'],
          'QualificationLevel': ['qualificationlevel', 'qualification_level', 'level', 'rating'],
          'TaskID': ['taskid', 'task_id', 'id', 'taskidentifier'],
          'TaskName': ['taskname', 'task_name', 'name', 'title'],
          'Category': ['category', 'type', 'classification'],
          'Duration': ['duration', 'length', 'time', 'phases'],
          'RequiredSkills': ['requiredskills', 'required_skills', 'skills', 'requirements'],
          'PreferredPhases': ['preferredphases', 'preferred_phases', 'phases', 'timing'],
          'MaxConcurrent': ['maxconcurrent', 'max_concurrent', 'concurrent', 'parallel']
        };
        
        // Check special mappings
        if (specialMappings[field] && specialMappings[field].includes(normalized)) {
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
        
        // Apply mappings
        Object.entries(mapping).forEach(([originalKey, mappedKey]) => {
          normalized[mappedKey] = row[originalKey];
        });
        
        // Fill in missing fields with empty values
        expectedFields[type].forEach(field => {
          if (normalized[field] === undefined) {
            normalized[field] = '';
          }
        });
        
        return normalized;
      }).filter(row => {
        // Filter out completely empty rows
        return Object.values(row).some(value => value !== '' && value !== null && value !== undefined);
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

  // Load sample data from public folder
  const loadSampleData = async (version: 'v1' | 'v2') => {
    setLoadingVersion(version);
    
    try {
      const sampleFiles = ['clients', 'workers', 'tasks'] as const;
      
      for (const fileType of sampleFiles) {
        setUploadStatus(prev => ({ ...prev, [fileType]: 'uploading' }));
        
        const response = await fetch(`/samples/${version}/${fileType}.csv`);
        
        if (!response.ok) {
          throw new Error(`Failed to load ${fileType} data`);
        }
        
        const csvText = await response.text();
        
        const result = Papa.parse(csvText, { 
          header: true, 
          skipEmptyLines: true,
          transformHeader: (header) => header.trim() // Clean headers
        });
        
        if (result.errors.length > 0) {
          console.warn(`Parsing warnings for ${fileType}:`, result.errors);
        }
        
        // Filter out empty rows
        const cleanData = (result.data as any[]).filter(row => {
          return Object.values(row).some(value => 
            value !== '' && value !== null && value !== undefined
          );
        });
        
        onDataUpload(cleanData, fileType);
        setUploadStatus(prev => ({ ...prev, [fileType]: 'success' }));
      }
    } catch (error) {
      console.error('Error loading sample data:', error);
      setUploadStatus({ clients: 'error', workers: 'error', tasks: 'error' });
    } finally {
      setLoadingVersion(null);
    }
  };

  const getStatusIcon = (status?: 'uploading' | 'success' | 'error') => {
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (status === 'uploading') return <div className="w-5 h-5 rounded-full bg-yellow-500 animate-pulse" />;
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = (status?: 'uploading' | 'success' | 'error') => {
    if (status === 'success') return 'Uploaded successfully';
    if (status === 'error') return 'Upload failed';
    if (status === 'uploading') return 'Uploading...';
    return 'Ready to upload';
  };

  const areAllFilesUploaded = () => {
    return uploadStatus.clients === 'success' && 
           uploadStatus.workers === 'success' && 
           uploadStatus.tasks === 'success';
  };

  const resetUploadStatus = () => {
    setUploadStatus({});
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Data Upload</h2>
        {areAllFilesUploaded() && (
          <button
            onClick={resetUploadStatus}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Reset & Upload New Files
          </button>
        )}
      </div>
      
      <p className="text-gray-600 mb-6">
        Upload your CSV or XLSX files. Our AI will intelligently map columns even with non-standard headers.
      </p>
      
      {/* Sample Data Loader */}
      <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-3 flex items-center">
          <Download className="w-5 h-5 mr-2" />
          Quick Start with Sample Data
        </h3>
        
        <p className="text-sm text-blue-700 mb-4">
          Load complete datasets from the provided Google Sheets to get started immediately.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => loadSampleData('v1')}
            disabled={loadingVersion !== null}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loadingVersion === 'v1' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading V1...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Load V1 Sample Data
              </>
            )}
          </button>
          
          <button
            onClick={() => loadSampleData('v2')}
            disabled={loadingVersion !== null}
            className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loadingVersion === 'v2' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading V2...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Load V2 Sample Data
              </>
            )}
          </button>
        </div>
        
        <div className="mt-3 text-xs text-blue-600">
          V1 and V2 contain different data variations to test various scenarios and edge cases.
        </div>
      </div>
      
      {/* Manual File Upload */}
      <div className="space-y-4 mb-6">
        <h3 className="font-medium text-gray-900">Or Upload Your Own Files</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          {(['clients', 'workers', 'tasks'] as const).map((type) => (
            <div 
              key={type} 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                uploadStatus[type] === 'success' 
                  ? 'border-green-300 bg-green-50' 
                  : uploadStatus[type] === 'error'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <div className="flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-gray-400 mr-2" />
                {getStatusIcon(uploadStatus[type])}
              </div>
              
              <h3 className="text-lg font-medium mb-2 capitalize">{type}</h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {getStatusText(uploadStatus[type])}
              </p>
              
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload(e, type)}
                className="hidden"
                id={`${type}-upload`}
                disabled={uploadStatus[type] === 'uploading'}
              />
              
              <label
                htmlFor={`${type}-upload`}
                className={`cursor-pointer px-4 py-2 rounded-md transition-colors inline-block ${
                  uploadStatus[type] === 'uploading'
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : uploadStatus[type] === 'success'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {uploadStatus[type] === 'uploading' ? 'Processing...' :
                 uploadStatus[type] === 'success' ? 'Replace File' : 'Choose File'}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Progress Summary */}
      {Object.keys(uploadStatus).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Upload Status</h4>
          <div className="space-y-2">
            {(['clients', 'workers', 'tasks'] as const).map((type) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="capitalize font-medium">{type}:</span>
                <div className="flex items-center">
                  {getStatusIcon(uploadStatus[type])}
                  <span className={`ml-2 ${
                    uploadStatus[type] === 'success' ? 'text-green-700' :
                    uploadStatus[type] === 'error' ? 'text-red-700' :
                    'text-gray-700'
                  }`}>
                    {getStatusText(uploadStatus[type])}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {areAllFilesUploaded() && (
            <div className="mt-4 p-3 bg-green-100 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  All files uploaded successfully! You can now proceed to validate and edit your data.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
          