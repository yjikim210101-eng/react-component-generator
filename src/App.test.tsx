import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function stubFetch(generate: () => { ok: boolean; body: unknown }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === '/api/config') {
        return { ok: true, json: async () => ({ envKeys: { anthropic: false, google: false } }) };
      }
      const { ok, body } = generate();
      return { ok, json: async () => body };
    }),
  );
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('프로바이더별로 API 키를 따로 기억한다', async () => {
    stubFetch(() => ({ ok: true, body: { code: 'const A = 1;' } }));
    const user = userEvent.setup();
    render(<App />);

    const keyInput = screen.getByLabelText('API Key');
    await user.type(keyInput, 'g-key');
    await user.selectOptions(screen.getByLabelText('Provider'), 'anthropic');
    expect(screen.getByLabelText('API Key')).toHaveValue('');

    await user.type(screen.getByLabelText('API Key'), 'a-key');
    await user.selectOptions(screen.getByLabelText('Provider'), 'google');
    expect(screen.getByLabelText('API Key')).toHaveValue('g-key');
  });

  it('생성에 성공한 프롬프트만 히스토리에 기록한다', async () => {
    let call = 0;
    stubFetch(() =>
      ++call === 1
        ? { ok: false, body: { error: '실패' } }
        : { ok: true, body: { code: 'const A = 1;' } },
    );
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('API Key'), 'key');
    await user.type(screen.getByRole('textbox'), '실패할 프롬프트');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    await screen.findByRole('alert');
    expect(screen.queryByText('최근 프롬프트')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    await waitFor(() => expect(screen.getByText('최근 프롬프트')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '실패할 프롬프트' })).toBeInTheDocument();
  });
});
