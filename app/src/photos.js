// Photo slots for Neon Shore: up to four photos held in memory, never
// uploaded anywhere. A slot holds an HTMLImageElement or null. Loading
// validates the file first so a non-image or an absurd file fails with a
// message instead of breaking the preview.
export const MAX_PHOTO_BYTES = 50 * 1024 * 1024;
export const SLOT_COUNT = 4;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not read that image'));
    img.src = url;
  });
}

/** Loads a user file into a slot. Returns the image, or throws a plain message. */
export async function loadPhotoFile(file) {
  if (!file) throw new Error('no file chosen');
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" is not an image file`);
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error(`"${file.name}" is over 50 MB`);
  }
  const url = URL.createObjectURL(file);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** A photo store: four slots plus one transform per panel. */
export function createPhotoStore() {
  return {
    slots: [null, null, null, null],
    /** panelAssignments[i] is the slot index filling panel i. */
    assignments: [],
    /** transforms[i] is { zoom, dx, dy } for panel i (dx/dy in -0.5..0.5). */
    transforms: [],
    setSlot(index, image) {
      this.slots[index] = image;
    },
    photoForPanel(panelIndex) {
      const slot = this.assignments[panelIndex] ?? 0;
      return this.slots[slot] ?? null;
    },
    transformForPanel(panelIndex) {
      return this.transforms[panelIndex] ?? { zoom: 1, dx: 0, dy: 0 };
    },
    /** Fill every panel with the same slot (the one-photo fast path). */
    fillAllWith(slot, panelCount) {
      this.assignments = Array.from({ length: panelCount }, () => slot);
    },
    /** Spread the loaded slots across the panels, round-robin. */
    spreadAcross(panelCount) {
      const loaded = this.slots.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
      if (!loaded.length) {
        this.assignments = Array.from({ length: panelCount }, () => 0);
        return;
      }
      this.assignments = Array.from(
        { length: panelCount },
        (_, i) => loaded[i % loaded.length],
      );
    },
    loadedCount() {
      return this.slots.filter(Boolean).length;
    },
  };
}
