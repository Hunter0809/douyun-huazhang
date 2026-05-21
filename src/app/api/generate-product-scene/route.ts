import { NextResponse } from "next/server";
import { getAspectRatio } from "@/data/aspectRatios";
import { getProductTemplate } from "@/data/productTemplates";

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
  const apiKey = process.env.ARK_API_KEY;
  const baseUrl = process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3";
  const model = process.env.ARK_IMAGE_MODEL ?? process.env.AI_IMAGE_MODEL ?? "doubao-seedream-4-0-250828";
  const product = getProductTemplate(body.productId ?? "coaster");
  const ratio = getAspectRatio(body.aspectRatio ?? "1:1");

  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端未配置 ARK_API_KEY，无法生成文创产品场景预览。" },
      { status: 500 },
    );
  }

  if (!body.patternUrl) {
    return NextResponse.json({ error: "缺少拼豆成果参考图。" }, { status: 400 });
  }

  const promptText = [
    "【任务：拼豆成品真实场景预览 · 第四步（最后一步）】",
    "参考图中是一张已经完成像素化处理和拼豆颜色映射的拼豆图纸（像素网格图）。",
    "⚠️ 严格要求：请将参考图中的拼豆图纸忠实地呈现为真实的拼豆实体成品效果。",
    "",
    "必须遵守：",
    "• 保留参考图中拼豆图纸的完整图案、颜色关系、颗粒质感和网格化结构",
    "• 不要把图案替换为其他插画、手绘或非拼豆材质的内容",
    "• 不要重新设计或修改图案本身，不要添加新的装饰元素",
    "• 拼豆颗粒应呈现塑料/树脂珠粒的质感，表面带有轻微的漫反射光泽",
    "• 每个拼豆颗粒之间的间隙清晰可见，体现拼豆工艺特有的网格质感",
    "",
    product.scenePrompt,
    "输出真实生活场景照片感预览，自然光线，构图干净，主体文创产品清晰，避免文字、水印和夸张装饰。",
  ].join("\n");

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: promptText,
      image_urls: [body.patternUrl],
      n: 1,
      size: ratio.imageSize,
      response_format: "b64_json",
      watermark: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: formatUpstreamError(detail, "文创产品场景预览生成失败。"), detail },
      { status: response.status },
    );
  }

  const result = await response.json();
  const base64 = result?.data?.[0]?.b64_json;
  const url = result?.data?.[0]?.url;
  if (!base64 && !url) {
    return NextResponse.json({ error: "文创产品场景预览接口未返回图片数据。" }, { status: 502 });
  }

  return NextResponse.json({
    imageUrl: base64 ? `data:image/png;base64,${base64}` : url,
    prompt: promptText,
  });
}
