import React, { useState } from 'react';

export function AdminSetup() {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!spreadsheetId) {
      setError('Please enter a Spreadsheet ID');
      return;
    }
    
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:3001/verify-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Spreadsheet verified and stored successfully! Quizzes can now be submitted.');
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      console.error(err);
      setError('Network error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow my-8 border-t-4 border-blue-500">
      <h2 className="text-xl font-bold mb-4">Admin: Google Sheets Setup</h2>
      <p className="mb-4 text-sm text-gray-600">
        Before accepting submissions, enter the master Google Spreadsheet ID where all quizzes will be stored.
        Ensure the spreadsheet is shared with Editor access to your service account email.
      </p>
      
      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Spreadsheet ID</label>
          <input 
            type="text" 
            value={spreadsheetId} 
            onChange={(e) => setSpreadsheetId(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="e.g. 1BxiMVs0XRYFgwnTEswE..."
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Sheet'}
        </button>
      </form>

      {message && <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">{message}</div>}
      {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
    </div>
  );
}
