// Neon Shore — wires the editor: photos in, layout and grade picked, caption
// typed, cover out as a PNG. Three steps from a photo to a PNG.
import { drawCover } from './cover.js';
import { GRADES, GRADE_IDS } from './grades.js';
import { LAYOUTS, LAYOUT_IDS, layoutPanels } from './layouts.js';
import { createPhotoStore, loadPhotoFile, loadImage } from './photos.js';
import { EXPORT_SIZES, exportCover, exportAllSizes, renderCoverBlob } from './export.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');
const store = createPhotoStore();

const state = {
  layoutId: 'hero-grid',
  gradeId: 'sunset',
  sizeId: 'square',
  title: 'Neon Shore',
  subtitle: 'a sunset heist in paradise',
  effects: { grain: true, vignette: true, sun: true, badge: true },
  selectedPanel: 0,
};

function setStatus(text) {
  statusEl.textContent = text;
}

/** The preview canvas follows the chosen post size's aspect (long side 900,
 * 1280 for a full-frame cover shot so the screenshot stays sharp). */
export function previewSize() {
  const size = EXPORT_SIZES[state.sizeId];
  const long = document.body.classList.contains('shot-cover') ? 1280 : 900;
  if (size.width >= size.height) return { w: long, h: Math.round((long * size.height) / size.width) };
  return { w: Math.round((long * size.width) / size.height), h: long };
}

function currentState() {
  return { store, layoutId: state.layoutId, gradeId: state.gradeId, title: state.title, subtitle: state.subtitle, effects: state.effects };
}

function redraw() {
  const { w, h } = previewSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas.getContext('2d'), w, h, currentState());
  updatePanelControls();
}

function panelCount() {
  const { w, h } = previewSize();
  return layoutPanels(state.layoutId, w, h).length;
}

/** Builds the layout picker buttons from the layout data. */
function buildLayoutPicker() {
  const box = $('layouts');
  LAYOUT_IDS.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.textContent = LAYOUTS[id].name;
    b.title = LAYOUTS[id].blurb;
    b.setAttribute('aria-pressed', String(id === state.layoutId));
    b.addEventListener('click', () => {
      state.layoutId = id;
      store.spreadAcross(panelCount());
      state.selectedPanel = 0;
      box.querySelectorAll('.pick').forEach((el) => el.setAttribute('aria-pressed', String(el === b)));
      redraw();
    });
    box.appendChild(b);
  });
}

/** Builds the grade swatch buttons from the grade data. */
function buildGradePicker() {
  const box = $('grades');
  GRADE_IDS.forEach((id) => {
    const g = GRADES[id];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = `linear-gradient(135deg, ${g.skyTop}, ${g.skyMid} 55%, ${g.skyBottom})`;
    b.textContent = g.name;
    b.setAttribute('aria-pressed', String(id === state.gradeId));
    b.addEventListener('click', () => {
      state.gradeId = id;
      box.querySelectorAll('.swatch').forEach((el) => el.setAttribute('aria-pressed', String(el === b)));
      redraw();
    });
    box.appendChild(b);
  });
}

/** Builds the post-size radio buttons. */
function buildSizePicker() {
  const box = $('sizes');
  Object.entries(EXPORT_SIZES).forEach(([id, size]) => {
    const label = document.createElement('label');
    label.className = 'size-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'size';
    input.checked = id === state.sizeId;
    input.addEventListener('change', () => {
      state.sizeId = id;
      $('export').textContent = `Export PNG ${size.width} x ${size.height}`;
      redraw();
    });
    label.append(input, document.createTextNode(size.label));
    box.appendChild(label);
  });
}

/** Builds the four photo slot inputs. */
function buildPhotoSlots() {
  const box = $('photos');
  for (let i = 0; i < 4; i++) {
    const label = document.createElement('label');
    label.className = 'photo-slot';
    const span = document.createElement('span');
    span.textContent = `Photo ${i + 1}`;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        store.setSlot(i, await loadPhotoFile(file));
        store.spreadAcross(panelCount());
        setStatus(`Photo ${i + 1} loaded — ${file.name}`);
        redraw();
      } catch (err) {
        setStatus(err.message);
        e.target.value = '';
      }
    });
    label.append(span, input);
    box.appendChild(label);
  }
}

/** Loads a bundled sample photo into a slot (free to use, made for make.fun). */
async function loadSample(slot, name) {
  const image = await loadImage(`samples/${name}.jpg`);
  store.setSlot(slot, image);
  return image;
}

$('sample-photos').addEventListener('click', async () => {
  try {
    await loadSample(0, 'pier');
    await loadSample(1, 'boulevard');
    store.spreadAcross(panelCount());
    setStatus('Sample photos loaded — try your own photos next.');
    redraw();
  } catch {
    setStatus('The sample photos could not be loaded.');
  }
});

