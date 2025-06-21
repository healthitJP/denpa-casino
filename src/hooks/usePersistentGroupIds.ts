import { useState, useEffect } from 'react';

export function usePersistentGroupIds(selfId: string) {
  const storageKey = 'groupIds';

  const [groupIds, setGroupIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const arr = JSON.parse(saved);
          if (Array.isArray(arr) && arr.length > 0) return arr;
        }
      } catch (_) {}
    }
    return selfId ? [selfId] : [];
  });

  // ensure selfId is included once available
  useEffect(() => {
    if (!selfId) return;
    setGroupIds((prev) => (prev.includes(selfId) ? prev : [selfId, ...prev]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfId]);

  // persist on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(groupIds));
    } catch (_) {}
  }, [groupIds]);

  return [groupIds, setGroupIds] as const;
} 