'use client';

import { useState } from 'react';

export default function MigratePage() {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runMigration = async () => {
    try {
      setMigrating(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/admin/migrate-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Migration failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Data Migration</h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Migrate Comprehensive Profile Data</h2>
            <p className="text-gray-600 mb-4">
              This will merge rich profile data from the old CSV files into the current database structure. 
              This includes social media links, professional details, rates, studio information, and more.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Important Notes
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>This process will extend the profile table with additional fields</li>
                      <li>Existing profile data will be preserved and enhanced</li>
                      <li>The migration may take a few minutes to complete</li>
                      <li>Run this migration only once</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <h4 className="font-medium">Migration Error:</h4>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              <h4 className="font-medium">Migration Completed Successfully!</h4>
              <div className="mt-2">
                <p><strong>Total Profiles:</strong> {result.statistics.totalProfiles}</p>
                <p><strong>Active User Profiles:</strong> {result.statistics.activeUserProfiles}</p>
                <p><strong>Updated:</strong> {result.statistics.updated}</p>
                <p><strong>Created:</strong> {result.statistics.created}</p>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={runMigration}
              disabled={migrating}
              className={`px-6 py-3 rounded-md font-medium ${
                migrating
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {migrating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Migrating...
                </div>
              ) : (
                'Start Migration'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
