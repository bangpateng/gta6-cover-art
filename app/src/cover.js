// The cover renderer for Neon Shore: draws the multi-panel poster onto any
// 2D canvas at any size. Everything is drawn from scratch — gradients, a
// slit sun, palm silhouettes, Anton title lettering with a Pacifico subtitle
// — so the art is the app's own, never Rockstar's.
import { GRADES } from './grades.js';
import { LAYOUTS, layoutPanels } from './layouts.js';

const OVERLAY_LAYOUTS = new Set(['tilted-snaps', 'full-bleed']);

let noiseCanvas = null;
function grainTile() {
  if (noiseCanvas) return noiseCanvas;
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 128;
  noiseCanvas.height = 128;
  const nctx = noiseCanvas.getContext('2d');
  const data = nctx.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  return noiseCanvas;
}

/** Draws one photo into a panel rect, cover-fit, with zoom and pan offsets. */
export function drawPhotoInPanel(ctx, photo, panel, transform) {
  const { zoom, dx, dy } = transform;
  const scale = Math.max(panel.w / photo.naturalWidth, panel.h / photo.naturalHeight) * zoom;
  const pw = photo.naturalWidth * scale;
  const ph = photo.naturalHeight * scale;
  const cx = panel.x + panel.w / 2 + dx * panel.w;
  const cy = panel.y + panel.h / 2 + dy * panel.h;
  ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
}

/** A synthwave sun: a gradient disc cut by horizontal slits. */
export function drawSun(ctx, cx, cy, r, grade) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.6);
  glow.addColorStop(0, grade.sunRim + '55');
  glow.addColorStop(1, grade.sunRim + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, grade.sunCore);
  disc.addColorStop(1, grade.sunRim);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = grade.skyMid;
  const slits = [0.05, 0.3, 0.55, 0.78];
  slits.forEach((f, i) => {
    const y = cy + r * f;
    const half = Math.sqrt(Math.max(0, r * r - (r * f) * (r * f)));
    ctx.globalAlpha = 0.55 + i * 0.1;
    ctx.fillRect(cx - half, y, half * 2, r * (0.05 + i * 0.02));
  });
  ctx.globalAlpha = 1;
}

/** A palm silhouette: one curved trunk and six fronds arching up from the crown. */
export function drawPalm(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk: a gentle curve from the base up to the crown.
  ctx.lineWidth = Math.max(2.5, size * 0.05);
  const crownX = x + size * 0.28;
  const crownY = y - size * 0.82;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + size * 0.05, y - size * 0.5, crownX, crownY);
  ctx.stroke();
  // Fronds fan up and out from the crown and droop only at the tips, so the
  // silhouette reads as a palm and not a starburst.
  ctx.lineWidth = Math.max(2, size * 0.035);
  const fronds = [-0.88, -0.65, -0.42, -0.2, -0.02];
  fronds.forEach((a, i) => {
    const len = size * (0.36 + (i % 2) * 0.07);
    const tipX = crownX + Math.cos(a * Math.PI) * len;
    const tipY = crownY + Math.sin(a * Math.PI) * len * 0.55 + len * 0.1;
    const ctrlX = crownX + Math.cos(a * Math.PI) * len * 0.55;
    const ctrlY = crownY + Math.sin(a * Math.PI) * len * 0.85 - len * 0.25;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
    ctx.stroke();
  });
  // Two coconuts tucked under the crown.
  ctx.beginPath();
  ctx.arc(crownX - size * 0.03, crownY + size * 0.05, size * 0.045, 0, Math.PI * 2);
  ctx.arc(crownX + size * 0.05, crownY + size * 0.06, size * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Fits Anton capitals to the width, shrinking until they fit. */
export function fitTitleFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  }
  return size;
}

