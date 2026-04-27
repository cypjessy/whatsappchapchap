'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, getDocs, limit, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

function getFirebaseApp() {
  if (typeof window === 'undefined') return null;
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

function getDb() {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

interface WebhookError {
  id: string;
  tenantId: string;
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  context?: Record<string, any>;
  timestamp: any;
  resolved: boolean;
}

export default function WebhookLogsPage() {
  const { user } = useAuth();
  const [errors, setErrors] = useState<WebhookError[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');

  useEffect(() => {
    if (user) {
      loadErrors();
    }
  }, [user, filter]);

  const loadErrors = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const db = getDb();
      if (!db) return;
      
      const q = query(
        collection(db, 'webhookErrors'),
        where('tenantId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const snap = await getDocs(q);
      const errorsList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WebhookError[];
      
      if (filter === 'unresolved') {
        setErrors(errorsList.filter(e => !e.resolved));
      } else if (filter === 'resolved') {
        setErrors(errorsList.filter(e => e.resolved));
      } else {
        setErrors(errorsList);
      }
    } catch (error) {
      console.error('Error loading webhook errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (errorId: string) => {
    try {
      const db = getDb();
      if (!db) return;
      
      await updateDoc(doc(db, 'webhookErrors', errorId), {
        resolved: true,
      });
      loadErrors();
    } catch (error) {
      console.error('Error marking error as resolved:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Webhook Error Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and debug webhook processing errors
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('unresolved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unresolved'
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Unresolved ({errors.filter(e => !e.resolved).length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'resolved'
                ? 'bg-green-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Resolved ({errors.filter(e => e.resolved).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All ({errors.length})
          </button>
        </div>

        {/* Error List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading errors...</p>
          </div>
        ) : errors.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No errors found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All webhook processing is working correctly!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {errors.map((error) => (
              <div
                key={error.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Error Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          error.errorType.includes('TIMEOUT') 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                          {error.errorType}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTimestamp(error.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-2 rounded">
                        {error.errorMessage}
                      </p>
                    </div>
                    {!error.resolved && (
                      <button
                        onClick={() => markAsResolved(error.id)}
                        className="ml-4 px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Details */}
                <div className="p-4 space-y-3">
                  {error.context && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Context
                      </h4>
                      <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {error.errorStack && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Stack Trace
                      </h4>
                      <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                        {error.errorStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  function formatTimestamp(ts: any): string {
    if (!ts) return 'Unknown time';
    if (ts?.toDate) {
      const date = ts.toDate();
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    }
    if (typeof ts === 'string') {
      const date = new Date(ts);
      return date.toLocaleString();
    }
    return 'Unknown time';
  }
}
