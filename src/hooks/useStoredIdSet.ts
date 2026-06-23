import { useState } from "react";

export interface StoredIdSet {
  ids: Set<string>;
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
}

export function useStoredIdSet(storageKey: string): StoredIdSet {
  const [ids, setIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const rawValue = window.localStorage.getItem(storageKey);
      const parsedValue = rawValue ? (JSON.parse(rawValue) as string[]) : [];
      return new Set(parsedValue);
    } catch {
      return new Set();
    }
  });

  const save = (nextIds: Set<string>) => {
    setIds(nextIds);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(Array.from(nextIds)));
  };

  return {
    ids,
    add(id: string) {
      const nextIds = new Set(ids);
      nextIds.add(id);
      save(nextIds);
    },
    remove(id: string) {
      const nextIds = new Set(ids);
      nextIds.delete(id);
      save(nextIds);
    },
    toggle(id: string) {
      const nextIds = new Set(ids);
      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }
      save(nextIds);
    },
    clear() {
      save(new Set());
    },
  };
}
