import React, { useEffect, useState } from 'react';
import styles from './CountdownTimer.module.scss';

interface CountdownTimerProps {
  initialSeconds: number;
  onExpire?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds,
  onExpire,
  className = '',
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    setSeconds(initialSeconds);
    setIsExpired(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      setIsExpired(true);
      if (onExpire) {
        onExpire();
      }
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onExpire]);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${styles.timer} ${isExpired ? styles.expired : ''} ${className}`}>
      <span className={styles.label}>驗證碼有效期限：</span>
      <span className={styles.time}>{formatTime(seconds)}</span>
    </div>
  );
};

export default CountdownTimer;
