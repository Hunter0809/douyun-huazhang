import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  const body = await req.json();
  const apiKey = process.env.AI_API_KEY ?? process.env.ARK_API_KEY ?? process.env.OPENAI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3";
  const model = process.env.AI_TEXT_MODEL ?? "doubao-seed-1-6-250615";

  if (!apiKey) {
    return NextResponse.json(
      { error: "服务端未配置 AI_API_KEY，无法调用制作方案接口。" },
      { status: 500 },
    );
  }

  const {
    theme,
    element,
    meaning,
    product,
    gridWidth,
    gridHeight,
    gridSize,
    colorCount,
    beadCounts,
    imageUrl,
  } = body;

  const beadSummary = (beadCounts ?? [])
    .map((item: { brandCode: string; rgb: string; count: number }) =>
      `${item.brandCode || item.rgb}: ${item.count} 颗`
    )
    .join("、");

  const prompt = `你是一个专业的文创拼豆制作方案策划师。请根据用户提供的中华文创拼豆作品信息，生成一份完整的"拼豆制作方案"。

作品信息：
- 主题：${theme ?? "未指定"}
- 核心元素：${element ?? "未指定"}
- 文化说明：${meaning ?? "未指定"}
- 产品形式：${product ?? "拼豆底稿"}
- 网格：${gridWidth && gridHeight ? `${gridWidth}×${gridHeight}` : `${gridSize ?? "?"}×${gridSize ?? "?"}`}
- 颜色数：${colorCount ?? "?"} 色c
- 拼豆用量：${beadSummary || "未提供"}

输出格式要求：
请生成一个完整的制作方案，包含以下五个部分，用标题行分隔：

【作品标题】
为这个拼豆作品取一个富有文化气息的名称（8-14个字）。

【材料选择】
根据拼豆用量提供具体的材料选择建议，包括颜色准备策略、每种颜色建议多备的比例等。

【工具选择】
推荐适合的工具清单，包括模板板、镊子/取豆笔、熨烫工具等。

【拼豆步骤】
分步骤说明拼豆制作顺序，从轮廓到细节的摆放策略。

【熨烫步骤与注意事项】
详细说明熨烫温度、时间、手法和冷却脱板注意事项。

要求：
1. 用简体中文，语气亲切专业
2. 结合"${theme}"主题的文化特点给出个性化建议
3. 内容精炼实用，突出拼豆制作的要点
4. 只输出以上五个部分的内容，不要额外添加说明`;

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
          content: "你是文创拼豆制作方案策划师。根据提供的作品信息，生成结构清晰、内容实用的拼豆制作方案。只输出要求的五个部分。",
        },
        {
          role: "user",
          content: imageUrl
            ? [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ]
            : prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: formatUpstreamError(detail, "制作方案生成失败。"), detail },
      { status: response.status },
    );
  }

  const result = await response.json();
  const planText = result?.choices?.[0]?.message?.content ?? "";

  return NextResponse.json({
    planText,
    prompt,
  });
}
