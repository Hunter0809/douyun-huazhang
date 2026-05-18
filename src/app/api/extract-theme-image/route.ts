import { NextResponse } from "next/server";
import { getAspectRatio } from "@/data/aspectRatios";

export const runtime = "nodejs";

function formatUpstreamError(detail: string, fallback: string): string {
  try {
    const parsed = JSON.parse(detail);
    const message = parsed?.error?.message;
    return message ? `${fallback}：${message}` : fallback;
  } catch {
    return fallback;
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const apiKey = process.env.AI_API_KEY ?? process.env.ARK_API_KEY ?? process.env.OPENAI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3";
  const model = process.env.AI_IMAGE_MODEL ?? "doubao-seedream-4-0-250828";
  const ratio = getAspectRatio(body.aspectRatio ?? "1:1");

  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端未配置 AI_API_KEY，无法调用主题元素提取接口。" },
      { status: 500 },
    );
  }

  if (!body.imageUrl) {
    return NextResponse.json({ error: "缺少待提取的图片。" }, { status: 400 });
  }

  const prompt = [
    "参考上传图片，提取其中最适合作为中华文创拼豆作品的核心主体元素。",
    `文化主题：${body.theme ?? ""}`,
    `核心元素：${body.element ?? ""}`,
    body.meaning ? `文化说明：${body.meaning}` : "",
    "去除杂乱背景、环境干扰、无关人物和多余物体，仅保留主体元素与必要轮廓。",
    "输出为干净背景上的正面主体元素图，边缘清晰，色块分明，高对比，适合后续转成拼豆图纸。",
    "不要添加文字、水印或复杂摄影背景。",
  ].filter(Boolean).join("\n");

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      image_urls: [body.imageUrl],
      n: 1,
      size: ratio.imageSize,
      response_format: "b64_json",
      watermark: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: formatUpstreamError(detail, "主题元素提取失败。"), detail },
      { status: response.status },
    );
  }

  const result = await response.json();
  const base64 = result?.data?.[0]?.b64_json;
  const url = result?.data?.[0]?.url;
  if (!base64 && !url) {
    return NextResponse.json({ error: "主题元素提取接口未返回图片数据。" }, { status: 502 });
  }

  return NextResponse.json({
    imageUrl: base64 ? `data:image/png;base64,${base64}` : url,
  });
}
