"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [model, setModel] = useState<string>('qwen-plus');
  const [modelOpen, setModelOpen] = useState(false);
  const modelRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    }
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  useEffect(() => {
    // scroll to bottom when messages change
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  async function callOpenAI(messagesParam?: Array<{ role: string; content: string }>) {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        messages: messagesParam ?? [{ role: 'system', content: '帮我简单介绍下next.js' }],
        model,
      };

      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
      setResult(text);
      return text;
    } catch (e: any) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function submitPrompt() {
    if (!prompt.trim()) return;
    const userMsg = { role: 'user', content: prompt };
    setMessages((s) => [...s, userMsg]);
    setPrompt('');

    const allMessages = [...messages, userMsg];
    const reply = await callOpenAI(allMessages);
    if (reply) {
      const assistantMsg = { role: 'assistant', content: reply };
      setMessages((s) => [...s, assistantMsg]);
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="mt-6 w-full flex flex-col items-center gap-4">
          {error && <div className="text-red-600">错误：{error}</div>}

          {/* Chat messages area */}
          <div
            ref={messagesRef}
            className="w-full max-w-3xl max-h-[calc(100vh-20rem)] overflow-y-auto px-4 py-2 space-y-4 hide-scrollbar pb-[calc(6rem)] md:pb-[calc(7rem+20px)]"
          >
            {messages.length === 0 && (
              <div className="text-zinc-500 text-sm text-center">对话将在此显示</div>
            )}

            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap p-3 text-sm ${
                    m.role === 'user' ? 'bg-foreground text-background rounded-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-md'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fixed input */}
        <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-3xl px-4 overflow-visible">
            <div className="relative overflow-visible">
              <div className="flex items-center gap-3 bg-zinc-900 text-white rounded-md px-4 py-2 shadow-lg">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitPrompt();
                    }
                  }}
                  placeholder="问我任何问题... (Enter 发送，Shift+Enter 换行)"
                  className="flex-1 bg-zinc-900 text-white outline-none placeholder-zinc-400 text-sm resize-none h-24 md:h-28"
                  rows={1}
                />
              </div>

              {/* Custom model dropdown that opens upward (above the control) */}
              <div className="absolute left-3 bottom-[4px] pointer-events-auto z-[9999]">
                <div ref={modelRef} className="relative">
                  <button
                    onClick={() => setModelOpen((s) => !s)}
                    className="flex items-center gap-2 bg-zinc-900/95 text-white rounded-md px-3 py-1 text-sm shadow-lg"
                    aria-haspopup="listbox"
                    aria-expanded={modelOpen}
                  >
                    <span>{model}</span>
                    <span className="text-xs">▾</span>
                  </button>

                  {modelOpen && (
                    <div className="absolute left-0 bottom-full w-30 bg-zinc-900/95 rounded-md shadow-lg">
                      <ul role="listbox" className="py-1">
                        {['qwen-plus', 'gpt-4o', 'gpt-4o-mini'].map((m) => (
                          <li key={m}>
                            <button
                              onClick={() => { setModel(m); setModelOpen(false); }}
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-800"
                            >
                              {m}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
