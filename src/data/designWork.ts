/**
 * Graphic design work pinned to the evidence wall above the archive terminal
 * (DesignPosters), as files in `public/images/design/`. The order here is
 * the order on the wall (see LAYOUT there): roughly top to bottom, left to
 * right, with the Bay Harbor Butcher board (9.webp) as the hub in the middle.
 *
 * The fields are notes on each piece (N.I.G.E.L. answers from them, see
 * nigelFile.ts). Only what the poster itself shows has been
 * filled in: titles, and a client or date where it is printed on the poster.
 * Fill in the rest (and check these). Any field left out is simply not
 * written.
 */
export interface DesignPiece {
  file: string;
  title: string;
  /** Who it was made for. */
  client?: string;
  /** When it ran. */
  when?: string;
  /** Tools it was made with. */
  tools?: string;
  /** A line or two about the piece. */
  note?: string;
}

export const designWork: DesignPiece[] = [
  // Top row
  {
    file: "1.webp",
    title: "CCS Department Store",
    client: "CCS",
    note: "A set of four booth posters: gadgets, gummies and merchandise.",
  },
  {
    file: "2.webp",
    title: "Face of UC",
    client: "University of Cebu",
    note: "Candidate cards, four to a set.",
  },
  {
    file: "3.webp",
    title: "PSITS Recruitment",
    client: "PSITS",
    note: "Recruitment call: requirements, and volunteer and media qualifications.",
  },
  {
    file: "5.webp",
    title: "All Souls' Day",
    client: "PSITS · UC Main",
    note: "Candlelit memorial post.",
  },
  // Middle row
  {
    file: "7.webp",
    title: "Extravaganza",
    client: "University of Cebu Main",
    when: "August 22, 2023",
    note: "Event key visual.",
  },
  {
    file: "8.webp",
    title: "Layo pa, pero layo na",
    client: "UC",
    note: "#MondayMotivation post. Laban, UCians!",
  },
  {
    file: "9.webp",
    title: "Bay Harbor Butcher",
    note: "Crime-board poster: photos, files and red string.",
  },
  {
    file: "11.webp",
    title: "Happy Father's Day",
    client: "PSITS · UC Main",
  },
  {
    file: "12.webp",
    title: "Good Friday",
    client: "PSITS · UC Main",
    when: "April 18, 2025",
  },
  // Bottom row
  {
    file: "13.webp",
    title: "CEL S3 Finale Cosplay Registration",
    client: "CESAFI Esports League",
    when: "April 26–27, 2025",
    note: "Registration poster for the cosplay skit, with QR code.",
  },
  {
    file: "14.webp",
    title: "Christmas season post",
    note: "Holiday post with a crystal ball.",
  },
  {
    file: "15.webp",
    title: "Hulagway sa Kamatouran",
    note: "Film poster.",
  },
  {
    file: "21.webp",
    title: "Christmas Day",
    client: "PSITS · UC Main",
    note: "A Christmas wishlist, with a cat in a Santa hat.",
  },
];

export const designWorkUrl = (file: string) => `/images/design/${file}`;

/**
 * Apparel and merch designs: shown on the website's design archive after the
 * prints, and left off the 3D poster wall (which has a fixed set of slots).
 * Mock-ups, front and back.
 */
export const merchWork: DesignPiece[] = [
  {
    file: "merch-1.webp",
    title: "Computer Studies shirt",
    note: "Mustard T-shirt, front and back: the Computer Studies print.",
  },
  {
    file: "merch-2.webp",
    title: "Computer Studies shirt, second design",
    note: "Mustard T-shirt, front and back: a pocket mark and a boxed back print.",
  },
  {
    file: "merch-3.webp",
    title: "The Paradox shirt",
    note: "Black T-shirt, front and back, for the College of Computer Studies.",
  },
  {
    file: "merch-4.webp",
    title: "Webmasters shirt",
    note: "Black T-shirt, front and back, for the University of Cebu Webmasters.",
  },
  {
    file: "merch-5.webp",
    title: "PSITS President jersey",
    client: "PSITS · UC Main",
    note: "Jersey, front and back.",
  },
  {
    file: "merch-6.webp",
    title: "CCS Intern jersey",
    client: "College of Computer Studies · UC Main",
    note: "Jersey, front and back.",
  },
];
