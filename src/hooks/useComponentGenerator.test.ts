import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { MAX_COMPONENTS } from '../utils/persistence';

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

  it(`컴포넌트는 최대 ${MAX_COMPONENTS}개까지만 유지하고 오래된 것을 버린다`, async () => {
    const { result } = renderHook(() => useComponentGenerator());
    for (let i = 0; i < MAX_COMPONENTS + 1; i++) {
      await act(() => result.current.generate(`p${i}`, undefined, 'google'));
    }
    expect(result.current.components).toHaveLength(MAX_COMPONENTS);
    expect(result.current.components[0].prompt).toBe(`p${MAX_COMPONENTS}`);
    expect(result.current.components.some((c) => c.prompt === 'p0')).toBe(false);
  });

  it('generate는 성공하면 true, 실패하면 false를 반환한다', async () => {
    const { result } = renderHook(() => useComponentGenerator());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.generate('p', undefined, 'google');
    });
    expect(ok).toBe(true);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'x' }) }));
    await act(async () => {
      ok = await result.current.generate('p', undefined, 'google');
    });
    expect(ok).toBe(false);
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
