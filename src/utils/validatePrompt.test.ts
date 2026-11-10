import { describe, it, expect } from 'vitest';
import { validatePrompt, MAX_PROMPT_LENGTH } from './validatePrompt';

describe('validatePrompt', () => {
  it('500자 이하면 유효하다', () => {
    expect(validatePrompt('a'.repeat(MAX_PROMPT_LENGTH))).toEqual({ valid: true });
  });

  it('500자를 넘으면 에러 메시지와 함께 무효다', () => {
    const result = validatePrompt('a'.repeat(MAX_PROMPT_LENGTH + 1));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('500');
  });

  it('앞뒤 공백은 길이에 포함하지 않는다', () => {
    const padded = `  ${'a'.repeat(MAX_PROMPT_LENGTH)}  `;
    expect(validatePrompt(padded)).toEqual({ valid: true });
  });
});
