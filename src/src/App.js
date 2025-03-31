import React, { useState } from 'react';
import TimerCard from './components/TimerCard';
import './App.css';

const App = () => {
  const [timers, setTimers] = useState([1]);

  const addTimer = () => {
    setTimers(prev => [...prev, prev.length + 1]);
  };

  const closeWindow = () => {
    if (window?.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('close-window');
    } else {
      window.close(); // fallback en dev si electron n'est pas exposé
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 space-y-4 relative">
      {/* Bouton X */}
      <button
        onClick={closeWindow}
        className="absolute top-2 right-2 text-white bg-red-600 rounded-full px-3 py-1 hover:bg-red-700 text-sm shadow-lg"
      >
        ✕
      </button>

      <h1 className="text-4xl font-bold text-center mb-6">Multi-Timer</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {timers.map(id => <TimerCard key={id} id={id} />)}
      </div>
      <div className="text-center">
        <button
          onClick={addTimer}
          className="bg-green-600 px-6 py-3 rounded-full text-white text-lg shadow-md"
        >
          ➕ Ajouter un chrono
        </button>
      </div>
    </div>
  );
};

export default App;