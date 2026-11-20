// Fixed scenes for screenshots: ?shot=editor shows the editor with sample
// photos loaded; ?shot=cover shows a cover the app itself drew, full frame,
// at the post size the query names. `photo` picks the first sample
// (samples/<photo>.jpg), `photo2` the second, `caption` the title,
// `subtitle` the script line, `layout` and `grade` the look, `size` one of
// square, portrait or wide. window.__shotReady is set once painted.
export async function runShot(shot, query, api) {
  const layout = query.get('layout') ?? 'hero-grid';
  const grade = query.get('grade') ?? 'sunset';
  const size = query.get('size') ?? 'square';
  const title = query.get('caption') ?? 'Neon Shore';
  const subtitle = query.get('subtitle') ?? 'a sunset heist in paradise';
  const photo = query.get('photo') ?? 'pier';
  const photo2 = query.get('photo2') ?? 'boulevard';

  if (shot === 'cover') document.body.classList.add('shot-cover');
  await api.loadSample(0, photo);
  await api.loadSample(1, photo2);
  api.setState({ layoutId: layout, gradeId: grade, sizeId: size, title, subtitle });
  api.store.spreadAcross(api.panelCount());
  api.redraw();

  try {
    await document.fonts.ready;
  } catch {
    /* fonts are best-effort here; the fallback still draws */
  }
  api.redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
