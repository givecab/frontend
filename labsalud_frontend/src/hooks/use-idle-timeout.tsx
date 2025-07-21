import { useState, useCallback, useEffect, useRef } from "react";

interface IdleTimeoutProps {
  onIdle: () => void;
  idleTime: number;
  warningTime: number;
}

export function useIdleTimeout({
  onIdle,
  idleTime,
  warningTime
}: IdleTimeoutProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(warningTime / 1000));
  
  const warningTimerRef = useRef<number | undefined>(undefined);
  const logoutTimerRef = useRef<number | undefined>(undefined);
  const countdownTimerRef = useRef<number | undefined>(undefined);
  const isWarningActiveRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current !== undefined) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = undefined;
    }
    
    if (logoutTimerRef.current !== undefined) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = undefined;
    }
    
    if (countdownTimerRef.current !== undefined) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = undefined;
    }
  }, []);

  const startWarningPhase = useCallback(() => {
    if (isWarningActiveRef.current) {
      return;
    }

    isWarningActiveRef.current = true;
    setShowWarning(true);
    
    // Initialize countdown
    const initialSeconds = Math.ceil(warningTime / 1000);
    setTimeLeft(initialSeconds);
    
    // Set the end time for precise countdown
    const startTime = Date.now();
    const endTime = startTime + warningTime;
    
    countdownTimerRef.current = window.setInterval(() => {
      const secondsLeft = Math.ceil((endTime - Date.now()) / 1000);
      
      if (secondsLeft <= 0) {
        clearTimers();
        setShowWarning(false);
        isWarningActiveRef.current = false;
        onIdle();
      } else {
        setTimeLeft(secondsLeft);
      }
    }, 1000);
    
    // Backup timer to ensure logout happens
    logoutTimerRef.current = window.setTimeout(() => {
      clearTimers();
      setShowWarning(false);
      isWarningActiveRef.current = false;
      onIdle();
    }, warningTime);
    
  }, [warningTime, onIdle, clearTimers]);

  const resetTimers = useCallback(() => {
    if (isWarningActiveRef.current) {
      return;
    }

    clearTimers();
    
    warningTimerRef.current = window.setTimeout(() => {
      startWarningPhase();
    }, idleTime - warningTime);
    
  }, [idleTime, warningTime, clearTimers, startWarningPhase]);

  const handleActivity = useCallback(() => {
    if (isWarningActiveRef.current) {
      return;
    }
    resetTimers();
  }, [resetTimers]);

  const extendSession = useCallback(() => {
    isWarningActiveRef.current = false;
    setShowWarning(false);
    clearTimers();
    resetTimers();
  }, [clearTimers, resetTimers]);

  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keypress", 
      "scroll", 
      "touchstart",
      "click"
    ];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });
    
    resetTimers();
    
    return () => {
      clearTimers();
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [handleActivity, resetTimers, clearTimers]);

  return { showWarning, timeLeft, extendSession };
}

export default useIdleTimeout;
