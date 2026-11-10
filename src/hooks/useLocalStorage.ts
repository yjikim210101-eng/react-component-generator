import { useState, useEffect } from 'react';

function readStored<T>(
  key: string,
  initial: T,
  revive?: (raw: unknown) => T | undefined,
): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return initial;
    const parsed: unknown = JSON.parse(stored);
    const revived = revive ? revive(parsed) : (parsed as T);
    return revived === undefined ? initial : revived;
  } catch {
    return initial;
  }
}

/**
 * useState처럼 쓰되 값을 localStorage에 JSON으로 저장하고 새로고침 후 복원한다.
 * revive는 저장된 값을 검증·변환하고, undefined를 반환하면 초기값을 쓴다.
 * 다른 탭에서 같은 키가 바뀌면(storage 이벤트) 값을 다시 읽어 갱신한다.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
  revive?: (raw: unknown) => T | undefined,
) {
  const [value, setValue] = useState<T>(() => readStored(key, initial, revive));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장 공간이 가득 찼거나 접근이 막힌 경우: 메모리 상태만 유지한다.
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(readStored(key, initial, revive));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // initial과 revive는 호출부에서 매 렌더 새로 만들어질 수 있어 의존성에서 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setValue] as const;
}
