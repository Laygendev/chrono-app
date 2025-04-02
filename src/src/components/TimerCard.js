import React, { useState, useEffect, useRef } from 'react';
import { useTimer } from '../hooks/useTimer';
import TimerModal from './TimerModal';
import { Play, Pause, StopCircle, Trash } from 'lucide-react';
import { motion } from 'framer-motion';

const TimerCard = ({ id, onDelete, onRunningChange, isActive, onActivate, color, projectList, setProjectList, onOpenStopBox }) => {
  const { time, start, pause, reset } = useTimer();
  const [showModal, setShowModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const stopButtonRef = useRef(null);

  const handleToggle = () => {
    if (isRunning) {
      pause();
      setIsRunning(false);
    } else {
      onActivate();
      start();
      setIsRunning(true);
    }
  };

  const handleStop = (e) => {
    pause();
    setIsRunning(false);
    onRunningChange?.(id, false);

    if (stopButtonRef.current) {
      const rect = stopButtonRef.current.getBoundingClientRect();
      onOpenStopBox?.(rect);
    }
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm('Êtes-vous sûr de vouloir supprimer ce chrono ?');
    if (confirmDelete) {
      onDelete(id);
    }
  };

  const onSuccess = () => {
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
    const handleStopIpc = () => handleStop();
    window.electron.ipcRenderer.on('stop-all-chronos', handleStopIpc);
    return () => {
      window.electron.ipcRenderer.removeListener('stop-all-chronos', handleStopIpc);
      pause();
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      start();
      onRunningChange(id, true);
    } else {
      pause();
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
            ref={stopButtonRef}
            onClick={handleStop}
            className="text-gray-700 hover:text-red-600"
          >
            <StopCircle size={18} />
          </button>
          <button onClick={handleDelete} className="text-gray-700 hover:text-red-600">
            <Trash size={18} />
          </button>
        </div>
        {showModal && (
          <TimerModal
            onSuccess={onSuccess}
            onClose={() => setShowModal(false)}
            time={time}
            projectList={projectList}
            setProjectList={setProjectList}
          />
        )}
      </div>
    </motion.div>
  );
};

export default TimerCard;