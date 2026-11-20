// Multi-panel layouts for Neon Shore. Every layout returns panels as fractions
// of the cover (x, y, w, h in 0..1, plus an optional rotation in radians), so
// the same layout works at 1080x1080, 1080x1350 and 1920x1080. `hero` marks
// the panel that carries the sun and the palm silhouette. `titleBand` is the
// fraction of the height the title block sits over at the foot of the cover.
function panels(list) {
  return list.map(([x, y, w, h, rot = 0, hero = false]) => ({ x, y, w, h, rot, hero }));
}

export const LAYOUTS = {
  'hero-grid': {
    name: 'Hero Grid',
    blurb: 'One big hero panel, three stacked beside it',
    titleBand: 0.24,
    panels: (g) => panels([
      [0, 0, 0.62 - g, 1, 0, true],
      [0.62, 0, 0.38, 0.34 - g, 0, false],
      [0.62, 0.34, 0.38, 0.33 - g, 0, false],
      [0.62, 0.67, 0.38, 0.33, 0, false],
    ]),
  },
  'nine-panel': {
    name: 'Nine Panel',
    blurb: 'The classic 3 x 3 poster grid',
    titleBand: 0.22,
    panels: (g) => {
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({
            x: c * (1 / 3) + (c === 0 ? 0 : g / 2),
            y: r * (1 / 3) + (r === 0 ? 0 : g / 2),
            w: 1 / 3 - (c === 2 ? 0 : g / 2) - (c === 0 ? 0 : g / 2),
            h: 1 / 3 - (r === 2 ? 0 : g / 2) - (r === 0 ? 0 : g / 2),
            rot: 0,
            hero: r === 0 && c === 1,
          });
        }
      }
      return out;
    },
  },
  'tilted-snaps': {
    name: 'Tilted Snaps',
    blurb: 'Overlapping snapshots, tilted like pinned photos',
    titleBand: 0.26,
    panels: (g) => panels([
      [0, 0, 1, 1, 0, true],
      [0.06, 0.06, 0.42, 0.42, -0.07, false],
      [0.52, 0.10, 0.42, 0.42, 0.06, false],
      [0.28, 0.44, 0.44, 0.34, -0.03, false],
    ]),
  },
  'strip': {
    name: 'Sunset Strip',
    blurb: 'Wide hero on top, three panels below',
    titleBand: 0.24,
    panels: (g) => panels([
      [0, 0, 1, 0.55 - g, 0, true],
      [0, 0.55, 0.33 - g, 0.45, 0, false],
      [0.33, 0.55, 0.34 - g, 0.45, 0, false],
      [0.67, 0.55, 0.33, 0.45, 0, false],
    ]),
  },
  'duo': {
    name: 'Duo Split',
    blurb: 'Two tall halves side by side',
    titleBand: 0.26,
    panels: (g) => panels([
      [0, 0, 0.5 - g, 1, 0, true],
      [0.5, 0, 0.5, 1, 0, false],
    ]),
  },
  'full-bleed': {
    name: 'Full Bleed',
    blurb: 'One photo edge to edge, two inset snapshots',
    titleBand: 0.28,
    panels: (g) => panels([
      [0, 0, 1, 1, 0, true],
      [0.05, 0.05, 0.26, 0.26, -0.05, false],
      [0.69, 0.05, 0.26, 0.26, 0.05, false],
    ]),
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

/** Panels for a layout in pixels, with a gutter of `g` (fraction of width). */
export function layoutPanels(layoutId, width, height) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS['hero-grid'];
  const g = 0.012;
  return layout.panels(g).map((p) => ({
    x: p.x * width,
    y: p.y * height,
    w: p.w * width,
    h: p.h * height,
    rot: p.rot,
    hero: p.hero,
  }));
}
