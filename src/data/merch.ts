/**
 * Merch shown in the file cabinet: one drawer per kind, each with a label on
 * its front. PLACEHOLDER CONTENT: every item here is a test piece to show the
 * layout; replace `name`, `colour` and `text` with the real designs (and add
 * `image` paths once there are photos or artwork to print on them).
 */
export type MerchKind = "pin" | "sticker" | "patch" | "keychain";

export interface MerchItem {
  id: string;
  name: string;
  kind: MerchKind;
  /** Main colour of the piece. */
  colour: string;
  /** Short text printed on the piece (placeholder art). */
  text: string;
}

export interface MerchDrawer {
  id: string;
  /** On the drawer's front label. */
  label: string;
  items: MerchItem[];
}

export const merchDrawers: MerchDrawer[] = [
  {
    id: "pins",
    label: "PINS",
    items: [
      { id: "pin-1", name: "Test Pin 01", kind: "pin", colour: "#8a2c2c", text: "404" },
      { id: "pin-2", name: "Test Pin 02", kind: "pin", colour: "#1f4a72", text: "UX" },
      { id: "pin-3", name: "Test Pin 03", kind: "pin", colour: "#d9a860", text: "★" },
      { id: "pin-4", name: "Test Pin 04", kind: "pin", colour: "#2f6b4a", text: "DEV" },
      { id: "pin-5", name: "Test Pin 05", kind: "pin", colour: "#5a2a72", text: "VID" },
      { id: "pin-6", name: "Test Pin 06", kind: "pin", colour: "#e8e1d3", text: "?" },
    ],
  },
  {
    id: "stickers",
    label: "STICKERS",
    items: [
      {
        id: "sticker-1",
        name: "Test Sticker 01",
        kind: "sticker",
        colour: "#d9a860",
        text: "CASE 404",
      },
      {
        id: "sticker-2",
        name: "Test Sticker 02",
        kind: "sticker",
        colour: "#8a2c2c",
        text: "CLASSIFIED",
      },
      {
        id: "sticker-3",
        name: "Test Sticker 03",
        kind: "sticker",
        colour: "#4fae7a",
        text: "A:\\>_",
      },
      {
        id: "sticker-4",
        name: "Test Sticker 04",
        kind: "sticker",
        colour: "#e8e1d3",
        text: "EVIDENCE",
      },
      {
        id: "sticker-5",
        name: "Test Sticker 05",
        kind: "sticker",
        colour: "#1f4a72",
        text: "DESIGN",
      },
    ],
  },
  {
    id: "patches",
    label: "PATCHES",
    items: [
      { id: "patch-1", name: "Test Patch 01", kind: "patch", colour: "#2a211b", text: "DETECTIVE" },
      { id: "patch-2", name: "Test Patch 02", kind: "patch", colour: "#1f4a72", text: "FILE 404" },
      { id: "patch-3", name: "Test Patch 03", kind: "patch", colour: "#8a2c2c", text: "SOLVED" },
      { id: "patch-4", name: "Test Patch 04", kind: "patch", colour: "#2f6b4a", text: "ARCHIVE" },
    ],
  },
  {
    id: "misc",
    label: "MISC",
    items: [
      { id: "misc-1", name: "Test Keychain 01", kind: "keychain", colour: "#d9a860", text: "KEY" },
      { id: "misc-2", name: "Test Keychain 02", kind: "keychain", colour: "#8a2c2c", text: "404" },
      {
        id: "misc-3",
        name: "Test Sticker 06",
        kind: "sticker",
        colour: "#e8e1d3",
        text: "TOP SECRET",
      },
      { id: "misc-4", name: "Test Pin 07", kind: "pin", colour: "#4fae7a", text: "OK" },
    ],
  },
];

/**
 * Shorthand for the placeholder pieces of the second cabinet: `kind` and
 * the colours and texts to cycle through. Replace with real merch like the
 * rest.
 */
function pieces(
  prefix: string,
  kind: MerchKind,
  specs: [colour: string, text: string][],
): MerchItem[] {
  return specs.map(([colour, text], i) => ({
    id: `${prefix}-${i + 1}`,
    name: `Test ${prefix} ${String(i + 1).padStart(2, "0")}`,
    kind,
    colour,
    text,
  }));
}

/**
 * The second cabinet, next to the first on the same wall: four more drawers,
 * each with its own label. PLACEHOLDER CONTENT.
 */
export const merchDrawersB: MerchDrawer[] = [
  {
    id: "prints",
    label: "PRINTS",
    items: pieces("print", "sticker", [
      ["#e8e1d3", "POSTER"],
      ["#8a2c2c", "ZINE"],
      ["#1f4a72", "ART"],
      ["#d9a860", "SKETCH"],
      ["#4fae7a", "PHOTO"],
    ]),
  },
  {
    id: "cards",
    label: "CARDS",
    items: pieces("card", "sticker", [
      ["#d9a860", "CASE 404"],
      ["#e8e1d3", "FILE"],
      ["#8a2c2c", "ALIBI"],
      ["#1f4a72", "CLUE"],
    ]),
  },
  {
    id: "totes",
    label: "TOTES",
    items: pieces("tote", "patch", [
      ["#2a211b", "CARRY"],
      ["#1f4a72", "BAG"],
      ["#8a2c2c", "TOTE"],
      ["#2f6b4a", "EVIDENCE"],
    ]),
  },
  {
    id: "extras",
    label: "EXTRAS",
    items: pieces("extra", "keychain", [
      ["#d9a860", "KEY"],
      ["#8a2c2c", "LOCK"],
      ["#4fae7a", "TAG"],
    ]),
  },
];
