import React, { createContext, useContext, useState } from 'react';

const TimerContext = createContext();

export const useTimerContext = () => useContext(TimerContext);

export const TimerProvider = ({ children }) => {
  const [timers, setTimers] = useState([]);

  return (
    <TimerContext.Provider value={{ timers, setTimers }}>
      {children}
    </TimerContext.Provider>
  );
};
