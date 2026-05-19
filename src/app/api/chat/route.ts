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

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, config } = body;

  // 优先使用请求中携带的用户自定义 API 配置
  const apiKey = config?.textModelApiKey || config?.imageModelApiKey
    || process.env.AI_API_KEY || process.env.ARK_API_KEY || process.env.OPENAI_API_KEY;
  const model = config?.textModelName || process.env.AI_TEXT_MODEL || "gpt-4o-mini";
  const baseUrl = config?.textModelBaseUrl || process.env.AI_BASE_URL || "https://api.openai.com/v1";

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
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: formatUpstreamError(detail, "AI 对话请求失败。"), detail },
      { status: response.status },
    );
  }

  const result = await response.json();
  const content = result?.choices?.[0]?.message?.content;

  return NextResponse.json({ content });
}