$('fill-one').addEventListener('click', () => {
  if (!store.slots[0]) {
    setStatus('Load Photo 1 first, then fill every panel with it.');
    return;
  }
  store.fillAllWith(0, panelCount());
  setStatus('Every panel now shows Photo 1 — pick a panel to change it.');
  redraw();
});

$('spread-photos').addEventListener('click', () => {
  if (!store.loadedCount()) {
    setStatus('Load at least one photo first.');
    return;
  }
  store.spreadAcross(panelCount());
  setStatus('Photos spread across the panels.');
  redraw();
});

/** Panel controls: which photo fills the selected panel, its zoom and pan. */
function updatePanelControls() {
  const count = panelCount();
  const select = $('panel-photo');
  if (select.options.length !== 5) {
    select.innerHTML = '';
    const none = document.createElement('option');
    none.value = '';
    none.textContent = '— pick a panel in the preview —';
    select.appendChild(none);
    for (let i = 0; i < 4; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `Photo ${i + 1}${store.slots[i] ? '' : ' (empty)'}`;
      select.appendChild(opt);
    }
  }
  const idx = state.selectedPanel;
  if (idx < count) {
    select.value = String(store.assignments[idx] ?? 0);
    $('panel-label').textContent = `Panel ${idx + 1} of ${count}`;
  }
  const t = store.transformForPanel(state.selectedPanel);
  $('zoom').value = String(t.zoom);
  $('pan-x').value = String(t.dx);
  $('pan-y').value = String(t.dy);
}

$('panel-photo').addEventListener('change', (e) => {
  const slot = Number(e.target.value);
  if (Number.isNaN(slot)) return;
  store.assignments[state.selectedPanel] = slot;
  redraw();
});

function bindTransform(id, key) {
  $(id).addEventListener('input', (e) => {
    const t = store.transformForPanel(state.selectedPanel);
    store.transforms[state.selectedPanel] = { ...t, [key]: Number(e.target.value) };
    redraw();
  });
}
bindTransform('zoom', 'zoom');
bindTransform('pan-x', 'dx');
bindTransform('pan-y', 'dy');

/** Click a panel in the preview to select it for crop and photo. */
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const panels = layoutPanels(state.layoutId, canvas.width, canvas.height);
  const hit = panels.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
  if (hit >= 0) {
    state.selectedPanel = hit;
    setStatus(`Panel ${hit + 1} selected — change its photo, zoom or position.`);
    redraw();
  }
});

$('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
$('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});

['grain', 'vignette', 'sun', 'badge'].forEach((key) => {
  $(`fx-${key}`).addEventListener('change', (e) => {
    state.effects[key] = e.target.checked;
    redraw();
  });
});

$('export').addEventListener('click', async () => {
  try {
    const name = await exportCover(currentState(), state.sizeId);
    setStatus(`Saved ${name} — share it anywhere.`);
  } catch {
    setStatus('Export failed — try again.');
  }
});

$('export-all').addEventListener('click', async () => {
  try {
    const names = await exportAllSizes(currentState(), (name) => setStatus(`Saved ${name}…`));
    setStatus(`Saved all three: ${names.join(', ')}`);
  } catch {
    setStatus('Export failed — try again.');
  }
});

buildLayoutPicker();
buildGradePicker();
buildSizePicker();
buildPhotoSlots();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    store,
    loadSample,
    panelCount,
    redraw,
    setState(patch) {
      Object.assign(state, patch);
      if (patch.title !== undefined) $('title').value = patch.title;
      if (patch.subtitle !== undefined) $('subtitle').value = patch.subtitle;
      if (patch.sizeId) {
        const size = EXPORT_SIZES[patch.sizeId];
        $('export').textContent = `Export PNG ${size.width} x ${size.height}`;
      }
    },
  }).catch((err) => {
    setStatus(`Shot failed: ${err.message}`);
    window.__shotReady = true;
  });
} else {
  // Wait for the vendored fonts so the first paint already has the real lettering.
  Promise.all([
    document.fonts.load('16px Anton'),
    document.fonts.load('16px Pacifico'),
  ]).catch(() => {}).finally(() => redraw());
  redraw();
}

// Headless self-test: ?selftest=1 renders all three export sizes and reports
// their byte sizes in the page, so a script can verify exports without a click.
if (query.get('selftest') === '1') {
  (async () => {
    try {
      await loadSample(0, 'pier');
      await loadSample(1, 'boulevard');
      store.spreadAcross(panelCount());
      redraw();
      const results = {};
      for (const [id, size] of Object.entries(EXPORT_SIZES)) {
        const blob = await renderCoverBlob(currentState(), size.width, size.height);
        results[id] = { width: size.width, height: size.height, bytes: blob.size, type: blob.type };
      }
      const el = document.createElement('pre');
      el.id = 'selftest';
      el.textContent = JSON.stringify(results);
      document.body.appendChild(el);
      document.title = 'SELFTEST OK';
      window.__selftest = results;
    } catch (err) {
      document.title = `SELFTEST FAIL ${err.message}`;
      window.__selftestError = String(err);
    }
  })();
}
