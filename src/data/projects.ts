export type ProjectCategory = "Development" | "UI/UX" | "Graphic Design" | "Video Editing";

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  tools: string[];
  /** Live link or case study. Omit until there is one. */
  link?: string;
  /** Several links, each with a short label (a page and its posts, say): listed under LINKS. */
  links?: { label: string; url: string }[];
  /** Clip played on the archive terminal when the disk is inserted. */
  video?: string;
  /** The clip has no sound track: no sound button, and the gramophone plays on. */
  silent?: boolean;
  /**
   * Several clips, shown as a gallery of posters grouped on the record: the
   * visitor picks one to play (nothing plays by itself). Each has a title, the
   * group it belongs to and a poster frame. Takes the place of `video`.
   */
  videos?: { src: string; title: string; group: string; poster: string; url?: string }[];
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
 * six disks per column (TIERS in environment/diskRackLayout.ts): add more
 * and the extra ones have nowhere to stand.
 */
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
    id: "dev-5",
    title: "Lamoy Ordering",
    category: "Development",
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
      { src: "/images/projects/development/lamoy-1.webp", caption: "LANDING PAGE" },
      { src: "/images/projects/development/lamoy-2.webp", caption: "THE MENU" },
      { src: "/images/projects/development/lamoy-3.webp", caption: "THE CART" },
      { src: "/images/projects/development/lamoy-4.webp", caption: "CHECKOUT" },
      { src: "/images/projects/development/lamoy-5.webp", caption: "TRACKING AN ORDER" },
      { src: "/images/projects/development/lamoy-6.webp", caption: "ADMIN DASHBOARD" },
      { src: "/images/projects/development/lamoy-7.webp", caption: "ADMIN: THE MENU" },
      { src: "/images/projects/development/lamoy-8.webp", caption: "ON A PHONE" },
    ],
  },
  {
    id: "dev-6",
    title: "Flyers Dashboard",
    category: "Development",
    tagline:
      "N-Compass TV's order monitoring platform for in-store flyers, from arrival to delivery.",
    facts: [
      ["Company", "NTV360 (N-Compass TV)"],
      ["Type", "Internal operations tool"],
      ["Role", "Full-stack developer, Angular and Node"],
      ["Team", "Several developers and designers"],
      ["Status", "In development"],
    ],
    description:
      "A web platform for N-Compass TV that follows every in-store flyer order from the moment it arrives to the moment it is delivered: who is working on it, how late it is and how the team is performing. The subject is a full-stack developer on it, and it is still being built: new features are added every sprint.",
    sections: [
      {
        heading: "From NTV360",
        text: "A production tool built for the N-Compass TV flyer team, designed in Figma first from a file of more than 90 screens. It is still in active development, so what is shown is work in progress and will change. The first screens are the running app on test data (sample and demonstration orders, stores and cards, with the users directory left out); the last five are from the design file, with retailer and people names hidden.",
      },
      {
        heading: "The problem",
        text: "N-Compass TV makes promotional flyers and posters for supermarket chains, with many stores and orders in play each week. Orders arrive from retail partner systems, designers build them and quality checkers review them before they go out.\n\nThere was no single place to answer simple questions: what came in this week and what is unfinished, which orders are overdue and who owns them, what the rules and assets are for each store, and how each designer and checker is performing.",
      },
      {
        heading: "What it does",
        items: [
          "Order dashboard: this week's orders, what is overdue, the pipeline from unassigned to completed, and a searchable list by priority, status, designer and days left",
          "Kanban board: orders as cards that move through the team's workflow, with new orders appearing without a refresh",
          "Store directory: every retailer's branches, production rules, logos, stickers, backgrounds and fonts",
          "People: a users directory with roles and a monthly calendar of who is working on what",
          "Reports: on-time rate, turnaround, rework, first-pass rate and per-designer performance",
          "Pre-week planning for upcoming flyers, and an image crop tool for poster artwork",
        ],
      },
      {
        heading: "His part",
        items: [
          "The Kanban cards: create, view, edit, labels, priorities, designers and checkers, comments, status history, rich-text descriptions with images, flyer links and delete",
          "The shared option picker and the Insert Link dialog used across the card modal",
          "The Store Directory features: modifying a store, store assets, production rules and store tags",
          "A redesign of the Users Directory table to match the Store Directory",
          "Deployment work: environment set-up for Auth0 and email, and the preview deploy pipeline",
          "The database migrations, row-level-security policies and API routes behind these features",
        ],
      },
      {
        heading: "How it is built",
        items: [
          "Angular with server-side rendering and signals, and the component library Component Pantry for a consistent look",
          "A Node and Express layer between the browser and the database, so the browser never sees keys or the database",
          "Supabase on PostgreSQL with row-level security, and Socket.IO so open boards update live",
          "Redis for caching, and Auth0 for sign-in",
          "Terraform and AWS, with automatic deploys to development, preview and production",
        ],
      },
      {
        heading: "What he learned",
        items: [
          "Designing for data you do not control: every screen needs a sensible empty and failure state",
          "Turning a design into code without drifting from it, and reusing a shared component instead of building a new one",
          "Real-time updates must never change the screen under someone's hand mid-drag",
          "The database is part of the product: security rules, reversible migrations and soft deletes protect other teams' reports",
        ],
      },
    ],
    purpose:
      "To give the production team one place to see every flyer order, who owns it and how late it is, so nothing is missed before it goes to the client.",
    tools: [
      "Angular",
      "TypeScript",
      "Tailwind CSS",
      "Node.js",
      "Express",
      "Supabase",
      "PostgreSQL",
      "Socket.IO",
      "Redis",
      "Auth0",
      "Terraform",
      "AWS",
      "Figma",
      "Component Pantry",
    ],
    screenshots: [
      {
        src: "/images/projects/development/flyers-6.webp",
        caption: "THE KANBAN BOARD (IN DEVELOPMENT)",
      },
      { src: "/images/projects/development/flyers-7.webp", caption: "AN ORDER CARD" },
      { src: "/images/projects/development/flyers-8.webp", caption: "THE STORE DIRECTORY" },
      { src: "/images/projects/development/flyers-9.webp", caption: "A STORE'S PROFILE" },
      { src: "/images/projects/development/flyers-10.webp", caption: "BRAND GUIDELINES" },
      { src: "/images/projects/development/flyers-11.webp", caption: "STORE ASSETS" },
      { src: "/images/projects/development/flyers-12.webp", caption: "POSTER HISTORY" },
      { src: "/images/projects/development/flyers-13.webp", caption: "THE PROFILE PAGE" },
      { src: "/images/projects/development/flyers-14.webp", caption: "MANAGING A USER" },
      {
        src: "/images/projects/development/flyers-1.webp",
        caption: "DESIGN FILE: THE ORDER DASHBOARD",
      },
      {
        src: "/images/projects/development/flyers-2.webp",
        caption: "DESIGN FILE: THE KANBAN BOARD",
      },
      {
        src: "/images/projects/development/flyers-3.webp",
        caption: "DESIGN FILE: THE STORE DIRECTORY",
      },
      { src: "/images/projects/development/flyers-4.webp", caption: "DESIGN FILE: REPORTS" },
      { src: "/images/projects/development/flyers-5.webp", caption: "DESIGN FILE: SIGN-IN" },
    ],
  },
  {
    id: "ux-1",
    title: "UI/UX Project One",
    category: "UI/UX",
    description: "Placeholder description of the first UI/UX project.",
    tools: ["Figma", "Prototyping"],
  },
  {
    id: "ux-2",
    title: "UI/UX Project Two",
    category: "UI/UX",
    description: "Placeholder description of the second UI/UX project.",
    tools: ["Figma", "User research"],
  },
  {
    id: "vid-1",
    title: "NCTV Work PH",
    category: "Video Editing",
    tagline: "Short videos for nctvwork.ph, NTV360's Facebook page for its interns.",
    facts: [
      ["Company", "NTV360 (N-Compass TV)"],
      ["Page", "nctvwork.ph on Facebook"],
      ["Role", "Video editor, with motion graphics"],
      ["Videos", "17 on file, playing above"],
    ],
    description:
      "nctvwork.ph, a Facebook page run under NTV360 that focuses on its interns. The team makes many kinds of content for it; the subject works mostly on the video editing, in Adobe Premiere Pro, with motion graphics in After Effects. 17 of its videos play on this disk: news first, then Meet the Team, Fast Talk, What you'll learn, intern exit interviews and the company story.",
    sections: [
      {
        heading: "The page",
        text: "nctvwork.ph is a Facebook page run under NTV360, focused on its interns. The team makes different kinds of content for it, and it is still running.",
      },
      {
        heading: "His part",
        text: "He works mostly on the video editing:",
        items: [
          "Editing the reels in Adobe Premiere Pro",
          "Motion graphics in Adobe After Effects",
          "Working with the rest of the team on the page's other content",
        ],
      },
      {
        heading: "The videos",
        text: "All of them are in the gallery under the player. Click one to play it and click the player to pause. Click the timeline under it to jump to any point, or use the left and right arrow keys to skip 5 seconds. The buttons under it turn the sound on and off and open it on Facebook.",
        items: [
          "News: NCTV News on the Batch 2027 internship, and how to apply",
          "Meet the Team: four episodes, from the company's first employees to the HR interns",
          "Fast Talk: quick-fire questions with the interns",
          "What you'll learn: a day in Graphics, HR and IT",
          "Intern exit interviews: interns looking back on their internship",
          "Company story: how N-Compass TV began",
        ],
      },
      {
        heading: "On Facebook",
        text: "The page and 16 of its reels, listed below.",
      },
    ],
    purpose: "To share the work and life of NTV360's interns in short, regular videos.",
    links: [
      { label: "Page", url: "https://www.facebook.com/profile.php?id=61579509335512" },
      { label: "Reel 01", url: "https://www.facebook.com/reel/1518087259985090" },
      { label: "Reel 02", url: "https://www.facebook.com/reel/1622589376145087" },
      { label: "Reel 03", url: "https://www.facebook.com/reel/1869615257736374" },
      { label: "Reel 04", url: "https://www.facebook.com/reel/1611889630396836" },
      { label: "Reel 05", url: "https://www.facebook.com/reel/1052919084230978" },
      { label: "Reel 06", url: "https://www.facebook.com/reel/1969562727082130" },
      { label: "Reel 07", url: "https://www.facebook.com/reel/1058227353328324" },
      { label: "Reel 08", url: "https://www.facebook.com/reel/998583966557079" },
      { label: "Reel 09", url: "https://www.facebook.com/reel/2910587549276730" },
      { label: "Reel 10", url: "https://www.facebook.com/reel/1064005306158783" },
      { label: "Reel 11", url: "https://www.facebook.com/reel/2051620328796149" },
      { label: "Reel 12", url: "https://www.facebook.com/reel/1272977314906840" },
      { label: "Reel 13", url: "https://www.facebook.com/reel/959507240129332" },
      { label: "Reel 14", url: "https://www.facebook.com/reel/2700486267033340" },
      { label: "Reel 15", url: "https://www.facebook.com/reel/1600466354961777" },
      { label: "Reel 16", url: "https://www.facebook.com/reel/1615828929650892" },
    ],
    tools: ["Adobe Premiere Pro", "Adobe After Effects"],
    videos: [
      {
        src: "/videos/nctvwork/01-news.mp4",
        poster: "/images/projects/video/nctvwork/01.webp",
        group: "News",
        title: "NCTV News: the Batch 2027 internship",
      },
      {
        src: "/videos/nctvwork/02-how-to-apply.mp4",
        poster: "/images/projects/video/nctvwork/02.webp",
        group: "News",
        title: "How to apply",
      },
      {
        src: "/videos/nctvwork/03-meet-the-team-day-ones.mp4",
        poster: "/images/projects/video/nctvwork/03.webp",
        group: "Meet the Team",
        title: "The day ones, the first episode",
      },
      {
        src: "/videos/nctvwork/04-meet-the-team-hr-interns.mp4",
        poster: "/images/projects/video/nctvwork/04.webp",
        group: "Meet the Team",
        title: "The HR interns",
      },
      {
        src: "/videos/nctvwork/05-meet-the-team-ep3.mp4",
        poster: "/images/projects/video/nctvwork/05.webp",
        group: "Meet the Team",
        title: "Episode 3",
      },
      {
        src: "/videos/nctvwork/06-meet-the-team-ep4.mp4",
        poster: "/images/projects/video/nctvwork/06.webp",
        group: "Meet the Team",
        title: "Episode 4: expectation and reality",
      },
      {
        src: "/videos/nctvwork/07-fast-talk-1.mp4",
        poster: "/images/projects/video/nctvwork/07.webp",
        group: "Fast Talk",
        title: "Fast Talk 1",
      },
      {
        src: "/videos/nctvwork/08-fast-talk-2.mp4",
        poster: "/images/projects/video/nctvwork/08.webp",
        group: "Fast Talk",
        title: "Fast Talk 2",
      },
      {
        src: "/videos/nctvwork/09-learn-graphics.mp4",
        poster: "/images/projects/video/nctvwork/09.webp",
        group: "What you'll learn",
        title: "Graphics",
      },
      {
        src: "/videos/nctvwork/10-learn-hr.mp4",
        poster: "/images/projects/video/nctvwork/10.webp",
        group: "What you'll learn",
        title: "HR",
      },
      {
        src: "/videos/nctvwork/11-learn-it.mp4",
        poster: "/images/projects/video/nctvwork/11.webp",
        group: "What you'll learn",
        title: "IT",
      },
      {
        src: "/videos/nctvwork/12-intern-exit-1.mp4",
        poster: "/images/projects/video/nctvwork/12.webp",
        group: "Intern exit interviews",
        title: "Interns look back, 1",
      },
      {
        src: "/videos/nctvwork/13-intern-exit-2.mp4",
        poster: "/images/projects/video/nctvwork/13.webp",
        group: "Intern exit interviews",
        title: "Interns look back, 2",
      },
      {
        src: "/videos/nctvwork/14-intern-exit-3.mp4",
        poster: "/images/projects/video/nctvwork/14.webp",
        group: "Intern exit interviews",
        title: "Interns look back, 3",
      },
      {
        src: "/videos/nctvwork/15-design-intern-exit-1.mp4",
        poster: "/images/projects/video/nctvwork/15.webp",
        group: "Intern exit interviews",
        title: "Design interns look back, 1",
      },
      {
        src: "/videos/nctvwork/16-design-intern-exit-2.mp4",
        poster: "/images/projects/video/nctvwork/16.webp",
        group: "Intern exit interviews",
        title: "Design interns look back, 2",
      },
      {
        src: "/videos/nctvwork/17-company-story.mp4",
        poster: "/images/projects/video/nctvwork/17.webp",
        group: "Company story",
        title: "How N-Compass TV began",
      },
    ],
  },
  {
    id: "vid-2",
    title: "Face of CCS",
    category: "Video Editing",
    tagline: "An animated title for The Face of CCS.",
    facts: [
      ["Type", "Motion graphics, title animation"],
      ["Length", "10 seconds"],
      ["Role", "Motion graphics"],
    ],
    description:
      "A ten-second animated title for The Face of CCS: a gold, sculpted emblem turning into view among moving clockwork gears.",
    sections: [
      {
        heading: "What it is",
        text: "A ten-second opening title for The Face of CCS. A gold, sculpted emblem of a face turns into view among moving clockwork gears, with the title set in gold beside it.",
      },
    ],
    tools: ["Adobe After Effects"],
    video: "/videos/face-of-ccs/face-of-ccs.mp4",
    silent: true,
  },
  {
    id: "vid-3",
    title: "OrgaFlow",
    category: "Video Editing",
    tagline:
      "An explainer video for OrgaFlow, an event planning and management system for student organizations.",
    facts: [
      ["Type", "Explainer video"],
      ["Length", "3 minutes 19 seconds"],
      ["For", "Hospitality student organizations, University of Cebu"],
      ["Role", "Video editing and motion graphics"],
    ],
    description:
      "An explainer video for OrgaFlow, an integrated event planning and management system for the hospitality management student organizations of the University of Cebu.",
    sections: [
      {
        heading: "What it is",
        text: "OrgaFlow is an integrated event planning and management system for the hospitality management student organizations of the University of Cebu.\n\nThe video walks through the problem, events run on confusing spreadsheets, then what OrgaFlow does from planning to attendee feedback once the event is done, and closes on what it means for student activities and co-curricular learning.",
      },
    ],
    tools: ["Adobe Premiere Pro", "Adobe After Effects"],
    video: "/videos/orgaflow/orgaflow-explainer.mp4",
  },
];

/** The clips a disk plays on the terminal, in order: its playlist, or its one clip. */
export function projectClips(project: Project | null | undefined) {
  if (!project) return [];
  if (project.videos?.length) return project.videos;
  return project.video ? [{ src: project.video, title: project.title, group: "", poster: "" }] : [];
}

export const archiveProjects = projects.filter(
  (p) => p.category === "Development" || p.category === "UI/UX" || p.category === "Video Editing",
);
