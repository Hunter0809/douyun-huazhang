import { NextResponse } from "next/server";
import { getAspectRatio } from "@/data/aspectRatios";
import type { SubjectIdentification } from "@/types/subjectIdentification";

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

function formatSubjectIdentification(identification: SubjectIdentification): string {
  return [
    `主体名称：${identification.subject}`,
    `主体类别：${identification.category}`,
    `识别置信度：${identification.confidence}`,
    `视觉证据：${identification.evidence.join("；")}`,
    `备选识别：${identification.alternatives.join("；")}`,
    `视觉摘要：${identification.visualSummary}`,
  ].join("\n");
}

export async function POST(req: Request) {
  const body = await req.json();
  const apiKey = process.env.ARK_API_KEY;
  const baseUrl = process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3";
  const model = process.env.ARK_IMAGE_MODEL ?? process.env.AI_IMAGE_MODEL ?? "doubao-seedream-4-0-250828";
  const ratio = getAspectRatio(body.aspectRatio ?? "1:1");
  const isUpload = body.isUpload === true;
  const subjectIdentification = body.subjectIdentification as SubjectIdentification | undefined;

  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端未配置 ARK_API_KEY，无法调用主题元素提取接口。" },
      { status: 500 },
    );
  }

  if (!isUpload && !body.imageUrl) {
    return NextResponse.json({ error: "缺少待提取的图片。" }, { status: 400 });
  }

  if (isUpload && !subjectIdentification) {
    return NextResponse.json({ error: "缺少主体识别结果，无法进行文本驱动再创作。" }, { status: 400 });
  }

  const promptText = isUpload
    ? [
        "【任务：基于主体识别结果进行文化意象再创作】",
        "请只依据下方主体识别信息进行图案再创作，不要读取或依赖原始图片。",
        "",
        "主体识别信息：",
        subjectIdentification ? formatSubjectIdentification(subjectIdentification) : "",
        "",
        `作品形式：${body.product ?? "拼豆文创底稿"}`,
        "",
        "创作要求：",
        "以主体名称、类别、视觉证据和视觉摘要为基础，重新设计为适合拼豆转化的文创图案。",
        "不要强行替换主体；应保留识别信息中描述的关键轮廓、结构、颜色关系和可识别特征。",
        "可以结合主体自身特征选择合适的传统纹样、边饰、符号或结构语言进行融合。",
        "颜色应服务于文化主题和作品形式，保持主体清晰、层次克制、色块分明。",
        "背景建议为纯白或浅纯色，背景色不计入主体表达。",
        "可以围绕主体元素融入中国传统纹样来增强文化感，但主体应占据画面主要面积。",
        "",
        "技术要求：",
        "• 保留主体识别信息中的必要轮廓和识别特征",
        "• 输出为干净背景上的正面文创图案，背景建议为纯白或浅纯色（浅纯色不计入配色方案）",
        "• 边缘清晰，色块分明，高对比度，避免复杂渐变和模糊过渡",
        "• 这是第二步「主体再创作」，后续第三步会对本结果进行像素化处理变成拼豆图纸",
        "• 不要把图案像素化，不要绘制拼豆网格，不要添加色号",
        "• 不要添加文字、水印或复杂摄影背景",
      ].join("\n")
    : [
        "【任务：生成传统文化主题图案】",
        "请根据以下文化主题和核心元素，创作一幅中华传统文化风格的平面装饰图案。",
        `文化主题：${body.theme ?? ""}`,
        `核心元素：${body.element ?? ""}`,
        body.meaning ? `文化说明：${body.meaning}` : "",
        "",
        "配色要求：",
        "• 精心选择与主题和文化说明相匹配的配色方案（包含 2~6 种主要颜色）",
        "• 主色在画面中占主导地位，辅助色起点缀和丰富作用",
        "• 颜色搭配要和谐统一，符合传统文化审美",
        "",
        "设计要求：",
        "• 主体居中，边缘明确，色块清晰分明，高对比度",
        "• 避免复杂渐变和模糊过渡，便于后续像素化处理",
        "• 背景建议为纯白或浅纯色（不计入配色方案）",
        "• 这是第二步「图案设计」，后续第三步会对本结果进行像素化处理变成拼豆图纸",
        "• 不要把图案像素化，不要绘制拼豆网格，不要添加色号",
        "• 输出干净的平面装饰图，不要文字、不要水印、不要复杂背景",
      ].filter(Boolean).join("\n");

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: promptText,
      n: 1,
      size: ratio.imageSize,
      response_format: "b64_json",
      watermark: false,
      ...(!isUpload && body.imageUrl ? { image_urls: [body.imageUrl] } : {}),
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
    prompt: promptText,
  });
}
