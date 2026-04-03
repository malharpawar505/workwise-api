import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('ww_dark');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('ww_dark', String(dark));
  }, [dark]);

  return [dark, setDark];
}
