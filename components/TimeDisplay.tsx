import React from 'react';

interface TimeDisplayProps {
  seconds: number;
  className?: string;
}

export const formatTime = (timeInSeconds: number): string => {
  if (isNaN(timeInSeconds)) return "00:00";
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const TimeDisplay: React.FC<TimeDisplayProps> = ({ seconds, className = '' }) => {
  return <span className={`font-mono ${className}`}>{formatTime(seconds)}</span>;
};
