import { useState, useRef } from 'react';
import dayjs from 'dayjs';

export const useTimer = () => {
  const [time, setTime] = useState('00:00:00');
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const start = () => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const diff = dayjs.duration(Date.now() - startTimeRef.current);
      setTime(diff.format('HH:mm:ss'));
    }, 1000);
  };

  const pause = () => clearInterval(intervalRef.current);
  const reset = () => {
    clearInterval(intervalRef.current);
    setTime('00:00:00');
  };

  return { time, start, pause, reset };
};