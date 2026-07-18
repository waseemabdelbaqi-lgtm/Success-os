export type PortalDefinition = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  audience: string;
  features: string[];
};

export const PORTALS: PortalDefinition[] = [
  {
    slug: "student",
    title: "Student",
    description: "A focused reading space for every book, summary, and lesson.",
    icon: "📚",
    audience: "Learners",
    features: ["Personal library", "Reading progress", "Notes & highlights"],
  },
  {
    slug: "teachers",
    title: "Teachers",
    description: "Curate official books and guide learners through trusted content.",
    icon: "👨‍🏫",
    audience: "Educators",
    features: ["Book collections", "Lesson references", "Curriculum discovery"],
  },
  {
    slug: "schools",
    title: "Schools",
    description: "Organize institution-wide access to curriculum-aligned books.",
    icon: "🏫",
    audience: "Institutions",
    features: ["School library", "Grade collections", "Reading insights"],
  },
  {
    slug: "universities",
    title: "Universities",
    description: "Elegant digital shelves for higher-education reading.",
    icon: "🎓",
    audience: "Higher education",
    features: ["Academic books", "Subject shelves", "Reference reading"],
  },
  {
    slug: "educational-centers",
    title: "Educational Centers",
    description: "Build modern digital collections for focused learning programs.",
    icon: "🏢",
    audience: "Learning centers",
    features: ["Program libraries", "Book discovery", "Student access"],
  },
  {
    slug: "employers",
    title: "Employers",
    description: "Discover knowledge collections for career-ready talent.",
    icon: "💼",
    audience: "Organizations",
    features: ["Professional reading", "Skill collections", "Talent discovery"],
  },
  {
    slug: "job-seekers",
    title: "Job Seekers",
    description: "Read practical books and summaries that accelerate careers.",
    icon: "🔎",
    audience: "Professionals",
    features: ["Career books", "Saved reading", "Personal notes"],
  },
  {
    slug: "join-us",
    title: "Join Us",
    description: "Help build the world’s most beautiful education book platform.",
    icon: "🌍",
    audience: "Partners",
    features: ["Content partners", "Institution access", "Global community"],
  },
];

export function getPortal(slug: string): PortalDefinition | null {
  return PORTALS.find((portal) => portal.slug === slug) ?? null;
}
