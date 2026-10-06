export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  year: string;
}

/** Placeholder demo content. */
export const certificates: Certificate[] = [
  { id: "cert-1", title: "Placeholder Certificate", issuer: "Placeholder Issuer", year: "20XX" },
];
