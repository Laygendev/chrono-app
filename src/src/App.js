// 📁 src/App.js (séparation fond draggable / contenu UI pour éviter le bug d'opacity)
import React, { useState } from 'react';
import TimerCard from './components/TimerCard';
import './App.css';
import { Plus, X } from 'lucide-react';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';

const App = () => {
  const [timers, setTimers] = useState([1]);

  const addTimer = () => {
    setTimers(prev => [...prev, prev.length + 1]);
  };

  // Supprimer un chrono par son ID
  const deleteTimer = (id) => {
    setTimers(prev => prev.filter(timer => timer !== id));
  };

  const closeWindow = () => {
    if (window?.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('close-window');
    } else {
      window.close();
    }
  };

  return (
    <div className="min-h-screen relative text-black">
      {/* Zone draggable invisible derrière tout */}
      <div className="absolute inset-0 -z-10 drag" />

      {/* Contenu UI non draggable */}
      <div className="relative flex flex-col p-2">
        <div className="absolute top-0 right-0 z-10 p-2">
          <button
            onClick={closeWindow}
            className="text-sm text-gray-600 hover:text-black"
          >
            <X size={20} />
          </button>
        </div>

        <LayoutGroup>
          <div className="flex flex-col gap-1 overflow-auto mt-6">
            <AnimatePresence initial={false}>
              {timers.map(id => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 300 }}
                  transition={{ type: 'spring', duration: 0.4 }}
                >
                  <TimerCard key={id} id={id} onDelete={deleteTimer} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
        <div className="mt-2 text-center flex justify-end">
          <button
            onClick={addTimer}
            className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded flex justify-end"
          >
            <Plus size={18} /> Chrono
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;