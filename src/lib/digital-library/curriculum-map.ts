import type { CurriculumNode } from "@/src/lib/digital-library/types";

/**
 * Global Digital Library taxonomic map.
 * Hierarchy: region → country → curriculumType → educationLevel → subject → chapter → lesson
 */
export const CURRICULUM_TREE: CurriculumNode[] = [
  {
    slug: "international-systems",
    name: "International Systems",
    children: [
      {
        slug: "global",
        name: "Global",
        children: [
          {
            slug: "ib",
            name: "IB Diploma",
            children: [
              {
                slug: "dp",
                name: "Diploma Programme",
                children: [
                  {
                    slug: "physics",
                    name: "Physics",
                    children: [
                      {
                        slug: "quantum-physics",
                        name: "Quantum Physics",
                        children: [
                          {
                            slug: "photoelectric-effect",
                            name: "The Photoelectric Effect",
                            lessonSlug: "ib-physics-photoelectric-effect",
                          },
                          {
                            slug: "wave-particle-duality",
                            name: "Wave–Particle Duality",
                            lessonSlug: "ib-physics-photoelectric-effect",
                          },
                        ],
                      },
                      {
                        slug: "mechanics",
                        name: "Mechanics",
                        children: [
                          {
                            slug: "newton-laws",
                            name: "Newton’s Laws",
                            lessonSlug: "ib-physics-photoelectric-effect",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    slug: "mathematics",
                    name: "Mathematics AA",
                    children: [
                      {
                        slug: "calculus",
                        name: "Calculus",
                        children: [
                          {
                            slug: "derivatives",
                            name: "Derivatives",
                            lessonSlug: "ib-physics-photoelectric-effect",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            slug: "cambridge",
            name: "Cambridge IGCSE / A-Levels",
            children: [
              {
                slug: "a-level",
                name: "A-Level",
                children: [
                  {
                    slug: "physics",
                    name: "Physics",
                    children: [
                      {
                        slug: "quantum",
                        name: "Quantum Phenomena",
                        children: [
                          {
                            slug: "photons",
                            name: "Photons & Energy Quanta",
                            lessonSlug: "ib-physics-photoelectric-effect",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            slug: "ap",
            name: "Advanced Placement",
            children: [
              {
                slug: "ap-physics-2",
                name: "AP Physics 2",
                children: [
                  {
                    slug: "modern-physics",
                    name: "Modern Physics",
                    children: [
                      {
                        slug: "photoelectric",
                        name: "Photoelectric Effect",
                        children: [
                          {
                            slug: "einstein-model",
                            name: "Einstein’s Photon Model",
                            lessonSlug: "ib-physics-photoelectric-effect",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "middle-east",
    name: "Middle East",
    children: [
      {
        slug: "jordan",
        name: "Jordan · الأردن",
        children: [
          {
            slug: "national",
            name: "المنهاج الوطني",
            children: [
              {
                slug: "elementary",
                name: "المرحلة الابتدائية (1–6)",
                children: [
                  {
                    slug: "overview",
                    name: "نظرة عامة",
                    children: [
                      {
                        slug: "stage",
                        name: "Stage Hub",
                        children: [
                          {
                            slug: "start",
                            name: "ابدأ البناء",
                            lessonSlug: "jordan-g1-math-number-line-addition",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                slug: "grade-1",
                name: "الصف الأول",
                children: [
                  {
                    slug: "الرياضيات",
                    name: "الرياضيات",
                    children: [
                      {
                        slug: "الجمع",
                        name: "الوحدة الأولى: الجمع",
                        children: [
                          {
                            slug: "الجمع-بخط-الأعداد",
                            name: "الجمع باستعمال خط الأعداد",
                            lessonSlug: "jordan-g1-math-number-line-addition",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    slug: "العلوم",
                    name: "العلوم",
                    children: [
                      {
                        slug: "الإنسان-والصحة",
                        name: "الإنسان والصحة",
                        children: [
                          {
                            slug: "نحن-متشابهون-ومختلفون",
                            name: "نحن متشابهون ومختلفون",
                            lessonSlug: "jordan-g1-science-alike-different",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                slug: "grade-2",
                name: "الصف الثاني",
                children: [
                  {
                    slug: "الرياضيات",
                    name: "الرياضيات",
                    children: [
                      {
                        slug: "القيمة-المكانية",
                        name: "القيمة المكانية",
                        children: [
                          {
                            slug: "العشرات-والآحاد",
                            name: "العشرات والآحاد",
                            lessonSlug: "jordan-g2-math-tens-ones",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              meGradeBranch("grade-3", "الصف الثالث", "اللغة-العربية", "القراءة-والفهم", "أفهم-ما-أقرأ"),
              meGradeBranch("grade-4", "الصف الرابع", "العلوم", "المادة-والطاقة", "حالات-المادة"),
              meGradeBranch("grade-5", "الصف الخامس", "الرياضيات", "الكسور", "مفهوم-الكسر"),
              meGradeBranch("grade-6", "الصف السادس", "العلوم", "النظم-البيئية", "السلسلة-الغذائية"),
              meGradeBranch("grade-10", "الصف العاشر", "الفيزياء", "الميكانيكا", "القوة-والحركة"),
              meGradeBranch("tawjihi", "توجيهي", "الرياضيات", "التفاضل", "المشتقات"),
            ],
          },
        ],
      },
      meCountry("saudi-arabia", "Saudi Arabia", "national", "secondary", "physics", "modern-physics", "photoelectric"),
      meCountry("egypt", "Egypt", "national", "thanaweya", "physics", "quantum", "photoelectric"),
      meCountry("uae", "UAE", "ministry", "cycle-3", "physics", "modern", "photons"),
      meCountry("qatar", "Qatar", "national", "secondary", "physics", "quantum", "einstein"),
    ],
  },
  {
    slug: "north-america",
    name: "North America",
    children: [
      {
        slug: "usa",
        name: "USA — State Standards",
        children: [
          {
            slug: "ngss",
            name: "NGSS",
            children: [
              {
                slug: "high-school",
                name: "High School",
                children: [
                  {
                    slug: "physics",
                    name: "Physics",
                    children: [
                      {
                        slug: "quantum",
                        name: "Quantum",
                        children: [
                          {
                            slug: "photoelectric-effect",
                            name: "Photoelectric Effect",
                            lessonSlug: "ib-physics-photoelectric-effect",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        slug: "canada",
        name: "Canada — Ontario",
        children: [
          {
            slug: "ontario",
            name: "Ontario Curriculum",
            children: [
              {
                slug: "grade-12",
                name: "Grade 12",
                children: [
                  {
                    slug: "physics",
                    name: "Physics",
                    children: [
                      {
                        slug: "modern",
                        name: "Modern Physics",
                        children: [
                          {
                            slug: "quanta",
                            name: "Energy Quanta",
                            lessonSlug: "ib-physics-photoelectric-effect",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "south-america",
    name: "South America",
    children: [
      meCountry("brazil", "Brazil", "enem", "ensino-medio", "fisica", "moderna", "efeito-fotoeletrico"),
      meCountry("argentina", "Argentina", "nacional", "secundario", "fisica", "cuantica", "fotones"),
    ],
  },
  {
    slug: "europe",
    name: "Europe",
    children: [
      meCountry("france", "France", "baccalaureat", "terminale", "physique", "quantique", "effet-photoelectrique"),
      meCountry("germany", "Germany", "abitur", "sekundarstufe-ii", "physik", "quanten", "photoeffekt"),
      meCountry("uk", "UK", "national", "a-level", "physics", "quantum", "photoelectric"),
    ],
  },
  {
    slug: "north-africa",
    name: "North Africa",
    children: [
      meCountry("tunisia", "Tunisia", "national", "bac", "physique", "moderne", "photoelectrique"),
      meCountry("algeria", "Algeria", "national", "lycee", "physique", "quantique", "photons"),
      meCountry("morocco", "Morocco", "national", "lycee", "physique", "moderne", "effet-photo"),
    ],
  },
  {
    slug: "east-asia",
    name: "East Asia",
    children: [
      meCountry("japan", "Japan", "mext", "upper-secondary", "physics", "quantum", "photoelectric"),
      meCountry("china", "China", "gaokao", "senior-high", "physics", "modern", "photoelectric"),
      meCountry("south-korea", "South Korea", "national", "high-school", "physics", "quantum", "photons"),
    ],
  },
  {
    slug: "rest-of-asia",
    name: "Rest of Asia",
    children: [
      meCountry("india", "India", "cbse", "class-12", "physics", "dual-nature", "photoelectric-effect"),
      meCountry("pakistan", "Pakistan", "national", "hssc", "physics", "modern", "photoelectric"),
    ],
  },
  {
    slug: "rest-of-africa",
    name: "Rest of Africa",
    children: [
      meCountry("nigeria", "Nigeria", "waec", "sss", "physics", "modern", "photoelectric"),
      meCountry("south-africa", "South Africa", "caps", "grade-12", "physics", "optical", "photoelectric"),
    ],
  },
  {
    slug: "oceania",
    name: "Oceania",
    children: [
      meCountry("australia", "Australia", "atar", "year-12", "physics", "quantum", "photoelectric"),
      meCountry("new-zealand", "New Zealand", "ncea", "level-3", "physics", "waves", "quanta"),
    ],
  },
];

function leafLesson(slug: string, name: string): CurriculumNode {
  return { slug, name, lessonSlug: "ib-physics-photoelectric-effect" };
}

function meGradeBranch(
  levelSlug: string,
  levelName: string,
  subject: string,
  chapter: string,
  lesson: string,
): CurriculumNode {
  return {
    slug: levelSlug,
    name: levelName,
    children: [
      {
        slug: subject,
        name: subject,
        children: [
          {
            slug: chapter,
            name: chapter,
            children: [leafLesson(lesson, lesson.replace(/-/g, " "))],
          },
        ],
      },
    ],
  };
}

function meCountry(
  slug: string,
  name: string,
  curriculum: string,
  level: string,
  subject: string,
  chapter: string,
  lesson: string,
): CurriculumNode {
  return {
    slug,
    name,
    children: [
      {
        slug: curriculum,
        name: curriculum.replace(/-/g, " "),
        children: [
          {
            slug: level,
            name: level,
            children: [
              {
                slug: subject,
                name: subject,
                children: [
                  {
                    slug: chapter,
                    name: chapter,
                    children: [leafLesson(lesson, lesson.replace(/-/g, " "))],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

export function findNodePath(slugs: string[]): CurriculumNode[] | null {
  let nodes = CURRICULUM_TREE;
  const path: CurriculumNode[] = [];
  for (const slug of slugs) {
    const next = nodes.find((n) => n.slug === slug);
    if (!next) return null;
    path.push(next);
    nodes = next.children || [];
  }
  return path;
}

export function listRegions() {
  return CURRICULUM_TREE.map((r) => ({ slug: r.slug, name: r.name }));
}

/** Build href for a full lesson path under /digital-library */
export function lessonHref(parts: string[]) {
  return `/digital-library/${parts.join("/")}`;
}

export function collectLessonLinks(max = 40) {
  const links: Array<{ href: string; label: string }> = [];

  function walk(node: CurriculumNode, trail: string[]) {
    const next = [...trail, node.slug];
    if (node.lessonSlug) {
      links.push({
        href: lessonHref(next),
        label: next.map((s) => s.replace(/-/g, " ")).join(" / "),
      });
      return;
    }
    for (const child of node.children || []) walk(child, next);
  }

  for (const region of CURRICULUM_TREE) walk(region, []);
  return links.slice(0, max);
}
