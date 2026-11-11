export interface ContactInfo {
  /** The main address: the one on the resume and behind "Initiate contact". */
  email: string;
  /** Every address, each with what it is for. */
  emails: { label: string; address: string }[];
  links: { label: string; url: string }[];
}

export const contact: ContactInfo = {
  email: "vincec@n-compass.online",
  emails: [
    { label: "Work", address: "vincec@n-compass.online" },
    { label: "Personal", address: "vincebryant42@gmail.com" },
  ],
  links: [
    {
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/vince-bryant-cabunilas-366704346/",
    },
    { label: "GitHub", url: "https://github.com/pulmonaryveins" },
  ],
};
