import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  addToHistory,
  EMPTY_API_KEYS,
  reviveApiKeys,
  reviveProvider,
  reviveStringList,
  type ApiKeys,
} from './utils/persistence';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function App() {
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>('rcg:apiKeys', EMPTY_API_KEYS, reviveApiKeys);
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useLocalStorage<Provider>('rcg:provider', 'google', reviveProvider);
  const apiKey = apiKeys[provider];
  const setApiKey = (value: string) => setApiKeys((prev) => ({ ...prev, [provider]: value }));
  const [history, setHistory] = useLocalStorage<string[]>('rcg:promptHistory', [], reviveStringList);
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = async (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    const ok = await generate(prompt, apiKey || undefined, provider);
    if (ok) setHistory((prev) => addToHistory(prev, prompt));
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;

  return (
    <>
      <header className="menubar">
        <div className="menubar-brand">
          <span className="brand-mark" aria-hidden="true">RC</span>
          React 컴포넌트 생성기
        </div>
        <div className="menubar-status" aria-label="현재 작업 상태">
          <span>
            AI<strong>{activeProvider}</strong>
          </span>
          <span>
            결과<strong>{components.length}개</strong>
          </span>
        </div>
      </header>

      <div className="app">
      <div className="hero">
        <h1>한 줄로 주문하면 컴포넌트가 나옵니다</h1>
        <p>만들고 싶은 화면을 문장으로 적으세요. React 컴포넌트를 바로 띄워 보여 주고, 코드도 함께 드립니다.</p>
      </div>

      <main className="workspace">
        <section className="win" aria-label="컴포넌트 생성">
          <div className="win-bar">
            <span className="win-title">프롬프트</span>
          </div>
          <div className="win-body">
            <PromptInput
              onGenerate={handleGenerate}
              isLoading={isLoading}
              history={history}
              onClearHistory={() => setHistory([])}
            />
          </div>
        </section>

        <aside className="win" aria-label="실행 설정">
          <div className="win-bar">
            <span className="win-title">설정</span>
          </div>
          <div className="win-body">
          <div className="provider-select">
            <label htmlFor="provider">Provider</label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}
            >
              {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="api-key-input">
            <label htmlFor="api-key">
              API Key
            </label>
            <div className="api-key-field">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasEnvKey
                    ? '서버 키 사용 중 (직접 입력으로 덮어쓰기 가능)'
                    : PROVIDER_CONFIG[provider].placeholder
                }
              />
              <button
                className="btn-toggle-key"
                onClick={() => setShowKey(!showKey)}
                type="button"
              >
                {showKey ? '숨기기' : '보기'}
              </button>
            </div>
            <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
              {hasEnvKey ? '.env 키가 연결되어 있습니다.' : '직접 입력하거나 서버 환경변수를 설정하세요.'}
            </p>
          </div>
          </div>
        </aside>
      </main>

      {error && (
        <div className="error-banner" role="alert">
          <p>{error}</p>
        </div>
      )}

      <section className="results-section">
        {components.length > 0 && (
          <div className="results-header">
            <h2>생성된 컴포넌트</h2>
            <button className="btn-clear" onClick={clearAll}>
              전체 삭제
            </button>
          </div>
        )}

        {components.length === 0 && !isLoading && (
          <div className="win">
            <div className="win-bar">
              <span className="win-title">결과</span>
            </div>
            <div className="empty-state">
              <div className="empty-preview" aria-hidden="true">
                <div className="empty-screen">
                  <span />
                </div>
              </div>
              <div className="empty-copy">
                <h2>아직 만든 컴포넌트가 없습니다.</h2>
                <p>위 프롬프트 창에 원하는 화면을 적고 컴포넌트 생성을 눌러 보세요.</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="win loading-card" role="status">
            <div className="win-bar">
              <span className="win-title">생성 중</span>
            </div>
            <div className="win-body">
              <p>컴포넌트를 생성하고 있습니다...</p>
              <div className="loading-bar" aria-hidden="true">
                <span />
              </div>
            </div>
          </div>
        )}

        <div className="results-grid">
          {components.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              onRemove={removeComponent}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>
      </div>
    </>
  );
}

export default App;
