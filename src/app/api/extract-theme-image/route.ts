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

  // 上传图片模式：忽略用户填写的主题/元素/说明，仅从图片本身分析
  const isUpload = body.isUpload === true;

  const prompt = isUpload
    ? [
        "这是一张用户上传的图片。请仔细观察图片内容，从中提取最主要、最清晰的核心主体元素。",
        "根据你从图片中识别出的视觉元素（如动植物、纹样、器物、人物等）和风格特征，",
        "识别其文化含义（例如属于中国传统文化中的吉祥纹样、自然意象等），",
        "基于这些图像中真实存在的元素，重新设计一张干净的文创主题图案。",
        "不要引入图片中没有的新元素或虚构内容。",
        "保留原图主体元素的必要轮廓和识别特征，去除杂乱背景、环境干扰和多余物体。",
        "可以融入中国传统纹样、传统配色和装饰构图增强文化感，",
        "但不要把图案像素化，不要绘制拼豆网格，不要添加色号。",
        "输出为干净背景上的正面文创图案，边缘清晰，色块分明，高对比，适合后续转换成拼豆图纸。",
        "不要添加文字、水印或复杂摄影背景。",
      ].join("\n")
    : [
        "参考上传图片，先提取其中最主要、最清晰的主体元素。",
        "基于该主体元素创建一张中华传统文化风格的文创图案。",
        `文化主题：${body.theme ?? ""}`,
        `核心元素：${body.element ?? ""}`,
        body.meaning ? `文化说明：${body.meaning}` : "",
        "去除杂乱背景、环境干扰、无关人物和多余物体，保留主体元素的必要轮廓和识别特征。",
        "可以融入传统纹样、传统配色和装饰构图，但不要把图案像素化，不要绘制拼豆网格，不要添加色号。",
        "输出为干净背景上的正面文创图案，边缘清晰，色块分明，高对比，适合在后续第三阶段转换成拼豆图纸。",
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