/** Draws the title block: gradient title in Anton, script subtitle in Pacifico. */
export function drawTitleBlock(ctx, width, height, grade, title, subtitle, bandH) {
  const band = ctx.createLinearGradient(0, height - bandH, 0, height);
  band.addColorStop(0, grade.ink + '00');
  band.addColorStop(1, grade.ink + 'd9');
  ctx.fillStyle = band;
  ctx.fillRect(0, height - bandH, width, bandH);

  const cleanTitle = (title ?? '').trim().toUpperCase().slice(0, 40);
  const cleanSub = (subtitle ?? '').trim().slice(0, 48);
  let titleBottom = height - height * 0.045;

  if (cleanSub) {
    const subSize = Math.max(16, height * 0.032);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = grade.subtitle;
    ctx.shadowBlur = subSize * 0.6;
    ctx.fillStyle = grade.subtitle;
    ctx.fillText(cleanSub, width / 2, height - height * 0.02);
    ctx.shadowBlur = 0;
    titleBottom = height - height * 0.02 - subSize * 1.5;
  }
  if (!cleanTitle) return;

  const size = fitTitleFont(ctx, cleanTitle, width * 0.92, height * 0.105);
  const grad = ctx.createLinearGradient(0, titleBottom - size, 0, titleBottom);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, grade.accent);
  grad.addColorStop(1, grade.sunRim);
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try {
    ctx.letterSpacing = `${Math.max(1, size * 0.02)}px`;
  } catch {
    /* letterSpacing is optional */
  }
  ctx.lineJoin = 'round';
  ctx.strokeStyle = grade.ink;
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeText(cleanTitle, width / 2, titleBottom);
  ctx.fillStyle = grad;
  ctx.fillText(cleanTitle, width / 2, titleBottom);
  try {
    ctx.letterSpacing = '0px';
  } catch {
    /* reset is optional */
  }
}

