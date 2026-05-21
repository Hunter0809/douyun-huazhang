import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function formatUpstreamError(detail: string, fallback: string): string {
  try {
    const parsed = JSON.parse(detail);
    const code = parsed?.error?.code;
    const message = parsed?.error?.message;
    if (code === "ModelNotOpen") {
      return `当前 Ark 账号未开通所选生图模型：${message}`;
    }
    return message ? `${fallback}：${message}` : fallback;
  } catch {
    return fallback;
  }
}

function firstConfiguredValue(...values: Array<string | undefined>): string {
  return values.map((value) => value?.trim()).find(Boolean) ?? "";
}

function getLatestUserPrompt(messages: unknown): string {
  if (!Array.isArray(messages)) return "";
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index] as Partial<ChatMessage> | undefined;
    if (message?.role === "user" && typeof message.content === "string") {
      return message.content.trim();
    }
  }
  return "";
}

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, config } = body;
  const useDefaultModel = config?.useDefaultModel === true;

  const envApiKey = firstConfiguredValue(process.env.ARK_API_KEY);
  const userApiKey = firstConfiguredValue(config?.imageModelApiKey);
  const apiKey = useDefaultModel ? envApiKey : firstConfiguredValue(userApiKey, envApiKey);
  const model = useDefaultModel
    ? firstConfiguredValue(process.env.ARK_IMAGE_MODEL, process.env.AI_IMAGE_MODEL, "doubao-seedream-4-0-250828")
    : firstConfiguredValue(config?.imageModelName, process.env.ARK_IMAGE_MODEL, process.env.AI_IMAGE_MODEL, "doubao-seedream-4-0-250828");
  const baseUrl = firstConfiguredValue(process.env.ARK_BASE_URL, "https://ark.cn-beijing.volces.com/api/v3");
  const prompt = getLatestUserPrompt(messages);

  if (!apiKey) {
    return NextResponse.json(
      { error: "未配置 Ark API Key。请在个人主页开启“使用系统默认模型”或填写生图模型 API Key。" },
      { status: 400 },
    );
  }

  if (!prompt) {
    return NextResponse.json({ error: "请输入生图提示词。" }, { status: 400 });
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
      watermark: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: formatUpstreamError(detail, "豆韵AI 生图请求失败。"), detail },
      { status: response.status },
    );
  }

  const result = await response.json();
  const base64 = result?.data?.[0]?.b64_json;
  const url = result?.data?.[0]?.url;
  if (!base64 && !url) {
    return NextResponse.json({ error: "豆韵AI 生图接口未返回图片数据。" }, { status: 502 });
  }

  return NextResponse.json({
    imageUrl: base64 ? `data:image/png;base64,${base64}` : url,
    prompt,
  });
}
