import { NextResponse } from "next/server";

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

/**
 * POST /api/matting
 *
 * 接收原始图像和可选的蒙版，通过 AI 进行主体提取/抠图。
 * 支持两种方式：
 *   1. 无蒙版：直接对原图做主体提取，不进行风格改写
 *   2. 有蒙版：将蒙版作为参考，引导 AI 精确抠出内容
 */
export async function POST(req: Request) {
  const body = await req.json();
  const apiKey = process.env.ARK_API_KEY;
  const baseUrl = process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3";
  const model = process.env.ARK_IMAGE_MODEL ?? process.env.AI_IMAGE_MODEL ?? "doubao-seedream-4-0-250828";

  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端未配置 ARK_API_KEY，无法调用抠图接口。" },
      { status: 500 },
    );
  }

  if (!body.imageUrl) {
    return NextResponse.json({ error: "缺少待处理的图片。" }, { status: 400 });
  }

  const hasMask = Boolean(body.maskUrl);
  const maskInstruction = hasMask
    ? [
        "用户提供了一张蒙版图片，蒙版中白色区域代表需要保留的前景（核心元素），黑色区域代表需要去除的背景。",
        "请严格按照蒙版的引导，提取白色区域覆盖的主体，将黑色区域全部替换为干净背景。",
        "保持前景主体轮廓清晰、细节完整，不要超出蒙版白色区域的范围。",
        "输出为透明背景的主体元素 PNG 图。",
      ]
    : [
        "直接识别上传图片中的主要主体，并进行抠图。",
        "去除杂乱背景、环境干扰和无关物体，仅保留原图主体与必要轮廓。",
        "保持主体原有造型、颜色、材质和风格，不要把它改写为传统文化元素，不要重新创作图案。",
        "输出为透明背景或干净背景上的主体 PNG 图，边缘清晰，适合后续转成拼豆图纸。",
      ];

  const prompt = [
    "你是一个专业的图像抠图工具。",
    "从提供的图片中提取核心主体元素，只做主体分割和背景移除。",
    ...maskInstruction,
    "不要添加文字、水印或复杂摄影背景。",
  ].filter(Boolean).join("\n");

  // 构建请求体
  const requestBody: Record<string, unknown> = {
    model,
    prompt,
    n: 1,
    size: body.size ?? "1024x1024",
    response_format: "b64_json",
    watermark: false,
  };

  // 蒙版引导 - 某些模型支持 mask 参数
  if (hasMask) {
    requestBody.mask_url = body.maskUrl;
  }

  // 传入原图参考
  requestBody.image_urls = [body.imageUrl];

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: formatUpstreamError(detail, "抠图处理失败。"), detail },
      { status: response.status },
    );
  }

  const result = await response.json();
  const base64 = result?.data?.[0]?.b64_json;
  const url = result?.data?.[0]?.url;
  if (!base64 && !url) {
    return NextResponse.json({ error: "抠图接口未返回图片数据。" }, { status: 502 });
  }

  return NextResponse.json({
    imageUrl: base64 ? `data:image/png;base64,${base64}` : url,
  });
}
