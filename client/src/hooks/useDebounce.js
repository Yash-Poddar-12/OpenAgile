import { useState, useEffect } from 'react';

/**
 * useDebounce hook to delay state update until user stops input.
 * 
 * @param {any} value - The input value to debounce.
 * @param {number} delay - delay in ms.
 * @returns {any} - The debounced value.
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
