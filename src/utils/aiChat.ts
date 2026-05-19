import { loadApiConfig } from "./profileStorage";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** 检查是否已配置 API（客户端本地或服务端环境变量） */
export function isApiConfigured(): boolean {
  const config = loadApiConfig();
  if (config?.textModelApiKey || config?.imageModelApiKey) return true;
  if (config?.useDefaultModel) return true; // 使用服务端默认模型，由服务端判断
  return false;
}

/** 发送聊天消息到 AI（通过服务端代理） */
export async function sendChatMessage(
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  const config = loadApiConfig();
  if (!config) {
    throw new Error("请先在设置中配置 API 信息");
  }

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
      config: {
        textModelApiKey: config.textModelApiKey,
        imageModelApiKey: config.imageModelApiKey,
        textModelName: config.textModelName,
        useDefaultModel: config.useDefaultModel,
      },
    }),
    signal,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error ?? "AI 对话请求失败");
  }

  return result?.content ?? "抱歉，我没有理解你的问题，请换一种方式提问。";
}
