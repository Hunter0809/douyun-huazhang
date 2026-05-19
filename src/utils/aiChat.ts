import { loadApiConfig } from "./profileStorage";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `你是豆韵助手，一个专注解答中华传统文化和拼豆制作相关问题的 AI 助手。

你可以回答以下几类问题：
1. **传统文化知识**：青花瓷、敦煌文化、戏曲脸谱、山海经、二十四节气、传统纹样、书法篆刻、非遗工艺等
2. **拼豆制作技巧**：颜色选择、像素化处理、图纸设计、成品制作、材料推荐等
3. **豆韵工具使用**：如何操作豆韵工具的各个功能步骤、参数含义等
4. **配色建议**：基于传统文化主题的配色方案推荐
5. **文化图案设计**：传统纹样的含义、应用场景等

回答风格：
- 用简体中文回答
- 语言亲切友好，像老朋友聊天一样
- 回答精炼，重点突出
- 可以给出具体的建议和示例
- 对于不确定的内容，坦诚说明`;

/** 检查是否已配置 API */
export function isApiConfigured(): boolean {
  const config = loadApiConfig();
  if (!config) return false;
  return !!(config.textModelApiKey || config.imageModelApiKey);
}

/** 发送聊天消息到 AI */
export async function sendChatMessage(
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  const config = loadApiConfig();
  if (!config) {
    throw new Error("请先在设置中配置 API 信息");
  }

  // 优先使用文本模型 API Key，否则用图片模型的
  const apiKey = config.textModelApiKey || config.imageModelApiKey;
  if (!apiKey) {
    throw new Error("未配置 API Key，请先在设置中填写 API Key");
  }

  const model = config.textModelName || "gpt-4o-mini";
  // 默认 baseUrl
  const baseUrl = "https://api.openai.com/v1";

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map(({ role, content }) => ({ role, content })),
      ],
      stream: false,
    }),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI 对话请求失败: ${detail}`);
  }

  const result = await response.json();
  return result?.choices?.[0]?.message?.content ?? "抱歉，我没有理解你的问题，请换一种方式提问。";
}
