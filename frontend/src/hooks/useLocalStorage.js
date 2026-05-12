import { useState } from "react";

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    const existing = localStorage.getItem(key);
    return existing != null ? existing : initialValue;
  });

  function setValue(valueOrUpdater) {
    setStoredValue((current) => {
      const nextValue = typeof valueOrUpdater === "function" ? valueOrUpdater(current) : valueOrUpdater;
      localStorage.setItem(key, nextValue);
      return nextValue;
    });
  }

  return [storedValue, setValue];
}
