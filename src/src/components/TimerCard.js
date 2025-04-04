import React, { useState, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import TimerModal from './TimerModal';
import { Play, Pause, StopCircle, Trash } from 'lucide-react';
import { motion } from 'framer-motion';

const TimerCard = ({ id, onDelete, onSuccessCallback, onRunningChange, isActive, onActivate, color, projectList, setProjectList, projectListTMA, setProjectListTMA }) => {
  const { time, start, pause, reset } = useTimer();
  const [modalState, setModalState] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleToggle = () => {
    if (isRunning) {
      pause();
      setIsRunning(false);
    } else {
      onActivate(); // 🔥 Notifie App.js qu’on démarre ce chrono
      start();
      setIsRunning(true);
    }
  };

  let pressTimer;

  const handleStopPress = () => {
    pressTimer = setTimeout(() => {
      // Appui long : ouvrir étape 1
      handleStop(true);
    }, 500);
  };

  const handleStopRelease = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      // Appui court : ouvrir étape 2 avec catégorie TMA
      setModalState({ step: 2, selectedCategory: 'Maintenance' });
      handleStop(); // sans modal immédiate
    }
  };

  const handleStop = (hasToShowModal = false) => {
    pause();
    setIsRunning(false);
    onRunningChange?.(id, false);

    if (hasToShowModal) {
      setModalState(true);
    }
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm('Êtes-vous sûr de vouloir supprimer ce chrono ?');
    if (confirmDelete) {
      onDelete(id); // Appel de la fonction de suppression passée en prop
    }
  };

  const onSuccess = () => {
    onSuccessCallback(id);
    onDelete(id);
  };

  useEffect(() => {
    if (!isActive && isRunning) {
      pause();
      setIsRunning(false);
      onRunningChange?.(id, false);
    }
  }, [isActive]);

  useEffect(() => {
    onRunningChange(id, isRunning);
  }, [isRunning]);

  useEffect(() => {
    const handleIpcStop = () => handleStop(false); // ✅ évite la récursion

    window.electron.ipcRenderer.on('stop-all-chronos', handleIpcStop);
    return () => {
      window.electron.ipcRenderer.removeListener('stop-all-chronos', handleIpcStop);
      pause();
    };
  }, []);


  useEffect(() => {
    if (isActive) {
      start(); // 🚀 démarrage auto quand activé
      onRunningChange(id, true); // si tu veux suivre le statut global
    } else {
      pause(); // sinon on stoppe le chrono
      onRunningChange(id, false);
    }
  }, [isActive]);

  return (
    <motion.div
      initial={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.4 }}
    >
      <div className={`flex items-center justify-between px-2 py-1 ${color} rounded text-sm shadow no-drag`}>
        <span className="font-mono text-lg">{time}</span>
        <div className="flex gap-2 items-center">
          <button onClick={handleToggle} className="text-gray-700 hover:text-green-600">
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onMouseDown={handleStopPress}
            onMouseUp={handleStopRelease}
            onMouseLeave={() => clearTimeout(pressTimer)}
            className="text-gray-700 hover:text-red-600"
          >
            <StopCircle size={18} />
          </button>
          {/* Bouton de suppression avec icône */}
          <button onClick={handleDelete} className="text-gray-700 hover:text-red-600">
            <Trash size={18} />
          </button>
        </div>
        {modalState && (
          <TimerModal
            onSuccess={onSuccess}
            onClose={() => setModalState(null)}
            time={time}
            projectList={projectList}
            setProjectList={setProjectList}
            projectListTMA={projectListTMA}
            setProjectListTMA={setProjectListTMA}
            forcedStep={modalState.step}
            forcedCategory={modalState.selectedCategory}
          />
        )}
      </div>
    </motion.div>
  );
};

export default TimerCard;
