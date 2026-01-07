
import React, { useState, useRef } from 'react';
import { FileUp, Play, Download, Trash2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { processCsvData } from './utils/csvHelper';
import { ProcessingResult } from './types';
import { CustomDatePicker } from './components/DatePicker';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetDate, setTargetDate] = useState<string>(''); // YYYY-MM-DD for storage
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a valid CSV file.');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRun = async () => {
    if (!file || !targetDate) {
      setError('Please provide both a CSV file and a target date.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // Input date is YYYY-MM-DD, convert to JS Date (start of month)
          const [year, month, day] = targetDate.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day);

          const { processedContent, addedCount } = processCsvData(content, dateObj);
          
          setResult({
            content: processedContent,
            rowCount: processedContent.split('\n').length - 1,
            newEntriesCount: addedCount,
            fileName: `modified_${file.name}`
          });
        } catch (err: any) {
          setError(err.message || 'An error occurred while processing the file.');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        setIsProcessing(false);
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Unexpected error during processing.');
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([result.content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', result.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          CSV Capacity Extender
        </h1>
        <p className="text-lg text-slate-600">
          Upload your employee capacity matrix and project data to a future month.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Step 1: File Upload */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-semibold">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">1</span>
            <h2>Select CSV File</h2>
          </div>
          
          {!file ? (
            <label className="group relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileUp className="w-10 h-10 text-slate-400 group-hover:text-blue-500 mb-3" />
                <p className="mb-2 text-sm text-slate-500 font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-400">CSV file with Nom, Capacité, Mois, Année, BU</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".csv" 
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[150px]">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button 
                onClick={removeFile}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Remove file"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </section>

        {/* Step 2: Target Date */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-semibold">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">2</span>
            <h2>Target Date</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-2">
              Select the specific date for projection.
            </p>
            <CustomDatePicker 
              value={targetDate} 
              onChange={setTargetDate} 
            />
            <p className="text-xs text-slate-400 italic">
              Click the field above to open the calendar. Capacity will be copied from the latest existing entry for all unique persons.
            </p>
          </div>
        </section>
      </div>

      {/* Action Area */}
      <div className="flex flex-col items-center gap-6 mb-12">
        <button
          onClick={handleRun}
          disabled={!file || !targetDate || isProcessing}
          className={`flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold shadow-lg transition-all duration-200 active:scale-95 ${
            !file || !targetDate || isProcessing
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              Run Processing
            </>
          )}
        </button>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm w-full max-w-md animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Result Area */}
      {result && (
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 flex items-center justify-center rounded-full">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Processing Complete</h2>
                <p className="text-slate-500">Your CSV has been successfully modified.</p>
              </div>
            </div>
            
            <button
              onClick={downloadResult}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md hover:shadow-green-100 transition-all active:scale-95"
            >
              <Download className="w-5 h-5" />
              Download Modified CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Total Rows</p>
              <p className="text-2xl font-black text-slate-800">{result.rowCount}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs uppercase tracking-wider font-bold text-blue-400 mb-1">New Entries Added</p>
              <p className="text-2xl font-black text-blue-800">+{result.newEntriesCount}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default App;