/** A round badge ribbon, top-right, with the app's own invented wording. */
export function drawBadge(ctx, width, height, grade) {
  const r = Math.min(width, height) * 0.075;
  const cx = width - r * 1.25;
  const cy = r * 1.25;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.2);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grade.ink + 'cc';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = grade.accent;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.stroke();
  ctx.fillStyle = grade.accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.34}px Anton, sans-serif`;
  ctx.fillText('NEON', 0, -r * 0.28);
  ctx.fillText('SHORE', 0, r * 0.08);
  ctx.font = `${r * 0.2}px Anton, sans-serif`;
  ctx.fillText('★ EST. 2026 ★', 0, r * 0.45);
  ctx.restore();
}

/**
 * Draws the whole cover onto `ctx` at `width` x `height`.
 * `state` is { store, layoutId, gradeId, title, subtitle, effects }.
 */
export function drawCover(ctx, width, height, state) {
  const grade = GRADES[state.gradeId] ?? GRADES.sunset;
  const layout = LAYOUTS[state.layoutId] ?? LAYOUTS['hero-grid'];
  const effects = state.effects ?? {};
  const panels = layoutPanels(state.layoutId, width, height);

  // Sky fallback: the whole cover is a sunset sky until photos arrive.
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(0.55, grade.skyMid);
  sky.addColorStop(1, grade.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const overlayLayout = OVERLAY_LAYOUTS.has(state.layoutId);
  panels.forEach((panel, i) => {
    // In rotated space the panel's own top-left is the origin; otherwise the
    // panel sits at its absolute position, so every draw below must use that
    // origin or the photo lands at the canvas corner, clipped out of view.
    const ox = panel.rot ? 0 : panel.x;
    const oy = panel.rot ? 0 : panel.y;
    ctx.save();
    ctx.beginPath();
    if (panel.rot) {
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate(panel.rot);
      ctx.rect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
    } else {
      ctx.rect(panel.x, panel.y, panel.w, panel.h);
    }
    ctx.clip();
    if (panel.rot) ctx.translate(-panel.w / 2, -panel.h / 2);
    const photo = state.store.photoForPanel(i);
    if (photo) {
      drawPhotoInPanel(ctx, photo, { x: ox, y: oy, w: panel.w, h: panel.h }, state.store.transformForPanel(i));
    } else if (i === 0) {
      // Empty hero panel keeps the sky so the cover never looks broken.
      const psky = ctx.createLinearGradient(ox, oy, ox, oy + panel.h);
      psky.addColorStop(0, grade.skyTop);
      psky.addColorStop(1, grade.skyBottom);
      ctx.fillStyle = psky;
      ctx.fillRect(ox, oy, panel.w, panel.h);
    } else {
      ctx.fillStyle = grade.ink + '66';
      ctx.fillRect(ox, oy, panel.w, panel.h);
    }
    // Sunset wash over every panel.
    const wash = ctx.createLinearGradient(ox, oy, ox, oy + panel.h);
    wash.addColorStop(0, grade.overlay[0]);
    wash.addColorStop(1, grade.overlay[1]);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(ox, oy, panel.w, panel.h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grade.tint;
    ctx.fillRect(ox, oy, panel.w, panel.h);
    if (!photo && i > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.85;
      ctx.font = `${Math.max(12, panel.h * 0.07)}px Anton, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD PHOTO', ox + panel.w / 2, oy + panel.h / 2);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Polaroid frame + drop shadow for the overlapping snapshots.
    if (overlayLayout && i > 0) {
      ctx.save();
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate(panel.rot);
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = width * 0.02;
      ctx.shadowOffsetY = height * 0.008;
      ctx.fillStyle = '#fdf6ec';
      ctx.fillRect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
      ctx.restore();
      // Re-draw the photo inside the frame (the frame above is the backing).
      ctx.save();
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate(panel.rot);
      const inset = Math.max(4, panel.w * 0.02);
      ctx.beginPath();
      ctx.rect(-panel.w / 2 + inset, -panel.h / 2 + inset, panel.w - inset * 2, panel.h - inset * 2);
      ctx.clip();
      const innerPhoto = state.store.photoForPanel(i);
      if (innerPhoto) {
        drawPhotoInPanel(ctx, innerPhoto, { x: -panel.w / 2 + inset, y: -panel.h / 2 + inset, w: panel.w - inset * 2, h: panel.h - inset * 2 }, state.store.transformForPanel(i));
        // Same sunset wash as the first pass, so the inset matches the other panels.
        const innerWash = ctx.createLinearGradient(0, -panel.h / 2 + inset, 0, panel.h / 2 - inset);
        innerWash.addColorStop(0, grade.overlay[0]);
        innerWash.addColorStop(1, grade.overlay[1]);
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = innerWash;
        ctx.fillRect(-panel.w / 2 + inset, -panel.h / 2 + inset, panel.w - inset * 2, panel.h - inset * 2);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = grade.tint;
        ctx.fillRect(-panel.w / 2 + inset, -panel.h / 2 + inset, panel.w - inset * 2, panel.h - inset * 2);
      } else {
        ctx.fillStyle = grade.ink + '66';
        ctx.fillRect(-panel.w / 2 + inset, -panel.h / 2 + inset, panel.w - inset * 2, panel.h - inset * 2);
      }
      ctx.restore();
    }
  });

  // Sun and palms live on the hero panel.
  if (effects.sun !== false) {
    const hero = panels.find((p) => p.hero) ?? panels[0];
    const sunR = Math.min(hero.w, hero.h) * 0.19;
    drawSun(ctx, hero.x + hero.w * 0.68, hero.y + hero.h * 0.2, sunR, grade);
    drawPalm(ctx, hero.x + hero.w * 0.04, hero.y + hero.h * 0.98, Math.min(hero.w, hero.h) * 0.36, grade.ink);
  }

  const bandH = height * layout.titleBand;
  drawTitleBlock(ctx, width, height, grade, state.title, state.subtitle, bandH);

  if (effects.badge) drawBadge(ctx, width, height, grade);

  if (effects.vignette !== false) {
    const vig = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.42,
      width / 2, height / 2, Math.max(width, height) * 0.75,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(10,0,20,0.38)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }

  if (effects.grain !== false) {
    const tile = grainTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
