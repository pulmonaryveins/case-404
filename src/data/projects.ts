export type ProjectCategory = "Development" | "UI/UX" | "Graphic Design" | "Video Editing";

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  tools: string[];
  /** Live link or case study. Omit until there is one. */
  link?: string;
  /** Clip played on the archive terminal when the disk is inserted. */
  video?: string;
  /** One line under the title on the record: what it is at a glance. */
  tagline?: string;
  /** Label/value rows at the top of the record (type, setting, subject...). */
  facts?: [string, string][];
  /**
   * The record's sections, each under its own heading: paragraphs (blank
   * line between) and/or a bulleted list. Without them the record shows
   * `description` under OVERVIEW.
   */
  sections?: { heading: string; text?: string; items?: string[] }[];
  /** Why it was made: shown under PURPOSE on the record. */
  purpose?: string;
  /** Screenshots (under public/), shown in a grid on the record. */
  screenshots?: { src: string; caption: string }[];
}

/**
 * Archive projects shown on the floppy-disk rack. Placeholder copy: replace
 * titles, descriptions, tools and links with the real work. The rack holds
 * four disks per column (TIERS in environment/diskRackLayout.ts): add more
 * and the extra ones have nowhere to stand.
 */
/** CC0 placeholder clip (MDN interactive-examples); swap per project for real work. */
const SAMPLE_REEL = "/videos/sample-reel.mp4";

