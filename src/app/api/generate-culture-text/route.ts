import { NextResponse } from "next/server";
import sharp from "sharp";
import type { SubjectIdentification } from "@/types/subjectIdentification";

export const runtime = "nodejs";

function formatUpstreamError(detail: string, fallback: string): string {
  try {
    const parsed = JSON.parse(detail);
    const code = parsed?.error?.code;
    const message = parsed?.error?.message;
    if (code === "ModelNotOpen") {
      return `当前 Ark 账号未开通所选文案模型：${message}`;
    }
    return message ? `${fallback}：${message}` : fallback;
  } catch {
    return fallback;
  }
}

async function compactDataUrl(imageUrl: string): Promise<string> {
  const match = imageUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (!match) return imageUrl;

  const input = Buffer.from(match[1], "base64");
  const output = await sharp(input)
    .resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();

  return `data:image/jpeg;base64,${output.toString("base64")}`;
}

function formatSubjectIdentification(identification: SubjectIdentification | undefined): string {
  if (!identification) return "未提供主体识别结果。";

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
  const model = process.env.ARK_TEXT_MODEL ?? process.env.AI_TEXT_MODEL ?? "doubao-seed-1-6-250615";
  const subjectIdentification = body.subjectIdentification as SubjectIdentification | undefined;

  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端未配置 ARK_API_KEY，无法调用 AI 文案接口。" },
      { status: 500 },
    );
  }

  const prompt = `请根据参考图像中可见的主体、色彩、构图和风格，以及下方人工可编辑的主体识别结果，为一个中华文创拼豆作品生成“作品介绍”。

参考生成模板：
{
  "title": "8到14个中文字符的作品名称，基于图像可见主体和文创形式",
  "source": "文化来源：只依据图像可见纹样、器物、符号、色彩、审美特征和主体识别结果推断文化出处或审美传统，80到140字",
  "meaning": "图案寓意：结合图像中的主体、色彩、构图和主体识别证据解释象征意义，80到140字",
  "design": "设计说明：结合参考图像描述拼豆化设计、产品载体、色彩控制和使用场景，100到180字"
}

只输出严格 JSON，字段只能是 title, source, meaning, design。

产品：${body.product}
网格：${body.gridWidth && body.gridHeight ? `${body.gridWidth}x${body.gridHeight}` : `${body.gridSize}x${body.gridSize}`}
颜色数：${body.colorCount}
材料颜色：${JSON.stringify(body.beadCounts ?? [])}
主体识别结果：
${formatSubjectIdentification(subjectIdentification)}
要求：
1. 只能依据参考图像和主体识别结果进行文化说明，不得结合、延续或猜测用户在配置页选择的主题、核心元素、文化说明。
2. 主体识别结果来自独立识别模块，若它与图像可见信息冲突，应以图像可见内容和识别证据为准，不要套用配置主题。
3. 作品名称必须包含“${body.product}”这几个字；禁止把产品写成挂饰、钥匙扣、冰箱贴、胸针、摆件等其他形式，除非产品本身就是这些形式。
4. 设计说明必须说明该拼豆成果如何作为“${body.product}”落地使用。
5. 输出前自检：title、source、meaning、design 四项都必须能被参考图像或主体识别结果支撑。`;

  const rawImageUrl = Array.isArray(body.imageUrl) ? body.imageUrl[0] : body.imageUrl;
  const compactImageUrl =
    typeof rawImageUrl === "string" && rawImageUrl.length > 0
      ? await compactDataUrl(rawImageUrl)
      : null;
  const finalTextConstraint = `最终检查：产品必须是“${body.product}”。title 必须直接包含“${body.product}”，不得使用“拼豆画”或其他产品词替代“${body.product}”。`;
  const userContent = compactImageUrl
    ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: compactImageUrl } },
        { type: "text", text: finalTextConstraint },
      ]
    : `${prompt}\n${finalTextConstraint}`;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是文创产品策划师和视觉分析师。文化判断必须以参考图像的可见内容和独立主体识别结果为依据，不得使用配置页主题、核心元素或用户文化说明来补全。只输出严格 JSON，不要 Markdown。",
        },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: formatUpstreamError(detail, "AI 文案请求失败。"), detail },
      { status: response.status },
    );
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(text);
    const copy = {
      title: String(parsed.title ?? ""),
      source: String(parsed.source ?? ""),
      meaning: String(parsed.meaning ?? ""),
      design: String(parsed.design ?? ""),
    };
    return NextResponse.json({ copy, prompt });
  } catch {
    return NextResponse.json(
      { error: "AI 文案接口返回内容不是可解析的 JSON。", text },
      { status: 502 },
    );
  }
}
