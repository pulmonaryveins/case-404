export interface ContactInfo {
  email: string;
  links: { label: string; url: string }[];
}

/** Placeholder demo content. */
export const contact: ContactInfo = {
  email: "placeholder@example.com",
  links: [],
};