export const projects: Project[] = [
  {
    id: "dev-1",
    title: "CASE 404",
    category: "Development",
    tagline: "An interactive 3D portfolio, told as an open case in a 1970s detective's office.",
    facts: [
      ["Type", "Interactive 3D portfolio"],
      ["Setting", "A detective's office, 1970s"],
      ["Subject", "Vince Bryant Cabunilas"],
      ["Status", "Open"],
    ],
    // Short form, for N.I.G.E.L.'s case file and anywhere a single line is wanted.
    description:
      "An interactive 3D portfolio told as an open case in a 1970s detective's office: the visitor follows the evidence board, the dossier and this archive terminal to find out who the subject is and what they have made.",
    sections: [
      {
        heading: "The case",
        text: "Case 404: subject not found. A file has landed on the detective's desk about someone nobody can quite place.\n\nThe visitor works it like a detective would. The evidence board shows what the subject does. The dossier on the desk reveals who they are, where they studied and where they have worked. This terminal holds the work itself, one disk per project.",
      },
      {
        heading: "The subject",
        text: "Vince Bryant Cabunilas: a UI/UX designer and frontend developer from Cebu, Philippines, now a software engineer at NTV360. The whole office is a portfolio of his work, and the way it is built is part of the evidence.",
      },
      {
        heading: "The detective",
        text: "The office belongs to an old detective, a German veteran of the Second World War. He came home in 1945, never quite stopped looking for answers, and has worked cases ever since. Thirty years of them are in this room.",
      },
      {
        heading: "His collection",
        items: [
          "An old musket on the wall above the evidence board",
          "A scale model of the battleship Bismarck on the shelf",
          "A gramophone on the file cabinet, still playing",
          "A Colt Python revolver and a box of .357 rounds on the desk",
          "A sheriff's star from a case abroad",
          "His fedora, his magnifying glass and an instant camera",
          "Some things that are not his: a little robot on this terminal and two blocky toy figures, which came in with the subject's file",
        ],
      },
      {
        heading: "How it works",
        items: [
          "Everything runs in real time in the browser, in 3D",
          "The camera follows the story as the visitor scrolls",
          "Papers, photos and screens are painted live on canvas",
          "The sound effects are synthesised as they play, and the music comes from the gramophone",
          "N.I.G.E.L., the records clerk on the red disk, answers questions about the subject through Google Gemini",
        ],
      },
    ],
    purpose:
      "To show the subject's work as a story instead of a list, so the portfolio is itself the evidence of what he can design and build.",
    tools: [
      "React",
      "TypeScript",
      "Three.js",
      "React Three Fiber",
      "Drei",
      "GSAP",
      "Lenis",
      "Zustand",
      "Vite",
      "Web Audio API",
      "Canvas 2D",
      "glTF-Transform",
      "Cloudflare Workers",
      "Google Gemini",
    ],
    screenshots: [
      { src: "/images/projects/development/case-404-1.webp", caption: "THE OFFICE" },
      { src: "/images/projects/development/case-404-2.webp", caption: "THE EVIDENCE BOARD" },
      { src: "/images/projects/development/case-404-3.webp", caption: "THE DOSSIER" },
      { src: "/images/projects/development/case-404-4.webp", caption: "THE ARCHIVE TERMINAL" },
      { src: "/images/projects/development/case-404-5.webp", caption: "N.I.G.E.L. ON THE CRT" },
      { src: "/images/projects/development/case-404-6.webp", caption: "THE DESIGN WALL" },
    ],
  },
  {
    id: "dev-2",
    title: "NTV360 Dev Portal",
    category: "Development",
    tagline:
      "NTV360's internal developer portal: one place for every team's docs, standards and tools.",
    facts: [
      ["Company", "NTV360 (N-Compass TV)"],
      ["Type", "Internal developer platform"],
      ["Teams", "7 engineering and design teams"],
      ["Built on", "Angular 21 with server-side rendering"],
    ],
    description:
      "NTV360's internal developer portal: documentation, project registries, coding standards and onboarding guides for all seven engineering and design teams, in one place, so everyone ships faster.",
    sections: [
      {
        heading: "From NTV360",
        text: "A company project of NTV360 (N-Compass TV). Only its public pages are shown here: the documentation inside the portal is private to the company.",
      },
      {
        heading: "What it is",
        text: "The NTV360 Dev Portal is where engineers and designers find what they need to do their work: how each team builds, which standards to follow, what projects exist and who owns them.\n\nIt replaces scattered notes and tribal knowledge with one signed-in portal that every team maintains for itself.",
      },
      {
        heading: "What's inside",
        items: [
          "Team documentation: tech stack, getting-started guides, folder structure and coding patterns for each team",
          "Code standards: the patterns to follow, common mistakes and the approved libraries",
          "Project registry: each project's status, stack and contacts",
          "Fast onboarding: new people go from zero to productive in hours, not days",
          "Cross-team visibility: see how every team works and who to ask",
          "Always up to date: each team revises its own docs every sprint",
        ],
      },
      {
        heading: "The seven teams",
        items: [
          "Frontend: Angular, Signals, Tailwind",
          "Backend: NestJS, MySQL, TypeORM",
          "Web Development: Astro, Next.js, edge functions",
          "Quality Assurance: Playwright, Selenium, pytest",
          "Research & Development: prototypes and experiments",
          "UI / UX: Figma, WCAG 2.1, design tokens",
          "Pi Player: Raspberry Pi and digital signage",
        ],
      },
      {
        heading: "How it is built",
        items: [
          "A single-page Angular 21 app, rendered on the server for fast first loads",
          "A Node and Express layer in front of the services (a backend for the frontend)",
          "Sign-in only: there is no self-registration, an administrator grants access",
          "Documents open in the page: PDF, Word and Markdown",
          "Search across every team's documentation",
        ],
      },
    ],
    purpose:
      "To give every NTV360 team one trusted place for how things are built, so new people get started faster and standards stay consistent.",
    tools: [
      "Angular 21",
      "TypeScript",
      "Angular SSR",
      "Node.js",
      "Express",
      "Tailwind CSS",
      "Supabase",
      "Strapi",
      "ApexCharts",
      "GSAP",
      "Lottie",
    ],
    screenshots: [
      { src: "/images/projects/development/ntv360-portal-1.webp", caption: "THE LANDING PAGE" },
      {
        src: "/images/projects/development/ntv360-portal-2.webp",
        caption: "THE SEVEN TEAMS",
      },
      { src: "/images/projects/development/ntv360-portal-3.webp", caption: "WHAT'S INSIDE" },
      {
        src: "/images/projects/development/ntv360-portal-4.webp",
        caption: "SIGN-IN, NO SELF-REGISTRATION",
      },
    ],
  },
  {
    id: "dev-3",
    title: "Component Pantry",
    category: "Development",
    tagline: "The showcase site for NTV360's Angular component library: live demos, code and docs.",
    facts: [
      ["Company", "NTV360 (N-Compass TV)"],
      ["Type", "Component library showcase"],
      ["Library", "44 Angular components"],
      ["Role", "Contributor: restructuring, UI changes and fixes"],
    ],
    description:
      "The documentation site for NTV360's Component Pantry, an Angular component library: every component with a live demo, its code and its properties, plus search, a changelog and a reference file for AI coding tools. The subject took the project on part-way and worked on its restructuring, UI changes and fixes.",
    link: "https://nctv-strapi.onrender.com",
    sections: [
      {
        heading: "From NTV360",
        text: "A company project of NTV360 (N-Compass TV), live on the web. The site and its Strapi backend live in two separate repositories.",
      },
      {
        heading: "His part",
        text: "He did not build it from scratch. He took the project over part-way through and worked on:",
        items: ["Restructuring the project", "UI changes", "Fixes"],
      },
      {
        heading: "What it is",
        text: "Component Pantry is NTV360's own Angular component library. This site is its shop window and manual: a developer can see every component working, copy its code and look up what it accepts, without opening the source.",
      },
      {
        heading: "What's inside",
        items: [
          "44 component pages, each with a live demo, a View code toggle and a Markdown download",
          "A properties table for every component, with a filter box for names, types and descriptions",
          "Overview pages: installation, notes, colours and a changelog of every release",
          "Search across the whole library, opened with the / key",
          "An AI Reference page: a downloadable file that teaches AI coding tools how to use the library, with setup steps for Claude Code, Cursor, Copilot and others",
          "A layout that works on phones",
        ],
      },
      {
        heading: "How it is built",
        items: [
          "An Angular app styled with Tailwind CSS",
          "Content comes from a separate Strapi CMS over a REST API, so pages can change without a new release",
          "The library's own components power the demos",
          "Hosted on Render",
        ],
      },
    ],
    purpose:
      "To make the component library easy to learn and adopt: every component can be tried, copied and looked up in one place, by people and by AI tools.",
    tools: [
      "Angular",
      "TypeScript",
      "Tailwind CSS",
      "Strapi",
      "REST API",
      "Component Pantry",
      "Render",
    ],
    screenshots: [
      {
        src: "/images/projects/development/pantry-1.webp",
        caption: "THE START PAGE: INSTALLATION",
      },
      { src: "/images/projects/development/pantry-2.webp", caption: "TABLE: LIVE DEMO" },
      { src: "/images/projects/development/pantry-3.webp", caption: "TABLE: CODE EXAMPLE" },
      { src: "/images/projects/development/pantry-4.webp", caption: "PROPERTIES AND API TABLE" },
      { src: "/images/projects/development/pantry-5.webp", caption: "CHARTS" },
      { src: "/images/projects/development/pantry-6.webp", caption: "KANBAN BOARD" },
      { src: "/images/projects/development/pantry-7.webp", caption: "SEARCH ACROSS THE LIBRARY" },
      { src: "/images/projects/development/pantry-8.webp", caption: "AI REFERENCE" },
    ],
  },
  {
    id: "dev-4",
    title: "OJT Tracker",
    category: "Development",
    tagline: "A time tracker for students on On-the-Job Training, on the web and on the phone.",
    facts: [
      ["Type", "Web app and mobile app"],
      ["Built by", "The subject, both apps"],
      ["For", "Students doing OJT"],
      ["Backend", "Supabase"],
    ],
    description:
      "A time tracker for students on On-the-Job Training, as a web app and a mobile app: time in and out with breaks, a log and journal for every session, progress towards the required hours, reports as PDF or CSV, and earnings for paid training.",
    link: "https://ojt-tracker-web.vercel.app",
    sections: [
      {
        heading: "The problem",
        text: "A student on On-the-Job Training has to complete a set number of hours and prove it with logs and reports. Hours kept in a notebook or a spreadsheet get forgotten, miscounted or lost.\n\nOJT Tracker keeps count for them: the hours, the breaks, the journal and the report, in one place, on whichever device they have to hand.",
      },
      {
        heading: "On the web",
        items: [
          "Set-up: required hours, start and end dates, school and workplace",
          "Time in and time out for each session, with breaks taken off",
          "A dashboard with total hours, progress, an OJT timeline and recent sessions",
          "Logs of every session, with CSV export and CSV import to bring in old records",
          "A journal and report images on each session",
          "Reports: daily hours, cumulative hours and average by weekday over any date range, as a PDF",
          "Earnings for paid training: an hourly rate, a currency and pay periods",
          "Sign-up, sign-in, password reset and a light and dark theme",
        ],
      },
      {
        heading: "On the phone",
        items: [
          "Time in and out, with a break timer",
          "A daily log, manual entry for a day missed, and a calendar of logs",
          "Reports as PDF or CSV",
          "Works offline and syncs when the connection returns",
          "Reminder notifications",
          "Light and dark themes with a choice of accent colours",
          "A motivation screen with cat pictures, for a long day",
        ],
      },
      {
        heading: "How it is built",
        items: [
          "Web: React and TypeScript on Vite, with Tailwind CSS, TanStack Query for data, Zustand for state and Framer Motion for movement, deployed on Vercel",
          "Phone: React Native with Expo and Expo Router, styled with NativeWind, built as an Android app",
          "One Supabase backend behind both, for accounts and data",
        ],
      },
    ],
    purpose:
      "To make logging OJT hours quick enough to do every day, so the record is complete and the final report takes minutes.",
    tools: [
      "React",
      "TypeScript",
      "Vite",
      "Tailwind CSS",
      "TanStack Query",
      "Zustand",
      "Framer Motion",
      "React Native",
      "Expo",
      "NativeWind",
      "Supabase",
      "jsPDF",
      "Vercel",
    ],
    screenshots: [
      { src: "/images/projects/development/ojt-1.webp", caption: "WEB APP: SIGN-IN" },
      { src: "/images/projects/development/ojt-2.webp", caption: "WEB APP: SIGN-UP" },
      {
        src: "/images/projects/development/ojt-3.webp",
        caption: "ANDROID APP: DOWNLOAD PAGE",
      },
    ],
  },
  {
    id: "ux-1",
    title: "Lamoy Ordering",
    category: "UI/UX",
    tagline: "Lamoy: a simple food ordering system, from the Alliance Jumpstart program.",
    facts: [
      ["Company", "Alliance Software Inc."],
      ["Program", "Jumpstart training, 2025"],
      ["Type", "Full-stack food ordering web app"],
      ["Role", "UI/UX design and frontend"],
    ],
    description:
      "Lamoy, a full-stack food ordering web app built by a team in the Alliance Jumpstart Training Program: browse the menu, fill a cart, check out and track the order, with an admin side for the menu and the orders. The subject was on the UI/UX and the frontend.",
    link: "https://github.com/CryoYohan/Lamoy-Simple-Food-Ordering-System",
    sections: [
      {
        heading: "From Alliance",
        text: "A team project from the Alliance Jumpstart Training Program, which the subject took at Alliance Software Inc. in 2025. The team built one product end to end: a frontend, a web API and a database.",
      },
      {
        heading: "His part",
        text: "He was on UI/UX and the frontend. In the project's history that is:",
        items: [
          "The look and flow of the interface, and rounds of UI refinements through the project",
          "The landing page, and the sign-in, sign-up and forgot-password pages",
          "The home page and the menu",
          "The cart, the orders list, order tracking and each order's details",
          "The admin pages: dashboard, menu management and orders",
          "Responsive layouts, so every page works on a phone as well as a desktop",
        ],
      },
      {
        heading: "What it is",
        text: "A web app for a small restaurant or cafe to take orders online. The menu is Filipino home cooking: pancit, Bicol express, adobo, kare-kare, lechon. A customer picks what they want, checks out, and follows the order until it arrives; the kitchen side manages the menu and the incoming orders.",
      },
      {
        heading: "What it does",
        items: [
          "Customers: browse the menu, add to the cart and change quantities, check out and submit an order",
          "Customers: track an order, look back at past orders, edit a profile and reset a forgotten password",
          "Admins: a dashboard, and creating, editing and viewing menu items",
          "Admins: viewing and managing every order",
          "Sign-in with accounts and tokens, so each person sees only their own orders",
          "Works on phones and desktops",
        ],
      },
      {
        heading: "How it is built",
        items: [
          "Frontend: React on Vite, styled with Tailwind CSS and DaisyUI, with React Router and Axios",
          "Backend: an ASP.NET Core Web API in C#, by teammates",
          "Database: serverless PostgreSQL on Neon",
          "The screenshots here are the real frontend running on sample dishes and orders",
        ],
      },
    ],
    purpose:
      "To give a small restaurant a simple way to take orders online, and to learn by doing how a team ships a full-stack product together.",
    tools: [
      "React",
      "Vite",
      "Tailwind CSS",
      "DaisyUI",
      "React Router",
      "Axios",
      "ASP.NET Core",
      "C#",
      "PostgreSQL",
      "Neon",
    ],
    screenshots: [
      { src: "/images/projects/ui-ux/lamoy-1.webp", caption: "LANDING PAGE" },
      { src: "/images/projects/ui-ux/lamoy-2.webp", caption: "THE MENU" },
      { src: "/images/projects/ui-ux/lamoy-3.webp", caption: "THE CART" },
      { src: "/images/projects/ui-ux/lamoy-4.webp", caption: "CHECKOUT" },
      { src: "/images/projects/ui-ux/lamoy-5.webp", caption: "TRACKING AN ORDER" },
      { src: "/images/projects/ui-ux/lamoy-6.webp", caption: "ADMIN DASHBOARD" },
      { src: "/images/projects/ui-ux/lamoy-7.webp", caption: "ADMIN: THE MENU" },
      { src: "/images/projects/ui-ux/lamoy-8.webp", caption: "ON A PHONE" },
    ],
  },
  {
    id: "ux-2",
    title: "UI/UX Project Two",
    category: "UI/UX",
    description: "Placeholder description of the second UI/UX project.",
    tools: ["Figma", "User research"],
  },
  {
    id: "ux-3",
    title: "UI/UX Project Three",
    category: "UI/UX",
    description: "Placeholder description of the third UI/UX project.",
    tools: ["Figma", "Design system"],
  },
  {
    id: "vid-1",
    title: "Video Project One",
    category: "Video Editing",
    description: "Placeholder description of the first video editing project.",
    tools: ["Premiere Pro", "After Effects"],
    video: SAMPLE_REEL,
  },
  {
    id: "vid-2",
    title: "Video Project Two",
    category: "Video Editing",
    description: "Placeholder description of the second video editing project.",
    tools: ["Premiere Pro", "After Effects"],
    video: SAMPLE_REEL,
  },
  {
    id: "vid-3",
    title: "Video Project Three",
    category: "Video Editing",
    description: "Placeholder description of the third video editing project.",
    tools: ["Premiere Pro", "After Effects"],
    video: SAMPLE_REEL,
  },
];

export const archiveProjects = projects.filter(
  (p) => p.category === "Development" || p.category === "UI/UX" || p.category === "Video Editing",
);
