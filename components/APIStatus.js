// components/APIStatus.js - Create this new component
'use client';
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function APIStatus() {
  const [status, setStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);

  const checkAPI = async () => {
    setStatus('checking');
    const isHealthy = await api.healthCheck();
    setStatus(isHealthy ? 'healthy' : 'down');
    setLastChecked(new Date());
  };

  useEffect(() => {
    checkAPI();
    // Check every 5 minutes
    const interval = setInterval(checkAPI, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-sm font-semibold ${
      status === 'healthy' ? 'bg-green-500 text-white' :
      status === 'down' ? 'bg-red-500 text-white' :
      'bg-yellow-500 text-black'
    }`}>
      API: {status === 'healthy' ? '✅ Online' : status === 'down' ? '❌ Offline' : '🔄 Checking...'}
    </div>
  );
}