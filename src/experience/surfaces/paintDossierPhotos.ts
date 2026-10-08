type Ctx = CanvasRenderingContext2D;

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** Warm, hazy sky shared by the dossier photographs. */
function paintSky(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  dark: boolean,
  seed: number,
) {
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, dark ? "#4b4236" : "#8c7c64");
  sky.addColorStop(1, dark ? "#a39378" : "#cdbd9b");
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  const r = rng(seed);
  for (let i = 0; i < 30; i++) {
    ctx.filter = `blur(${w * (0.012 + r() * 0.025)}px)`;
    // Bright cloud banks and darker gaps give the sky real structure.
    ctx.fillStyle =
      r() > 0.35 ? `rgba(244,234,210,${0.2 + r() * 0.35})` : `rgba(40,32,22,${0.12 + r() * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(
      x + r() * w,
      y + r() * h * 0.8,
      w * (0.1 + r() * 0.2),
      h * (0.03 + r() * 0.07),
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.filter = "none";
}

function vignette(ctx: Ctx, x: number, y: number, w: number, h: number, strength: number) {
  const v = ctx.createRadialGradient(
    x + w / 2,
    y + h / 2,
    w * 0.25,
    x + w / 2,
    y + h / 2,
    w * 0.78,
  );
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = v;
  ctx.fillRect(x, y, w, h);
}

/**
 * A dark, out-of-focus figure against a cloudy sky: an anonymous subject whose
 * face never resolves. Two variants differ in pose, framing and light.
 */
export function paintSilhouettePhoto(ctx: Ctx, x: number, y: number, s: number, variant: 0 | 1) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, s, s);
  ctx.clip();
  paintSky(ctx, x, y, s, s, variant === 1, 40 + variant * 17);

  const fig = document.createElement("canvas");
  fig.width = fig.height = Math.ceil(s);
  const f = fig.getContext("2d")!;
  f.fillStyle = "#1b1610";
  if (variant === 0) {
    // Long coat, head turned slightly, hat.
    f.beginPath();
    f.moveTo(s * 0.3, s);
    f.lineTo(s * 0.34, s * 0.52);
    f.quadraticCurveTo(s * 0.4, s * 0.44, s * 0.5, s * 0.43);
    f.quadraticCurveTo(s * 0.62, s * 0.44, s * 0.66, s * 0.54);
    f.lineTo(s * 0.72, s);
    f.closePath();
    f.fill();
    f.beginPath();
    f.ellipse(s * 0.5, s * 0.34, s * 0.075, s * 0.095, 0.1, 0, Math.PI * 2);
    f.fill();
    f.beginPath(); // brimmed hat: dome plus a slanted brim
    f.ellipse(s * 0.5, s * 0.262, s * 0.065, s * 0.05, 0, Math.PI, Math.PI * 2);
    f.fill();
    f.beginPath();
    f.ellipse(s * 0.5, s * 0.285, s * 0.125, s * 0.018, 0.08, 0, Math.PI * 2);
    f.fill();
  } else {
    // Closer, shoulders and head, framed off-centre.
    f.beginPath();
    f.moveTo(s * 0.34, s);
    f.quadraticCurveTo(s * 0.36, s * 0.66, s * 0.56, s * 0.62);
    f.quadraticCurveTo(s * 0.86, s * 0.66, s * 0.94, s);
    f.closePath();
    f.fill();
    f.beginPath();
    f.ellipse(s * 0.6, s * 0.46, s * 0.11, s * 0.14, -0.08, 0, Math.PI * 2);
    f.fill();
    f.fillRect(s * 0.55, s * 0.56, s * 0.1, s * 0.1);
    f.beginPath();
    f.ellipse(s * 0.595, s * 0.4, s * 0.108, s * 0.07, -0.08, Math.PI, Math.PI * 2);
    f.fill();
  }
  ctx.filter = `blur(${s * 0.012}px)`;
  ctx.drawImage(fig, x, y);
  ctx.globalAlpha = 0.45; // motion ghost
  ctx.filter = `blur(${s * 0.03}px)`;
  ctx.drawImage(fig, x + s * (variant === 0 ? 0.02 : -0.025), y - s * 0.004);
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  vignette(ctx, x, y, s, s, variant === 1 ? 0.6 : 0.45);
  ctx.restore();
}

/**
 * A dusk photograph of an apartment block: flat facade, lit and dark windows,
 * balconies, a door and a streetlight. Fills the given rectangle.
 */
export function paintApartmentPhoto(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  paintSky(ctx, x, y, w, h, true, 77);
  const r = rng(515);

  const bx = x + w * 0.14;
  const bw = w * 0.72;
  const by = y + h * 0.16;
  const bh = h * 0.78;
  ctx.fillStyle = "#2b261f";
  ctx.fillRect(bx - w * 0.07, y + h * 0.5, w * 0.08, bh * 0.5); // neighbour left
  ctx.fillRect(bx + bw - w * 0.01, y + h * 0.42, w * 0.1, bh * 0.58); // neighbour right
  ctx.fillStyle = "#3a342b"; // main block
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = "#26211b"; // roofline, water tank, vent
  ctx.fillRect(bx - w * 0.01, by - h * 0.015, bw + w * 0.02, h * 0.03);
  ctx.fillRect(bx + bw * 0.08, by - h * 0.05, bw * 0.12, h * 0.04);
  ctx.fillRect(bx + bw * 0.7, by - h * 0.035, bw * 0.08, h * 0.025);

  const cols = 4;
  const rows = 6;
  const cw = bw / cols;
  const rh = (bh * 0.84) / rows;
  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      const wx = bx + c * cw + cw * 0.2;
      const wy = by + h * 0.03 + row * rh + rh * 0.15;
      const lit = r() > 0.62;
      ctx.fillStyle = lit ? "#d8c690" : "#171410";
      ctx.fillRect(wx, wy, cw * 0.6, rh * 0.5);
      if (lit) {
        ctx.fillStyle = "rgba(255,240,190,0.18)";
        ctx.fillRect(wx - cw * 0.04, wy - rh * 0.04, cw * 0.68, rh * 0.58);
      }
      ctx.fillStyle = "#1d1913"; // window cross
      ctx.fillRect(wx + cw * 0.29, wy, cw * 0.02, rh * 0.5);
      ctx.fillStyle = "#4a4338"; // balcony rail
      ctx.fillRect(wx - cw * 0.05, wy + rh * 0.55, cw * 0.7, rh * 0.08);
    }
  }
  ctx.fillStyle = "#14110d"; // entrance
  ctx.fillRect(bx + bw * 0.4, by + bh * 0.88, bw * 0.2, bh * 0.12);
  ctx.fillStyle = "#d8c690";
  ctx.fillRect(bx + bw * 0.43, by + bh * 0.9, bw * 0.14, bh * 0.1);

  ctx.fillStyle = "#1c1813"; // pavement and streetlight
  ctx.fillRect(x, y + h * 0.94, w, h * 0.06);
  ctx.fillRect(x + w * 0.05, y + h * 0.55, w * 0.012, h * 0.4);
  ctx.fillStyle = "rgba(255,240,190,0.55)";
  ctx.beginPath();
  ctx.arc(x + w * 0.056, y + h * 0.55, w * 0.025, 0, Math.PI * 2);
  ctx.fill();

  vignette(ctx, x, y, w, h, 0.6);
  ctx.restore();
}
