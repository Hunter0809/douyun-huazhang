import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

function formatUpstreamError(detail: string, fallback: string): string {
  try {
    const parsed = JSON.parse(detail);
    const code = parsed?.error?.code;
    const message = parsed?.error?.message;
    if (code === "ModelNotOpen") {
      return `当前 Ark 账号未开通所选模型：${message}`;
    }
    return message ? `${fallback}：${message}` : fallback;
  } catch {
    return fallback;
  }
}

function firstConfiguredValue(...values: Array<string | undefined>): string {
  return values.map((value) => value?.trim()).find(Boolean) ?? "";
}

function sseData(value: unknown): string {
  return `data: ${JSON.stringify(value)}\n\n`;
}

function extractDelta(payload: string): string {
  if (payload === "[DONE]") return "";
  try {
    const parsed = JSON.parse(payload);
    return parsed?.choices?.[0]?.delta?.content
      ?? parsed?.choices?.[0]?.message?.content
      ?? "";
  } catch {
    return "";
  }
}

const SYSTEM_PROMPT = `你是“豆韵助手”，专注回答中华传统文化、拼豆制作和豆韵工具使用问题。
可覆盖：传统纹样与非遗文化、拼豆配色与图纸制作、材料和成品建议、豆韵功能步骤、文化图案设计含义。
回答要求：使用简体中文；语气亲切自然；内容精炼但具体；优先给出可执行建议和例子；不确定时明确说明。`;

function normalizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message): message is ChatMessage => {
      if (!message || typeof message !== "object") return false;
      const candidate = message as Partial<ChatMessage>;
      return (
        (candidate.role === "user" || candidate.role === "assistant" || candidate.role === "system") &&
        typeof candidate.content === "string" &&
        candidate.content.trim().length > 0
      );
    })
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, config } = body;
  const useDefaultModel = config?.useDefaultModel === true;

  const envApiKey = firstConfiguredValue(
    process.env.AI_API_KEY,
    process.env.ARK_API_KEY,
    process.env.OPENAI_API_KEY,
  );
  const userApiKey = firstConfiguredValue(config?.textModelApiKey, config?.imageModelApiKey);
  const apiKey = useDefaultModel ? envApiKey : firstConfiguredValue(userApiKey, envApiKey);
  const model = useDefaultModel
    ? firstConfiguredValue(process.env.AI_TEXT_MODEL, "gpt-4o-mini")
    : firstConfiguredValue(config?.textModelName, process.env.AI_TEXT_MODEL, "gpt-4o-mini");
  const baseUrl = useDefaultModel
    ? firstConfiguredValue(process.env.AI_BASE_URL, "https://api.openai.com/v1")
    : firstConfiguredValue(config?.textModelBaseUrl, process.env.AI_BASE_URL, "https://api.openai.com/v1");

  if (!apiKey) {
    return NextResponse.json(
      { error: "未配置 API Key。请在个人主页开启“使用系统默认模型”或手动填写 API Key。" },
      { status: 400 },
    );
  }

  const chatMessages = normalizeMessages(messages);
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
        ...chatMessages,
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 700,
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text();
    return NextResponse.json(
      { error: formatUpstreamError(detail, "AI 对话请求失败。"), detail },
      { status: response.status },
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = response.body!.getReader();
      let buffer = "";
      let doneSent = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              doneSent = true;
              controller.enqueue(encoder.encode(sseData({ done: true })));
              continue;
            }

            const delta = extractDelta(payload);
            if (delta) {
              controller.enqueue(encoder.encode(sseData({ delta })));
            }
          }
        }

        if (!doneSent) {
          controller.enqueue(encoder.encode(sseData({ done: true })));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI 对话流中断。";
        controller.enqueue(encoder.encode(sseData({ error: message })));
      } finally {
        controller.close();
      }
    },
    cancel() {
      response.body?.cancel().catch(() => undefined);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
