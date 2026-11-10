import { describe, it, expect } from 'vitest';
import {
  addToHistory,
  MAX_HISTORY,
  reviveApiKeys,
  reviveComponents,
  reviveProvider,
  reviveStringList,
} from './persistence';

describe('addToHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('이미 있는 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addToHistory(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it(`최대 ${MAX_HISTORY}개까지만 유지하고 오래된 것을 버린다`, () => {
    const full = Array.from({ length: MAX_HISTORY }, (_, i) => `p${i}`);
    const next = addToHistory(full, 'new');
    expect(next).toHaveLength(MAX_HISTORY);
    expect(next[0]).toBe('new');
    expect(next).not.toContain(`p${MAX_HISTORY - 1}`);
  });
});

describe('reviveStringList', () => {
  it('문자열이 아닌 항목과 중복을 제거한다', () => {
    expect(reviveStringList(['a', 1, 'a', 'b', null])).toEqual(['a', 'b']);
  });

  it(`최대 ${MAX_HISTORY}개까지만 유지한다`, () => {
    const many = Array.from({ length: MAX_HISTORY + 10 }, (_, i) => `p${i}`);
    expect(reviveStringList(many)).toHaveLength(MAX_HISTORY);
  });

  it('배열이 아니면 undefined를 반환한다', () => {
    expect(reviveStringList('x')).toBeUndefined();
  });
});

describe('reviveProvider', () => {
  it('유효한 provider만 통과시킨다', () => {
    expect(reviveProvider('google')).toBe('google');
    expect(reviveProvider('anthropic')).toBe('anthropic');
    expect(reviveProvider('openai')).toBeUndefined();
    expect(reviveProvider(42)).toBeUndefined();
  });
});

describe('reviveApiKeys', () => {
  it('프로바이더별 문자열 키를 복원한다', () => {
    expect(reviveApiKeys({ anthropic: 'a', google: 'g' })).toEqual({ anthropic: 'a', google: 'g' });
  });

  it('누락되거나 문자열이 아닌 값은 빈 문자열로 채운다', () => {
    expect(reviveApiKeys({ google: 1 })).toEqual({ anthropic: '', google: '' });
  });

  it('객체가 아니면 undefined를 반환한다', () => {
    expect(reviveApiKeys('x')).toBeUndefined();
    expect(reviveApiKeys(null)).toBeUndefined();
  });
});

describe('reviveComponents', () => {
  it('createdAt 문자열을 Date로 복원한다', () => {
    const result = reviveComponents([
      { id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-02T03:04:05.000Z' },
    ]);
    expect(result?.[0].createdAt).toBeInstanceOf(Date);
    expect(result?.[0].createdAt.toISOString()).toBe('2026-01-02T03:04:05.000Z');
  });

  it('배열이 아니면 undefined를 반환한다', () => {
    expect(reviveComponents({})).toBeUndefined();
  });

  it('형식이 맞지 않는 항목은 걸러낸다', () => {
    const result = reviveComponents([
      { id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-02T03:04:05.000Z' },
      { id: '2' },
      null,
      { id: '3', prompt: 'p', code: 'c', createdAt: 'not-a-date' },
    ]);
    expect(result?.map((c) => c.id)).toEqual(['1']);
  });
});
