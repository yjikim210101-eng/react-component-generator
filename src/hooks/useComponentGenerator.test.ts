import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';

describe('useComponentGenerator 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: 'const A = 1;' }) }),
    );
  });

  it('생성한 컴포넌트가 다시 마운트해도 유지되고 createdAt은 Date다', async () => {
    const first = renderHook(() => useComponentGenerator());
    await act(() => first.result.current.generate('카드', undefined, 'google'));
    await waitFor(() => expect(first.result.current.components).toHaveLength(1));
    first.unmount();

    const second = renderHook(() => useComponentGenerator());
    expect(second.result.current.components).toHaveLength(1);
    expect(second.result.current.components[0].prompt).toBe('카드');
    expect(second.result.current.components[0].createdAt).toBeInstanceOf(Date);
  });

  it('전체 삭제하면 저장된 목록도 비워진다', async () => {
    const first = renderHook(() => useComponentGenerator());
    await act(() => first.result.current.generate('카드', undefined, 'google'));
    await waitFor(() => expect(first.result.current.components).toHaveLength(1));
    act(() => first.result.current.clearAll());
    first.unmount();

    const second = renderHook(() => useComponentGenerator());
    expect(second.result.current.components).toHaveLength(0);
  });
});
