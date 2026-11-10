import type { GeneratedComponent, Provider } from '../types';

export const MAX_HISTORY = 20;

/** 프롬프트를 맨 앞에 추가한다. 중복은 제거하고 최대 MAX_HISTORY개만 유지한다. */
export function addToHistory(history: string[], prompt: string): string[] {
  return [prompt, ...history.filter((p) => p !== prompt)].slice(0, MAX_HISTORY);
}

export function reviveProvider(raw: unknown): Provider | undefined {
  return raw === 'anthropic' || raw === 'google' ? raw : undefined;
}

export type ApiKeys = Record<Provider, string>;

export const EMPTY_API_KEYS: ApiKeys = { anthropic: '', google: '' };

/** 프로바이더별 API 키를 복원한다. 누락되거나 문자열이 아닌 값은 빈 문자열로 채운다. */
export function reviveApiKeys(raw: unknown): ApiKeys | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const { anthropic, google } = raw as Record<string, unknown>;
  return {
    anthropic: typeof anthropic === 'string' ? anthropic : '',
    google: typeof google === 'string' ? google : '',
  };
}

export function reviveStringList(raw: unknown): string[] | undefined {
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : undefined;
}

/** 저장된 JSON에서 GeneratedComponent[]를 복원한다. createdAt은 Date로 되돌린다. */
export function reviveComponents(raw: unknown): GeneratedComponent[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const result: GeneratedComponent[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const { id, prompt, code, createdAt } = item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof prompt !== 'string' || typeof code !== 'string') continue;
    if (typeof createdAt !== 'string') continue;
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) continue;
    result.push({ id, prompt, code, createdAt: date });
  }
  return result;
}
