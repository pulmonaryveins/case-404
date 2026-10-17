export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  year: string;
  /** The scanned certificate (public/images/certificates), shown in its frame on the shelf. */
  image: string;
}

/**
 * The certificates on file, newest first. They hang as the framed
 * achievements on the shelf above the archive terminal (AchievementShelf):
 * the first two on the left, the third on the right.
 */
export const certificates: Certificate[] = [
  {
    id: "alliance-merit",
    title: "Certificate of Merit · Alliance Jumpstart Training Program",
    issuer: "Alliance Software Inc.",
    year: "2025",
    image: "/images/certificates/2.webp",
  },
  {
    id: "alliance-completion",
    title: "Certificate of Completion · Alliance Jumpstart Training Program",
    issuer: "Alliance Software Inc.",
    year: "2025",
    image: "/images/certificates/3.webp",
  },
  {
    id: "ccna-srwe",
    title: "CCNA: Switching, Routing, and Wireless Essentials",
    issuer: "Cisco Networking Academy",
    year: "2024",
    image: "/images/certificates/1.webp",
  },
];
