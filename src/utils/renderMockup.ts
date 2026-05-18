"use client";

import type { ProductTemplate } from "@/data/productTemplates";
import type { BeadPattern } from "./culturePattern";

export function renderMockupToCanvas(
  canvas: HTMLCanvasElement,
  pattern: BeadPattern,
  product: ProductTemplate,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = 800;
  canvas.height = 800;

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#f8fafc");
  gradient.addColorStop(1, product.id === "coaster" ? "#e9d5a1" : "#e0f2fe");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (product.id === "coaster") {
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(610, 230, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(700, 230, 34, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  } else if (product.id === "magnet") {
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    for (let i = 90; i < 760; i += 95) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
  } else if (product.id === "keychain" || product.id === "bag_charm") {
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(390, 120, 55, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(15, 23, 42, 0.1)";
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, canvas.height * 0.78, 245, 36, 0, 0, Math.PI * 2);
  ctx.fill();

  const x = 130;
  const y = 130;
  const w = 540;
  const h = 540;
  const cell = Math.min(w / pattern.width, h / pattern.height);
  const patternWidth = pattern.width * cell;
  const patternHeight = pattern.height * cell;
  const offsetX = x + (w - patternWidth) / 2;
  const offsetY = y + (h - patternHeight) / 2;
  pattern.grid.forEach((row, rowIndex) => {
    row.forEach((pixel, colIndex) => {
      ctx.fillStyle = pixel.isExternal ? "#ffffff" : pixel.color;
      ctx.fillRect(offsetX + colIndex * cell, offsetY + rowIndex * cell, Math.ceil(cell), Math.ceil(cell));
    });
  });

  ctx.strokeStyle = "rgba(15, 23, 42, 0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX, offsetY, patternWidth, patternHeight);
}
