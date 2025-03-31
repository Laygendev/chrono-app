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
      window.close();
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-white/40 backdrop-blur-sm text-black p-2">
      <button
        onClick={closeWindow}
        className="absolute top-2 right-2 text-sm text-gray-600 hover:text-black"
      >
        ✕
      </button>

      <div className="flex flex-col gap-1 overflow-auto mt-6">
        {timers.map(id => <TimerCard key={id} id={id} />)}
      </div>

      <div className="mt-2 text-center">
        <button
          onClick={addTimer}
          className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        >
          ➕ Chrono
        </button>
      </div>
    </div>
  );
};

export default App;