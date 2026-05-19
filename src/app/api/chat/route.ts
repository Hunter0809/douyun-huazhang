import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

const SYSTEM_PROMPT = `你是豆韵助手，一个专注解答中华传统文化和拼豆制作相关问题的 AI 助手。

你可以回答以下几类问题：
1. 传统文化知识：青花瓷、敦煌文化、戏曲脸谱、山海经、二十四节气、传统纹样、书法篆刻、非遗工艺等
2. 拼豆制作技巧：颜色选择、像素化处理、图纸设计、成品制作、材料推荐等
3. 豆韵工具使用：如何操作豆韵工具的各个功能步骤、参数含义等
4. 配色建议：基于传统文化主题的配色方案推荐
5. 文化图案设计：传统纹样的含义、应用场景等

回答风格：
- 用简体中文回答
- 语言亲切友好，像老朋友聊天一样
- 回答精炼，重点突出
- 可以给出具体的建议和示例
- 对于不确定的内容，坦诚说明`;

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
      { error: "未配置 API Key。请在个人主页开启「使用系统默认模型」或手动填写 API Key。" },
      { status: 400 },
    );
  }

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
        ...(messages || []).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
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
              controller.enqueue(encoder.encode(sseData({ done: true })));
              continue;
            }

            const delta = extractDelta(payload);
            if (delta) {
              controller.enqueue(encoder.encode(sseData({ delta })));
            }
          }
        }

        controller.enqueue(encoder.encode(sseData({ done: true })));
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
