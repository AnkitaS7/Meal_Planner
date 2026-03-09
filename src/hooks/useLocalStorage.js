import { useState, useEffect } from "react";

/**
 * Persists state to localStorage.
 * Falls back gracefully when localStorage is unavailable.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail in restricted environments
    }
  }, [key, value]);

  return [value, setValue];
}
