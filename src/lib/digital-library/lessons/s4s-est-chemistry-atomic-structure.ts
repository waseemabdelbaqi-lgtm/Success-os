import type { LessonModuleContent } from "@/src/lib/digital-library/types";
import { S4S_ATOMIC_STRUCTURE_TEACHER_35M } from "@/src/lib/digital-library/teacher-explanations/s4s-atomic-structure-35m";

/**
 * EST II Chemistry — Atomic Structure Part 1
 * Teacher: Mr. Waseem Al-Labadi · Success 4 Sure Academy
 * https://www.success4sureacademy.com/waseem-al-labadi
 * Syllabus alignment: EST II Chemistry Atomic Structure (structure titles only).
 */
export const S4S_EST_CHEMISTRY_ATOMIC_STRUCTURE: LessonModuleContent = {
  slug: "s4s-est-chemistry-atomic-structure",
  title: "Atomic Structure Part 1",
  subtitle:
    "EST Chemistry · Success 4 Sure · Mr. Waseem Al-Labadi — protons, neutrons, electrons, Z, A, ions & isotopes",
  estimatedMinutes: 55,
  learningObjectives: [
    "Identify protons, neutrons, and electrons by charge, relative mass, and location.",
    "Use atomic number $Z$ and mass number $A$ to find neutron count: $n = A - Z$.",
    "Distinguish neutral atoms from ions using electron count and charge.",
    "Explain isotopes as same $Z$, different $A$ (different neutron counts).",
    "Solve EST-style particle-count questions under timed conditions.",
  ],
  knowledgeMarkdown: `
## Why atomic structure comes first

Every EST / AP / ACT chemistry pathway starts with **what the atom is made of**. Bonding, stoichiometry, periodicity, and redox all assume you can read a nuclide symbol and count particles without hesitation.

This module follows the **Atomic Structure Part 1** track taught by **Mr. Waseem Al-Labadi** at [Success 4 Sure Academy](https://www.success4sureacademy.com/waseem-al-labadi) — bilingual, exam-facing, and built for Jordan and Gulf students preparing for international exams.

### The three particles

| Particle | Symbol | Charge | Relative mass | Location |
|---|---|---|---|---|
| Proton | $\\mathrm{p}^+$ | $+1$ | $\\approx 1$ | Nucleus |
| Neutron | $\\mathrm{n}^0$ | $0$ | $\\approx 1$ | Nucleus |
| Electron | $\\mathrm{e}^-$ | $-1$ | $\\approx 1/1836$ | Outside nucleus |

**Identity rule:** the number of protons is the **atomic number** $Z$. Change $Z$ and you change the element.

**Neutrality rule:** in a neutral atom, $\\mathrm{e}^- = Z$.

### Mass number and neutrons

For a specific nuclide (isotope specimen):

$$
A = Z + n \\qquad \\Rightarrow \\qquad n = A - Z
$$

Nuclide notation: $^{A}_{Z}\\mathrm{X}$ or simply $^{A}\\mathrm{X}$ when $Z$ is known from the periodic table.

> **Exam trap**  
> Mass number $A$ is an integer for one isotope. The **average atomic mass** on the periodic table is a weighted decimal average of natural isotopes — do not treat them as the same quantity.

### Ions vs isotopes

- **Ion:** same $Z$, different electron count → nonzero charge.  
  $\\text{charge} = Z - (\\#\\,\\mathrm{e}^-)$
- **Isotope:** same $Z$, different neutron count → different $A$.
- **New element:** only if $Z$ changes.

### Worked mental model (sodium)

Neutral sodium-23: $Z=11$, $A=23$ → $11\\,\\mathrm{p}^+$, $12\\,\\mathrm{n}^0$, $11\\,\\mathrm{e}^-$.  
Sodium ion $\\mathrm{Na}^+$: still $11\\,\\mathrm{p}^+$ and $12\\,\\mathrm{n}^0$, but $10\\,\\mathrm{e}^-$.

### Bridge to the rest of EST Chemistry

Once particle counting is automatic, the next Success 4 Sure stations — bonding, stoichiometry, gases, acids/bases — become pattern recognition instead of memorization fog. Master Part 1 before racing ahead.
`,
  visualizer: {
    kind: "orbital",
    caption:
      "Interactive 3D orbital model: nucleus at the center, electron cloud outside. Drag to orbit, scroll to zoom — match what Mr. Waseem draws on the board.",
  },
  examples: [
    {
      difficulty: "Easy",
      title: "Neutrons in potassium-39",
      prompt:
        "Potassium has $Z = 19$. How many neutrons are in $^{39}\\mathrm{K}$?",
      steps: [
        "Identify $Z = 19$ (protons) and $A = 39$.",
        "Apply $n = A - Z = 39 - 19$.",
        "Neutrons = 20.",
      ],
      finalAnswer: "$20$ neutrons",
    },
    {
      difficulty: "Medium",
      title: "Electrons in oxide ion",
      prompt:
        "How many electrons are in $^{16}\\mathrm{O}^{2-}$? Oxygen has $Z = 8$.",
      steps: [
        "Neutral oxygen would have $8$ electrons.",
        "The $2-$ charge means two extra electrons.",
        "Electrons $= 8 + 2 = 10$. Protons remain $8$; neutrons $= 16 - 8 = 8$.",
      ],
      finalAnswer: "$10$ electrons ($8\\,\\mathrm{p}^+$, $8\\,\\mathrm{n}^0$)",
    },
    {
      difficulty: "Hard",
      title: "Compare three magnesium species",
      prompt:
        "For $^{24}\\mathrm{Mg}$, $^{24}\\mathrm{Mg}^{2+}$, and $^{25}\\mathrm{Mg}$, list $p^+$, $n^0$, $e^-$ and state which pairs are isotopes vs ions.",
      steps: [
        "$^{24}\\mathrm{Mg}$: $Z=12$, $A=24$ → $12\\,\\mathrm{p}^+$, $12\\,\\mathrm{n}^0$, $12\\,\\mathrm{e}^-$.",
        "$^{24}\\mathrm{Mg}^{2+}$: same nucleus counts, $e^- = 10$ (lost 2 electrons) → ion of the same nuclide.",
        "$^{25}\\mathrm{Mg}$: $12\\,\\mathrm{p}^+$, $13\\,\\mathrm{n}^0$, $12\\,\\mathrm{e}^-$ → isotope of $^{24}\\mathrm{Mg}$.",
        "Isotope pair: $^{24}\\mathrm{Mg}$ & $^{25}\\mathrm{Mg}$. Ion pair: $^{24}\\mathrm{Mg}$ & $^{24}\\mathrm{Mg}^{2+}$.",
      ],
      finalAnswer:
        "Isotopes: $^{24}\\mathrm{Mg}$/$^{25}\\mathrm{Mg}$. Ion: $^{24}\\mathrm{Mg}^{2+}$ ($10\\,\\mathrm{e}^-$).",
    },
  ],
  quiz: [
    {
      id: "q1",
      type: "mcq",
      prompt: "Which particle determines the identity of an element?",
      choices: ["Neutron", "Electron", "Proton", "Photon"],
      correctIndex: 2,
      hint: "Think atomic number $Z$.",
      explanation: "Atomic number $Z$ equals the proton count; that fixes the element.",
    },
    {
      id: "q2",
      type: "mcq",
      prompt: "Isotopes of the same element always have the same…",
      choices: [
        "Mass number",
        "Neutron number",
        "Atomic number",
        "Average atomic mass listed for one atom",
      ],
      correctIndex: 2,
      hint: "Same element ⇒ same $Z$.",
      explanation: "Isotopes share $Z$ but differ in neutron count (and therefore $A$).",
    },
    {
      id: "q3",
      type: "mcq",
      prompt: "A neutral atom has 15 electrons and $A = 31$. How many neutrons?",
      choices: ["15", "16", "31", "46"],
      correctIndex: 1,
      hint: "Neutral ⇒ $Z = e^-$; then $n = A - Z$.",
      explanation: "$Z = 15$, $n = 31 - 15 = 16$ (phosphorus-31).",
    },
    {
      id: "q4",
      type: "open",
      prompt:
        "In 3–5 sentences, explain the difference between an ion and an isotope, and give one numeric example of each for oxygen ($Z = 8$).",
      sampleAnswer:
        "An ion keeps the same proton count but changes electrons, so the charge changes — e.g. $\\mathrm{O}^{2-}$ has 8 protons and 10 electrons. An isotope keeps the same protons but changes neutrons, so mass number changes — e.g. $^{16}\\mathrm{O}$ vs $^{18}\\mathrm{O}$ (8 vs 10 neutrons). Only changing $Z$ would make a different element.",
      hint: "Contrast $\\Delta e^-$ vs $\\Delta n^0$.",
      explanation:
        "Strong answers separate charge changes (ions) from neutron/mass changes (isotopes) with correct oxygen counts.",
    },
  ],
  sources: [
    {
      label: "Success 4 Sure — Mr. Waseem Al-Labadi (teacher profile)",
      url: "https://www.success4sureacademy.com/waseem-al-labadi",
    },
    {
      label: "Success 4 Sure — EST II Chemistry (Atomic Structure track)",
      url: "https://www.success4sureacademy.com/course/chemistry/",
    },
    {
      label: "Success 4 Sure Academy — Teachers",
      url: "https://www.success4sureacademy.com/teachers/",
    },
  ],
  teacherExplanation: S4S_ATOMIC_STRUCTURE_TEACHER_35M,
};
