"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isApiConfigured, checkServerEnvConfig, streamChatMessage, type ChatMessage } from "@/utils/aiChat";

type Props = {
  onClose: () => void;
};

export default function AiChatPanel({ onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "你好！我是豆韵助手，有任何关于传统文化、拼豆制作或工具使用的问题都可以问我。" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiWarning, setShowApiWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkServerEnvConfig().then(() => {
      if (!isApiConfigured()) {
        setShowApiWarning(true);
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    const assistantIndex = nextMessages.length;
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setLoading(true);

    try {
      await streamChatMessage(nextMessages, (delta) => {
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === assistantIndex ? { ...msg, content: msg.content + delta } : msg,
          ),
        );
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "发送失败，请重试";
      setError(msg);
      setMessages((prev) =>
        prev.map((item, index) =>
          index === assistantIndex ? { role: "assistant", content: `出错了：${msg}` } : item,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape") onClose();
    },
    [handleSend, onClose],
  );

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 flex h-[600px] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-t-xl bg-[#2b2118] px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">AI</span>
            <span className="font-semibold">豆韵助手</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="关闭"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {showApiWarning && (
          <div className="mx-4 mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            未配置 API，暂时无法使用豆韵助手。
            <button
              type="button"
              onClick={() => setShowApiWarning(false)}
              className="ml-2 font-medium text-amber-900 underline hover:no-underline"
            >
              知道了
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {messages.map((msg, index) => (
            <div key={index} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "rounded-br-md bg-[#8f1d21] text-white"
                    : "rounded-bl-md bg-stone-100 text-stone-800"
                }`}
              >
                {msg.content || (
                  <span className="inline-flex gap-1 text-stone-500">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-stone-200 px-4 py-3">
          {error && !loading && (
            <p className="mb-2 text-xs text-red-500">{error}</p>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={showApiWarning ? "请先在设置中配置 API Key..." : "输入你的问题..."}
              disabled={showApiWarning || loading}
              className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-[#8f1d21] focus:outline-none focus:ring-1 focus:ring-[#8f1d21] disabled:opacity-50"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={showApiWarning || loading || !input.trim()}
              className="rounded-lg bg-[#8f1d21] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
