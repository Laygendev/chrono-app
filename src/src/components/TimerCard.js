import React, { useState } from 'react';
import { useTimer } from '../hooks/useTimer';
import TimerModal from './TimerModal';

const TimerCard = ({ id }) => {
  const { time, start, pause, reset } = useTimer();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold">Chrono #{id}</h2>
      <p className="text-3xl my-2">{time}</p>
      <div className="flex gap-2">
        <button onClick={start}>▶️</button>
        <button onClick={pause}>⏸️</button>
        <button onClick={() => setShowModal(true)}>⏹️</button>
      </div>
      {showModal && <TimerModal onClose={() => setShowModal(false)} time={time} />}
    </div>
  );
};

export default TimerCard;
