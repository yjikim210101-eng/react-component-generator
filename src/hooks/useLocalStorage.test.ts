import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장된 값이 없으면 초기값을 쓴다', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('저장된 값이 있으면 초기값 대신 복원한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    expect(result.current[0]).toBe('saved');
  });

  it('값이 바뀌면 localStorage에 JSON으로 저장한다', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    act(() => result.current[1]('next'));
    expect(localStorage.getItem('k')).toBe(JSON.stringify('next'));
  });

  it('저장된 JSON이 깨졌으면 초기값으로 되돌린다', () => {
    localStorage.setItem('k', '{broken');
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('다른 탭에서 같은 키가 바뀌면 값을 갱신한다', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    act(() => {
      localStorage.setItem('k', JSON.stringify('from-other-tab'));
      window.dispatchEvent(new StorageEvent('storage', { key: 'k', newValue: JSON.stringify('from-other-tab') }));
    });
    expect(result.current[0]).toBe('from-other-tab');
  });

  it('다른 키의 storage 이벤트는 무시한다', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: JSON.stringify('x') }));
    });
    expect(result.current[0]).toBe('init');
  });

  it('revive가 undefined를 반환하면 초기값을 쓴다', () => {
    localStorage.setItem('k', JSON.stringify('invalid'));
    const { result } = renderHook(() =>
      useLocalStorage<'a' | 'b'>('k', 'a', (raw) => (raw === 'a' || raw === 'b' ? raw : undefined)),
    );
    expect(result.current[0]).toBe('a');
  });

  it('revive가 변환한 값을 복원한다', () => {
    localStorage.setItem('k', JSON.stringify('2026-01-02T03:04:05.000Z'));
    const { result } = renderHook(() =>
      useLocalStorage<Date>('k', new Date(0), (raw) => new Date(raw as string)),
    );
    expect(result.current[0]).toBeInstanceOf(Date);
    expect(result.current[0].toISOString()).toBe('2026-01-02T03:04:05.000Z');
  });
});
