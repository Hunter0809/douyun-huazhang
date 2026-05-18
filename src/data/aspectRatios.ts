export type AspectRatioId = "1:1" | "3:4" | "9:16" | "4:3" | "16:9";

export type AspectRatioOption = {
  id: AspectRatioId;
  label: string;
  width: number;
  height: number;
  imageSize: string;
};

export const aspectRatios: AspectRatioOption[] = [
  { id: "1:1", label: "1:1", width: 1, height: 1, imageSize: "1024x1024" },
  { id: "3:4", label: "3:4", width: 3, height: 4, imageSize: "864x1152" },
  { id: "9:16", label: "9:16", width: 9, height: 16, imageSize: "768x1365" },
  { id: "4:3", label: "4:3", width: 4, height: 3, imageSize: "1152x864" },
  { id: "16:9", label: "16:9", width: 16, height: 9, imageSize: "1365x768" },
];

export function getAspectRatio(id: string): AspectRatioOption {
  return aspectRatios.find((item) => item.id === id) ?? aspectRatios[0];
}
