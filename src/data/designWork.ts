/**
 * Graphic design work pinned to the evidence wall above the archive terminal
 * (DesignPosters), as files in `public/images/design/`. The order here is
 * the order on the wall (and the sticky-note numbers): top row left to right,
 * then the middle row, then the bottom.
 *
 * The fields are what is written on the back of each print in pencil (flip
 * one over in its close-up). Only what the poster itself shows has been
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
