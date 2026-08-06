/**
 * ILE Theme System — curriculum-agnostic visual tokens.
 * Themes never encode country or curriculum logic.
 */
export type IleThemeId = "success-light" | "success-dark" | "high-contrast" | "presentation";

export type IleThemeTokens = {
  id: IleThemeId;
  label: { en: string; ar: string };
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    border: string;
    accent: string;
    warning: string;
    danger: string;
    success: string;
  };
  radius: { sm: number; md: number; lg: number };
  font: { body: string; mono: string; display: string };
  spacing: { xs: number; sm: number; md: number; lg: number };
};

export const ILE_THEMES: Record<IleThemeId, IleThemeTokens> = {
  "success-light": {
    id: "success-light",
    label: { en: "Success Light", ar: "نجاح فاتح" },
    colors: {
      bg: "#f8fafc",
      surface: "#ffffff",
      surfaceAlt: "#f1f5f9",
      text: "#0f172a",
      textMuted: "#64748b",
      primary: "#0f766e",
      primaryText: "#ffffff",
      border: "#e2e8f0",
      accent: "#14b8a6",
      warning: "#b45309",
      danger: "#b91c1c",
      success: "#15803d",
    },
    radius: { sm: 6, md: 10, lg: 14 },
    font: {
      body: "Georgia, 'Times New Roman', serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
      display: "'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  },
  "success-dark": {
    id: "success-dark",
    label: { en: "Success Dark", ar: "نجاح داكن" },
    colors: {
      bg: "#020617",
      surface: "#0f172a",
      surfaceAlt: "#1e293b",
      text: "#e2e8f0",
      textMuted: "#94a3b8",
      primary: "#2dd4bf",
      primaryText: "#042f2e",
      border: "#334155",
      accent: "#5eead4",
      warning: "#fbbf24",
      danger: "#f87171",
      success: "#4ade80",
    },
    radius: { sm: 6, md: 10, lg: 14 },
    font: {
      body: "Georgia, 'Times New Roman', serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
      display: "'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  },
  "high-contrast": {
    id: "high-contrast",
    label: { en: "High Contrast", ar: "تباين عالٍ" },
    colors: {
      bg: "#000000",
      surface: "#000000",
      surfaceAlt: "#111111",
      text: "#ffffff",
      textMuted: "#eeeeee",
      primary: "#ffff00",
      primaryText: "#000000",
      border: "#ffffff",
      accent: "#00ffff",
      warning: "#ffcc00",
      danger: "#ff6666",
      success: "#66ff66",
    },
    radius: { sm: 0, md: 0, lg: 0 },
    font: {
      body: "Arial, Helvetica, sans-serif",
      mono: "Consolas, monospace",
      display: "Arial Black, Arial, sans-serif",
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  },
  presentation: {
    id: "presentation",
    label: { en: "Presentation", ar: "عرض" },
    colors: {
      bg: "#042f2e",
      surface: "#0f766e",
      surfaceAlt: "#115e59",
      text: "#ecfdf5",
      textMuted: "#99f6e4",
      primary: "#5eead4",
      primaryText: "#042f2e",
      border: "#14b8a6",
      accent: "#99f6e4",
      warning: "#fde68a",
      danger: "#fecaca",
      success: "#bbf7d0",
    },
    radius: { sm: 8, md: 12, lg: 16 },
    font: {
      body: "Georgia, 'Times New Roman', serif",
      mono: "ui-monospace, Menlo, monospace",
      display: "'Iowan Old Style', Palatino, serif",
    },
    spacing: { xs: 6, sm: 12, md: 20, lg: 32 },
  },
};

export function themeToCssVars(theme: IleThemeTokens): Record<string, string> {
  return {
    "--ile-bg": theme.colors.bg,
    "--ile-surface": theme.colors.surface,
    "--ile-surface-alt": theme.colors.surfaceAlt,
    "--ile-text": theme.colors.text,
    "--ile-text-muted": theme.colors.textMuted,
    "--ile-primary": theme.colors.primary,
    "--ile-primary-text": theme.colors.primaryText,
    "--ile-border": theme.colors.border,
    "--ile-accent": theme.colors.accent,
    "--ile-warning": theme.colors.warning,
    "--ile-danger": theme.colors.danger,
    "--ile-success": theme.colors.success,
    "--ile-radius-sm": `${theme.radius.sm}px`,
    "--ile-radius-md": `${theme.radius.md}px`,
    "--ile-radius-lg": `${theme.radius.lg}px`,
    "--ile-font-body": theme.font.body,
    "--ile-font-mono": theme.font.mono,
    "--ile-font-display": theme.font.display,
  };
}

export function resolveTheme(id?: string | null): IleThemeTokens {
  if (id && id in ILE_THEMES) return ILE_THEMES[id as IleThemeId];
  return ILE_THEMES["success-light"];
}
