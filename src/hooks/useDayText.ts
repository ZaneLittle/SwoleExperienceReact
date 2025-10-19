import { useState, useEffect } from 'react';

export const useDayText = (dayOffset: number) => {
  const [dayText, setDayText] = useState('Today');

  const updateDayText = () => {
    switch (dayOffset) {
      case 0:
        setDayText('Today');
        break;
      case -1:
        setDayText('Yesterday');
        break;
      case 1:
        setDayText('Tomorrow');
        break;
      default:
        setDayText(dayOffset > 0 
          ? `In ${dayOffset} Days` 
          : `${Math.abs(dayOffset)} Days Ago`);
        break;
    }
  };

  useEffect(() => {
    updateDayText();
  }, [dayOffset]);

  return dayText;
};
