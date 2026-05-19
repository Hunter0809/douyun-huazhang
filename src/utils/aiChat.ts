import { loadApiConfig } from "./profileStorage";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** 服务端环境变量是否已配置API的缓存结果 */
let serverEnvConfigured: boolean | null = null;

/**
 * 从服务端获取环境变量配置状态并缓存
 * 在应用初始化时调用一次即可
 */
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

/** 检查是否已配置 API（客户端本地或服务端环境变量） */
export function isApiConfigured(): boolean {
  const config = loadApiConfig();
  if (config?.textModelApiKey || config?.imageModelApiKey) return true;
  if (config?.useDefaultModel) return serverEnvConfigured === true;
  // 服务端环境变量已配置API时也视为已配置
  if (serverEnvConfigured === true) return true;
  return false;
}

/** 发送聊天消息到 AI（通过服务端代理） */
export async function sendChatMessage(
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  const config = loadApiConfig();
  const canUseServerDefault =
    config?.useDefaultModel === true || serverEnvConfigured === true || await checkServerEnvConfig();

  if (!config && !canUseServerDefault) {
    throw new Error("请先在设置中配置 API 信息");
  }

  const requestConfig = config?.useDefaultModel
    ? { useDefaultModel: true }
    : {
        textModelApiKey: config?.textModelApiKey ?? "",
        imageModelApiKey: config?.imageModelApiKey ?? "",
        textModelName: config?.textModelName ?? "",
      };

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
      config: requestConfig,
    }),
    signal,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error ?? "AI 对话请求失败");
  }

  return result?.content ?? "抱歉，我没有理解你的问题，请换一种方式提问。";
}
