import { loadApiConfig } from "./profileStorage";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

let serverEnvConfigured: boolean | null = null;

export async function checkServerEnvConfig(): Promise<boolean> {
  try {
    const res = await fetch("/api/env-config");
    const data = await res.json();
    serverEnvConfigured = data.configured === true;
    return serverEnvConfigured;
  } catch {
    serverEnvConfigured = false;
    return false;
  }
}

export function isApiConfigured(): boolean {
  const config = loadApiConfig();
  if (config?.textModelApiKey || config?.imageModelApiKey) return true;
  if (config?.useDefaultModel) return serverEnvConfigured === true;
  if (serverEnvConfigured === true) return true;
  return false;
}

function buildRequestConfig() {
  const config = loadApiConfig();
  return config?.useDefaultModel
    ? { useDefaultModel: true }
    : {
        textModelApiKey: config?.textModelApiKey ?? "",
        imageModelApiKey: config?.imageModelApiKey ?? "",
        textModelName: config?.textModelName ?? "",
      };
}

async function assertConfigured(): Promise<void> {
  const config = loadApiConfig();
  const canUseServerDefault =
    config?.useDefaultModel === true || serverEnvConfigured === true || await checkServerEnvConfig();

  if (!config && !canUseServerDefault) {
    throw new Error("请先在设置中配置 API 信息");
  }
}

export async function streamChatMessage(
  messages: ChatMessage[],
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  await assertConfigured();

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
      config: buildRequestConfig(),
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error ?? "AI 对话请求失败");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const lines = event.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;

        const parsed = JSON.parse(payload);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.delta) {
          fullText += parsed.delta;
          onDelta(parsed.delta);
        }
      }
    }
  }

  return fullText || "抱歉，我没有理解你的问题，请换一种方式提问。";
}

export async function sendChatMessage(
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  return streamChatMessage(messages, () => undefined, signal);
}
