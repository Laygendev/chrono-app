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

  const start = () => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const diff = dayjs.duration(Date.now() - startTimeRef.current);
      const formatted = dayjs.utc(diff.asMilliseconds()).format('HH:mm:ss');
      setTime(formatted);
    }, 1000);
  };

  const pause = () => clearInterval(intervalRef.current);
  const reset = () => {
    clearInterval(intervalRef.current);
    setTime('00:00:00');
  };

  return { time, start, pause, reset };
};
