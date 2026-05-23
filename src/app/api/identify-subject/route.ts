import { NextResponse } from "next/server";
import sharp from "sharp";
import type { SubjectIdentification } from "@/types/subjectIdentification";
import type { ApiConfig } from "@/types/projectTypes";

export const runtime = "nodejs";

const DEFAULT_VISION_MODEL = "doubao-vision-lite-32k-241015";

function formatUpstreamError(detail: string, fallback: string): string {
  try {
    const parsed = JSON.parse(detail);
    const code = parsed?.error?.code;
    const message = parsed?.error?.message;
    if (code === "ModelNotOpen") {
      return `当前 Ark 账号未开通所选视觉识别模型：${message}`;
    }
    return message ? `${fallback}：${message}` : fallback;
  } catch {
    return fallback;
  }
}

function firstConfiguredValue(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

async function compactDataUrl(imageUrl: string): Promise<string> {
  const match = imageUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (!match) return imageUrl;

  const input = Buffer.from(match[1], "base64");
  const output = await sharp(input)
    .resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  return `data:image/jpeg;base64,${output.toString("base64")}`;
}

function parseSubjectIdentification(text: string): SubjectIdentification {
  const parsed = JSON.parse(text);
  if (
    typeof parsed.subject !== "string" ||
    typeof parsed.category !== "string" ||
    !Array.isArray(parsed.evidence) ||
    typeof parsed.confidence !== "number" ||
    !Array.isArray(parsed.alternatives) ||
    typeof parsed.visualSummary !== "string"
  ) {
    throw new Error("主体识别结果缺少必要字段。");
  }

  return {
    subject: parsed.subject,
    category: parsed.category,
    evidence: parsed.evidence.map((item: unknown) => {
      if (typeof item !== "string") throw new Error("主体识别证据必须是字符串数组。");
      return item;
    }),
    confidence: parsed.confidence,
    alternatives: parsed.alternatives.map((item: unknown) => {
      if (typeof item !== "string") throw new Error("备选主体必须是字符串数组。");
      return item;
    }),
    visualSummary: parsed.visualSummary,
  };
}

export async function POST(req: Request) {
  const body = await req.json();
  const language = body.language === "en" ? "en" : "zh";
  const config = body.config as Partial<ApiConfig> | undefined;
  const useDefaultModel = config?.useDefaultModel === true;
  const envApiKey = firstConfiguredValue(process.env.ARK_API_KEY);
  const apiKey = useDefaultModel
    ? envApiKey
    : firstConfiguredValue(config?.visionModelApiKey, config?.textModelApiKey, config?.imageModelApiKey, envApiKey);
  const baseUrl = process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3";
  const model = useDefaultModel
    ? firstConfiguredValue(process.env.ARK_VISION_MODEL, process.env.AI_VISION_MODEL, DEFAULT_VISION_MODEL)
    : firstConfiguredValue(
      config?.visionModelName,
      process.env.ARK_VISION_MODEL,
      process.env.AI_VISION_MODEL,
      DEFAULT_VISION_MODEL,
    );

  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端未配置 ARK_API_KEY，无法调用主体识别接口。" },
      { status: 500 },
    );
  }

  const rawImageUrl = Array.isArray(body.imageUrl) ? body.imageUrl[0] : body.imageUrl;
  if (typeof rawImageUrl !== "string" || rawImageUrl.length === 0) {
    return NextResponse.json({ error: "缺少待识别主体图片。" }, { status: 400 });
  }

  const compactImageUrl = await compactDataUrl(rawImageUrl);
  const prompt = language === "en" ? `Identify the main subject in the reference image and output strict JSON.

Field requirements:
{
  "subject": "Specific subject name, for example lotus, opera mask, bird, porcelain vase, portrait",
  "category": "Subject category, for example plant, animal, person, object, pattern, architecture, text symbol, abstract graphic",
  "evidence": ["3 to 6 visual evidence items describing only visible shape, structure, color, material, or local features"],
  "confidence": a number from 0 to 1,
  "alternatives": ["1 to 3 possible alternative identifications"],
  "visualSummary": "An objective 60 to 120 word summary of the subject silhouette, main colors, composition, and visible style"
}

Do not infer from user configuration, filenames, or outside knowledge. Lower confidence when unclear and include alternatives. Output JSON only, no Markdown. Use English only.` : `请识别参考图像中最主要的主体是什么，并输出严格 JSON。

字段要求：
{
  "subject": "主体名称，尽量具体，例如莲花、脸谱、飞鸟、瓷瓶、人物头像",
  "category": "主体类别，例如植物、动物、人物、器物、纹样、建筑、文字符号、抽象图形",
  "evidence": ["3到6条视觉证据，只描述图像里能看见的形态、结构、颜色、材质或局部特征"],
  "confidence": 0到1之间的小数，表示识别把握",
  "alternatives": ["1到3个可能的备选识别"],
  "visualSummary": "60到120字，客观概括主体轮廓、主要颜色、构图和可见风格"
}

不要根据用户配置、文件名或外部知识补全。看不清时降低 confidence，并在 alternatives 中给出可能项。只输出 JSON，不要 Markdown。`;

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
            language === "en"
              ? "You are an image subject identification model. Judge only from visible image information and output strict JSON in English."
              : "你是图像主体识别模型。只根据图像可见信息判断主体，输出严格 JSON。",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: compactImageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: formatUpstreamError(detail, "主体识别失败。"), detail },
      { status: response.status },
    );
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    return NextResponse.json({ error: "主体识别接口未返回文本内容。" }, { status: 502 });
  }

  try {
    const identification = parseSubjectIdentification(text);
    return NextResponse.json({ identification, prompt });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "主体识别结果不是可解析的 JSON。",
        text,
      },
      { status: 502 },
    );
  }
}
