import { useState, useEffect } from 'react';

/**
 * useState처럼 쓰되 값을 localStorage에 JSON으로 저장하고 새로고침 후 복원한다.
 * revive는 저장된 값을 검증·변환하고, undefined를 반환하면 초기값을 쓴다.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
  revive?: (raw: unknown) => T | undefined,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return initial;
      const parsed: unknown = JSON.parse(stored);
      const revived = revive ? revive(parsed) : (parsed as T);
      return revived === undefined ? initial : revived;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장 공간이 가득 찼거나 접근이 막힌 경우: 메모리 상태만 유지한다.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
