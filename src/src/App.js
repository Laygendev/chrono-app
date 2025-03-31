// 📁 src/App.js (séparation fond draggable / contenu UI pour éviter le bug d'opacity)
import React, { useEffect, useState } from 'react';
import TimerCard from './components/TimerCard';
import './App.css';
import { Plus, X } from 'lucide-react';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';

const COLORS = [
  'bg-pink-100',
  'bg-blue-100',
  'bg-green-100',
  'bg-yellow-100',
  'bg-purple-100',
  'bg-orange-100',
  'bg-red-100',
  'bg-cyan-100',
  'bg-lime-100',
];

const App = () => {
  const [timers, setTimers] = useState([crypto.randomUUID()]);
  const [activeTimers, setActiveTimers] = useState({});
  const [activeTimerId, setActiveTimerId] = useState(null);

  const addTimer = () => {
    const newId = crypto.randomUUID();
    setTimers(prev => [...prev, newId]);
  };

  // Supprimer un chrono par son ID
  const deleteTimer = (id) => {
    setTimers(prev => prev.filter(timer => timer !== id));
    setActiveTimers(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeTimerId === id) {
      setActiveTimerId(null);
    }
  };

  const closeWindow = () => {
    if (window?.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('close-window');
    } else {
      window.close();
    }
  };

  const updateRunningStatus = (id, isRunning) => {
    setActiveTimers(prev => ({ ...prev, [id]: isRunning }));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const anyRunning = Object.values(activeTimers).some(Boolean);
      if (anyRunning) {
        new Notification('⏱️ Chrono actif', {
          body: 'Un chrono est toujours en cours.',
        });
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [activeTimers]);

  const AnimatedBackground = () => {
    return (
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="w-full h-full relative">
          {/* Pulsation centrale */}
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-cyan-400/20 blur-3xl shadow-lg drop-shadow-neon"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 60px 20px rgba(0, 255, 255, 0.3)',
            }}
          />
  
          {/* Cercles en expansion */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-cyan-500/30"
              initial={{ scale: 0.5, opacity: 0.9 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatDelay: 0.5,
                delay: i * 1.2,
                ease: 'easeOut',
              }}
              style={{
                top: '50%',
                left: '50%',
                width: '400px',
                height: '400px',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 80px rgba(155, 94, 255, 0.3)',
              }}
            />
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen relative text-black">
      {/* Zone draggable invisible derrière tout */}
      <div className="absolute inset-0 -z-10 drag overflow-hidden">
        {Object.values(activeTimers).some(Boolean) && <AnimatedBackground />}
      </div>

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
              {timers.length === 0 && (
                <div className="text-center text-gray-500 italic my-4">
                  Cliquez sur <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 rounded text-sm"><Plus size={14} /> Chrono</span> pour ajouter un minuteur
                </div>
              )}

              {timers.map((id, index) => {
                const colorClass = COLORS[index % COLORS.length];

                return (<motion.div
                  key={id}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 300 }}
                  transition={{ type: 'spring', duration: 0.4 }}
                >
                  <TimerCard id={id} onDelete={deleteTimer} onRunningChange={updateRunningStatus} isActive={activeTimerId === id} onActivate={() => setActiveTimerId(id)} color={colorClass} />
                </motion.div>
              )})}
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