import React, { useState } from 'react';
import TimerCard from './components/TimerCard';

const App = () => {
  const [timers, setTimers] = useState([1]);

  const addTimer = () => {
    setTimers(prev => [...prev, prev.length + 1]);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 space-y-4">
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
