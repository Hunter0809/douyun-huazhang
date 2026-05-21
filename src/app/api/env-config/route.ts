import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/env-config
 * 返回服务器环境变量中配置的 AI 模型信息（不暴露密钥本身）
 * 供前端 ProfilePage 在"使用默认模型"模式下展示
 */
export async function GET() {
  const apiKeyExists = Boolean(process.env.ARK_API_KEY);
  const baseUrl = process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3";
  const imageModel = process.env.ARK_IMAGE_MODEL ?? process.env.AI_IMAGE_MODEL ?? "";
  const textModel = process.env.ARK_TEXT_MODEL ?? process.env.AI_TEXT_MODEL ?? "";
  const visionModel = process.env.ARK_VISION_MODEL ?? process.env.AI_VISION_MODEL ?? "";

  return NextResponse.json({
    configured: apiKeyExists,
    baseUrl: baseUrl,
    defaultImageModel: imageModel,
    defaultTextModel: textModel,
    defaultVisionModel: visionModel,
  });
}
