import { CanvasTexture, RepeatWrapping } from "three";

/** Fine fibres and irregular edge ageing, painted before the ink. */
export function paintPaperFinish(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stains = true,
) {
  let seed = 404;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  ctx.save();
  for (let i = 0; i < (w * h) / 75; i++) {
    const x = random() * w;
    const y = random() * h;
    ctx.strokeStyle = random() > 0.5 ? "rgba(91,70,42,0.075)" : "rgba(255,251,229,0.25)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + random() * 7, y + random() * 2);
    ctx.stroke();
  }
  // Narrow edge wear leaves the central text area clean.
  const edge = ctx.createLinearGradient(0, 0, w, 0);
  edge.addColorStop(0, "rgba(99,70,34,0.23)");
  edge.addColorStop(0.035, "rgba(99,70,34,0.035)");
  edge.addColorStop(0.92, "rgba(99,70,34,0)");
  edge.addColorStop(1, "rgba(99,70,34,0.18)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);
  if (stains) {
    // Small, diffuse handling marks in the margins, never across the copy.
    const marks = [
      [0.035, 0.19, 0.045, 0.025],
      [0.975, 0.61, 0.04, 0.05],
      [0.12, 0.985, 0.065, 0.02],
      [0.86, 0.025, 0.07, 0.02],
    ];
    for (const [x, y, rx, ry] of marks) {
      ctx.save();
      ctx.translate(x * w, y * h);
      ctx.scale(rx * w, ry * h);
      const stain = ctx.createRadialGradient(-0.15, 0.1, 0, 0, 0, 1);
      stain.addColorStop(0, "rgba(133,94,43,0.13)");
      stain.addColorStop(0.45, "rgba(133,94,43,0.075)");
      stain.addColorStop(1, "rgba(133,94,43,0)");
      ctx.fillStyle = stain;
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }
  }
  ctx.restore();
}

/** Low-amplitude surface relief, separate from the printed ink. */
export function createPaperBump() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 256, 256);
  paintPaperFinish(ctx, 256, 256, false);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 4);
  return texture;
}
