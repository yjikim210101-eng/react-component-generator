import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptInput } from './PromptInput';

describe('PromptInput', () => {
  it('프롬프트가 비어 있으면 생성 버튼이 비활성이다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
  });

  it('입력하면 버튼이 활성화되고 클릭 시 입력값으로 onGenerate가 호출된다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

    await user.type(screen.getByRole('textbox'), '프로필 카드');
    const submit = screen.getByRole('button', { name: '컴포넌트 생성' });
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onGenerate).toHaveBeenCalledWith('프로필 카드');
  });

  it('500자를 넘기면 에러 메시지를 보여주고 생성 버튼이 비활성이다', async () => {
    const user = userEvent.setup();
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);

    await user.click(screen.getByRole('textbox'));
    await user.paste('a'.repeat(501));

    expect(screen.getByRole('alert')).toHaveTextContent('500자 이하');
    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
  });

  it('히스토리가 있으면 항목을 보여주고 클릭하면 입력창에 채운다', async () => {
    const user = userEvent.setup();
    render(
      <PromptInput onGenerate={vi.fn()} isLoading={false} history={['이전 프롬프트']} onClearHistory={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: '이전 프롬프트' }));
    expect(screen.getByRole('textbox')).toHaveValue('이전 프롬프트');
  });

  it('긴 히스토리 항목은 잘라서 보여주고 전체는 title에 둔다', () => {
    const long = '가'.repeat(200);
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} history={[long]} onClearHistory={vi.fn()} />);

    const chip = screen.getByTitle(long);
    expect(chip.textContent!.length).toBeLessThan(long.length);
    expect(chip.textContent).toMatch(/…$/);
  });

  it('히스토리 삭제 버튼을 누르면 onClearHistory가 호출된다', async () => {
    const onClearHistory = vi.fn();
    const user = userEvent.setup();
    render(
      <PromptInput onGenerate={vi.fn()} isLoading={false} history={['a']} onClearHistory={onClearHistory} />,
    );

    await user.click(screen.getByRole('button', { name: '기록 삭제' }));
    expect(onClearHistory).toHaveBeenCalled();
  });

  it('히스토리가 비어 있으면 히스토리 영역을 보여주지 않는다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} history={[]} onClearHistory={vi.fn()} />);
    expect(screen.queryByText('최근 프롬프트')).not.toBeInTheDocument();
  });

  it('로딩 중에는 생성 버튼이 비활성이고 "생성 중..." 을 보여준다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={true} />);
    expect(screen.getByRole('button', { name: '생성 중...' })).toBeDisabled();
  });
});
