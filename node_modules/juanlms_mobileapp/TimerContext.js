import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  const [activeTimers, setActiveTimers] = useState(new Map());
  const timerRefs = useRef(new Map());

  const startTimer = (quizId, duration, onTimeUp) => {
    const endTime = Date.now() + (duration * 1000);
    
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      
      if (remaining <= 0) {
        clearInterval(timer);
        onTimeUp();
        removeTimer(quizId);
      } else {
        setActiveTimers(prev => new Map(prev.set(quizId, remaining)));
      }
    }, 1000);

    timerRefs.current.set(quizId, timer);
    setActiveTimers(prev => new Map(prev.set(quizId, duration)));
  };

  const removeTimer = (quizId) => {
    const timer = timerRefs.current.get(quizId);
    if (timer) {
      clearInterval(timer);
      timerRefs.current.delete(quizId);
    }
    setActiveTimers(prev => {
      const newMap = new Map(prev);
      newMap.delete(quizId);
      return newMap;
    });
  };

  const getRemainingTime = (quizId) => {
    return activeTimers.get(quizId) || 0;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const pauseTimer = (quizId) => {
    const timer = timerRefs.current.get(quizId);
    if (timer) {
      clearInterval(timer);
      timerRefs.current.delete(quizId);
    }
  };

  const resumeTimer = (quizId, remainingTime, onTimeUp) => {
    if (remainingTime > 0) {
      startTimer(quizId, remainingTime, onTimeUp);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup all timers on unmount
      timerRefs.current.forEach(timer => clearInterval(timer));
    };
  }, []);

  return (
    <TimerContext.Provider value={{
      startTimer,
      removeTimer,
      getRemainingTime,
      formatTime,
      pauseTimer,
      resumeTimer,
      activeTimers
    }}>
      {children}
    </TimerContext.Provider>
  );
};
