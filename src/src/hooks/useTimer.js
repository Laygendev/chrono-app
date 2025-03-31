import { useState, useRef } from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';

dayjs.extend(duration);
dayjs.extend(utc);

export const useTimer = () => {
  const [time, setTime] = useState('00:00:00');
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedRef = useRef(0);

  const updateTime = () => {
    const diff = Date.now() - startTimeRef.current;
    elapsedRef.current = diff;
    const formatted = dayjs.utc(diff).format('HH:mm:ss');
    setTime(formatted);
  };

  const start = () => {
    if (intervalRef.current) return;
    startTimeRef.current = Date.now() - elapsedRef.current;
    updateTime();
    intervalRef.current = setInterval(updateTime, 1000);
  };

  const pause = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reset = () => {
    pause();
    elapsedRef.current = 0;
    setTime('00:00:00');
  };

  return { time, start, pause, reset };
};