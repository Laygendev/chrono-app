import React, { useState, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import TimerModal from './TimerModal';

const TimerCard = ({ id }) => {
  const { time, start, pause, reset } = useTimer();
  const [showModal, setShowModal] = useState(false);

  const handleStop = () => {
    pause();
    setShowModal(true);
  };

  useEffect(() => {
    return () => pause();
  }, []);

  return (
    <div className="flex items-center justify-between px-2 py-1 bg-gray-100/80 rounded text-sm shadow">
      <span className="font-mono text-lg">{time}</span>
      <div className="flex gap-1">
        <button onClick={start} className="hover:text-green-600">▶</button>
        <button onClick={pause} className="hover:text-yellow-600">⏸</button>
        <button onClick={handleStop} className="hover:text-red-600">⏹</button>
      </div>
      {showModal && <TimerModal onClose={() => setShowModal(false)} time={time} />}
    </div>
  );
};

export default TimerCard;