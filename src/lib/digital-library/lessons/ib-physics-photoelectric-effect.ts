import type { LessonModuleContent } from "@/src/lib/digital-library/types";

/**
 * IB Physics — Quantum Physics — Photoelectric Effect
 * Curriculum parameters aligned with OpenStax College Physics Ch. 29
 * (CC BY) and typical IB DP Physics quantum / photoelectric outcomes.
 */
export const IB_PHYSICS_PHOTOELECTRIC: LessonModuleContent = {
  slug: "ib-physics-photoelectric-effect",
  title: "The Photoelectric Effect",
  subtitle: "IB Physics · Quantum Physics · Photons, work function & Einstein’s model",
  estimatedMinutes: 55,
  learningObjectives: [
    "Explain why classical wave theory fails for the photoelectric effect.",
    "Apply $E = hf$ and $\\mathrm{KE}_{\\max} = hf - \\phi$ with SI and eV units.",
    "Interpret threshold frequency $f_0$ and stopping potential experimentally.",
    "Connect photon intensity to photoelectron rate (current), not to KE.",
  ],
  knowledgeMarkdown: `
## Why this experiment forced a quantum description

When electromagnetic radiation strikes a metal surface in vacuum, electrons can be ejected. This **photoelectric effect** is the foundation of light meters and solar cells, but its detailed behaviour cannot be explained if light is only a continuous classical wave.

OpenStax *College Physics* (Ch. 29) frames the experimental setup as an evacuated tube with a metal plate and a collector electrode under a variable retarding voltage. Light ejects electrons from the plate; those with enough kinetic energy reach the collector and register as current. The retarding voltage that just stops the most energetic electrons equals their maximum kinetic energy in electron-volts.

### Classical expectations that fail

If light were only a continuous wave transferring energy gradually:

1. **Any frequency** should eventually eject electrons if intensity and exposure time are large enough.
2. There should be a **time delay** while energy accumulates on the surface.
3. Higher intensity should increase **both** the number of electrons **and** their kinetic energies.

None of these match observation.

### Einstein’s photon hypothesis (1905)

Einstein proposed that electromagnetic radiation itself is quantized into packets called **photons**. A photon of frequency $f$ carries energy

$$
E = hf
$$

where Planck’s constant is

$$
h = 6.626 \\times 10^{-34}\\,\\mathrm{J\\cdot s}
= 4.136 \\times 10^{-15}\\,\\mathrm{eV\\cdot s}.
$$

Useful wavelength form (with $c = f\\lambda$):

$$
E = \\frac{hc}{\\lambda}.
$$

A single photon interacts with a single electron. Part of the photon energy frees the electron from the metal (the **work function** $\\phi$, also written BE). The remainder becomes kinetic energy:

$$
\\mathrm{KE}_{\\max} = hf - \\phi.
$$

The **threshold frequency** satisfies $\\phi = hf_0$, so

$$
f_0 = \\frac{\\phi}{h}, \\qquad
\\mathrm{KE}_{\\max} = h(f - f_0).
$$

If $f < f_0$, no electrons are ejected **regardless of intensity**.

### Five photoelectric laws (exam checklist)

| Observation | Photon explanation |
|---|---|
| Threshold frequency exists | Photons below $hf_0$ cannot supply $\\phi$ |
| Instantaneous emission | One photon → one electron; no slow accumulation |
| Rate ∝ intensity | Intensity = photon flux; more photons → more electrons |
| $\\mathrm{KE}_{\\max}$ independent of intensity | Extra intensity means more electrons, not more energy per electron |
| $\\mathrm{KE}_{\\max}$ rises linearly with $f$ | Slope of $\\mathrm{KE}$ vs $f$ is $h$ |

### Stopping potential

If the collector is held at a retarding potential $V_s$ that just stops the fastest electrons,

$$
eV_s = \\mathrm{KE}_{\\max} = hf - \\phi.
$$

A graph of $V_s$ against $f$ is a straight line with slope $h/e$ and intercept $f_0$.

### Worked constants students should memorize

- $1\\,\\mathrm{eV} = 1.602 \\times 10^{-19}\\,\\mathrm{J}$
- $hc \\approx 1240\\,\\mathrm{eV\\cdot nm}$ (handy for $\\lambda$ in nm)
- Typical metal work functions: ~2–5 eV (e.g. calcium $\\phi \\approx 2.71\\,\\mathrm{eV}$ in OpenStax Example)

### Bridge to the IB syllabus

In IB DP Physics, the photoelectric effect is the canonical evidence that light has particle-like energy quanta, while diffraction/interference remain wave evidence. Together they establish **wave–particle duality**. The correspondence principle reminds us that for large quantum numbers / macroscopic scales, quantum predictions approach classical physics — but the photoelectric thresholds are an unmistakably quantum signature.

> **Core theorem callout**  
> Photons transfer energy in discrete lumps $hf$. Intensity changes the *number* of lumps per second, not the energy of each lump.
`,
  visualizer: {
    kind: "photoelectric",
    caption:
      "Interactive 3D model: photons strike a metal lattice; electrons eject when $hf > \\phi$. Drag to orbit, pinch/scroll to zoom.",
  },
  examples: [
    {
      difficulty: "Easy",
      title: "Photon energy of violet light",
      prompt:
        "A photon has wavelength $\\lambda = 420\\,\\mathrm{nm}$. Find its energy in joules and in eV. (Use $h = 6.63\\times10^{-34}\\,\\mathrm{J\\cdot s}$, $c = 3.00\\times10^{8}\\,\\mathrm{m\\,s^{-1}}$.)",
      steps: [
        "Convert wavelength: $\\lambda = 420\\times10^{-9}\\,\\mathrm{m}$.",
        "Use $E = hc/\\lambda$.",
        "$E = (6.63\\times10^{-34})(3.00\\times10^{8})/(420\\times10^{-9}) = 4.74\\times10^{-19}\\,\\mathrm{J}$.",
        "Convert: $E = 4.74\\times10^{-19}/1.60\\times10^{-19} = 2.96\\,\\mathrm{eV}$.",
      ],
      finalAnswer: "$E = 4.74\\times10^{-19}\\,\\mathrm{J} = 2.96\\,\\mathrm{eV}$",
    },
    {
      difficulty: "Medium",
      title: "Calcium photoelectrons",
      prompt:
        "Violet light ($420\\,\\mathrm{nm}$, $E_\\gamma = 2.96\\,\\mathrm{eV}$) hits calcium with work function $\\phi = 2.71\\,\\mathrm{eV}$. Find $\\mathrm{KE}_{\\max}$ and the stopping potential.",
      steps: [
        "Apply Einstein’s equation: $\\mathrm{KE}_{\\max} = hf - \\phi = 2.96 - 2.71 = 0.25\\,\\mathrm{eV}$ (≈ 0.246 eV).",
        "Stopping potential: $eV_s = \\mathrm{KE}_{\\max}$ so $V_s = 0.25\\,\\mathrm{V}$.",
        "Interpret: wavelength is only slightly above threshold ($\\lambda_0 = hc/\\phi \\approx 459\\,\\mathrm{nm}$).",
      ],
      finalAnswer: "$\\mathrm{KE}_{\\max} \\approx 0.25\\,\\mathrm{eV}$, $V_s \\approx 0.25\\,\\mathrm{V}$",
    },
    {
      difficulty: "Hard",
      title: "Extract $h$ from an experiment",
      prompt:
        "A metal yields stopping potentials $V_s = 0.80\\,\\mathrm{V}$ at $f = 8.0\\times10^{14}\\,\\mathrm{Hz}$ and $V_s = 1.60\\,\\mathrm{V}$ at $f = 1.0\\times10^{15}\\,\\mathrm{Hz}$. Estimate $h$ and $\\phi$.",
      steps: [
        "From $eV_s = hf - \\phi$, the difference eliminates $\\phi$: $e\\Delta V_s = h\\Delta f$.",
        "$\\Delta V_s = 0.80\\,\\mathrm{V}$, $\\Delta f = 2.0\\times10^{14}\\,\\mathrm{Hz}$.",
        "$h = e\\Delta V_s/\\Delta f = (1.60\\times10^{-19})(0.80)/(2.0\\times10^{14}) = 6.4\\times10^{-34}\\,\\mathrm{J\\cdot s}$.",
        "Then $\\phi = hf - eV_s$ using the first point: $\\phi = (6.4\\times10^{-34})(8.0\\times10^{14}) - (1.60\\times10^{-19})(0.80)$.",
        "$\\phi = 5.12\\times10^{-19} - 1.28\\times10^{-19} = 3.84\\times10^{-19}\\,\\mathrm{J} = 2.40\\,\\mathrm{eV}$.",
      ],
      finalAnswer: "$h \\approx 6.4\\times10^{-34}\\,\\mathrm{J\\cdot s}$, $\\phi \\approx 2.40\\,\\mathrm{eV}$",
    },
  ],
  quiz: [
    {
      id: "q1",
      type: "mcq",
      prompt:
        "If you double the intensity of light above threshold, what happens to the maximum KE of photoelectrons?",
      choices: [
        "It doubles",
        "It halves",
        "It stays essentially the same",
        "It becomes zero",
      ],
      correctIndex: 2,
      hint: "Intensity changes photon count, not photon energy $hf$.",
      explanation:
        "Each electron absorbs one photon of energy $hf$. Doubling intensity doubles the ejection rate (current), not $\\mathrm{KE}_{\\max}$.",
    },
    {
      id: "q2",
      type: "mcq",
      prompt: "Below the threshold frequency, increasing intensity will…",
      choices: [
        "Eventually eject electrons after enough time",
        "Never eject electrons",
        "Eject electrons with lower KE",
        "Change the work function",
      ],
      correctIndex: 1,
      hint: "One photon must supply at least $\\phi$.",
      explanation:
        "If $hf < \\phi$, no single photon can free an electron. Classical accumulation does not occur in the quantum model.",
    },
    {
      id: "q3",
      type: "mcq",
      prompt: "The slope of a graph of $\\mathrm{KE}_{\\max}$ versus frequency equals…",
      choices: ["$e$", "$\\phi$", "$h$", "$hc$"],
      correctIndex: 2,
      hint: "Look at $\\mathrm{KE}_{\\max} = hf - \\phi$.",
      explanation: "It is a straight line with slope $h$ and intercept related to $-\\phi$.",
    },
    {
      id: "q4",
      type: "open",
      prompt:
        "In 2–4 sentences, explain why the photoelectric effect supports the photon model of light rather than a purely classical wave model.",
      sampleAnswer:
        "A classical wave should eject electrons at any frequency given enough intensity and should show a delay while energy accumulates; KE should also rise with intensity. Experiments show a sharp threshold frequency, instantaneous emission, and KE that depends on frequency—not intensity—matching Einstein’s $hf$ photons.",
      hint: "Contrast threshold, delay, and intensity dependence.",
      explanation:
        "Strong answers cite threshold frequency, no time delay, and intensity affecting rate only.",
    },
  ],
  sources: [
    {
      label: "OpenStax College Physics — 29.2 The Photoelectric Effect (CC BY)",
      url: "https://openstax.org/books/college-physics/pages/29-2-the-photoelectric-effect",
    },
    {
      label: "OpenStax College Physics — Ch. 29 Introduction to Quantum Physics",
      url: "https://openstax.org/books/college-physics/pages/29-introduction-to-quantum-physics",
    },
    {
      label: "MIT OCW — Quantum Physics I (conceptual continuum)",
      url: "https://ocw.mit.edu/courses/8-04-quantum-physics-i-spring-2013/",
    },
  ],
};
