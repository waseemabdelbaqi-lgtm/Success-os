"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { studentDataService } from "@/services/student/student-data.service";
import { FONT_SIZE } from "@/lib/student-portal/constants";
import type {
  PortalLocale,
  StudentReadingSettings,
  TextDirection,
} from "@/types/student-portal";

type StudentPortalContextValue = {
  settings: StudentReadingSettings;
  locale: PortalLocale;
  direction: TextDirection;
  isFullscreen: boolean;
  setLocale: (locale: PortalLocale) => void;
  setTheme: (theme: "light" | "dark") => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setFontSize: (size: number) => void;
  toggleFullscreen: () => void;
  t: (key: string) => string;
};

const StudentPortalContext = createContext<StudentPortalContextValue | null>(
  null,
);

const TRANSLATIONS: Record<PortalLocale, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    books: "Books",
    courses: "Courses",
    interactiveLessons: "Interactive Lessons",
    bookmarks: "Bookmarks",
    notes: "Notes",
    readingHistory: "Reading History",
    profile: "Profile",
    continueReading: "Continue Reading",
    recentlyOpened: "Recently Opened",
    savedBooks: "Saved Books",
    recommended: "Recommended Books",
    currentCurriculum: "Current Curriculum",
    currentGrade: "Current Grade",
    currentSubjects: "Current Subjects",
    search: "Search",
    filters: "Filters",
    saveBook: "Save Book",
    unsaveBook: "Remove from Saved",
    continueLesson: "Continue Reading",
    tableOfContents: "Table of Contents",
    learningObjectives: "Learning Objectives",
    lessonSummary: "Lesson Summary",
    keyConcepts: "Key Concepts",
    definitions: "Definitions",
    importantNotes: "Important Notes",
    diagrams: "Images & Diagrams",
    references: "References",
    previousLesson: "Previous Lesson",
    nextLesson: "Next Lesson",
    bookmarkLesson: "Bookmark Lesson",
    addNote: "Add Note",
    copyText: "Copy Text",
    markComplete: "Mark Complete",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit Fullscreen",
    fontSize: "Font Size",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    searchInBook: "Search in book",
    demoNotice: "Demo content for interface testing only",
    noResults: "No results found",
    progress: "Progress",
    openLesson: "Open Lesson",
    viewBook: "View Book",
    allBooks: "All Books",
    country: "Country",
    system: "Educational System",
    curriculum: "Curriculum",
    grade: "Grade",
    subject: "Subject",
    language: "Language",
    bookType: "Book Type",
    version: "Version",
    description: "Description",
    units: "Units",
    lessons: "Lessons",
    highlights: "Highlights",
    myNotes: "My Notes",
    readingTools: "Reading Tools",
    unitNavigation: "Unit Navigation",
    completeLesson: "Complete Lesson",
    authorizedCopy: "Copy authorized excerpt",
    portalTitle: "Student Book Portal",
  },
  ar: {
    dashboard: "لوحة التحكم",
    books: "الكتب",
    courses: "الدورات",
    interactiveLessons: "دروس تفاعلية",
    bookmarks: "الإشارات المرجعية",
    notes: "الملاحظات",
    readingHistory: "سجل القراءة",
    profile: "الملف الشخصي",
    continueReading: "متابعة القراءة",
    recentlyOpened: "فُتحت مؤخراً",
    savedBooks: "الكتب المحفوظة",
    recommended: "كتب مقترحة",
    currentCurriculum: "المنهج الحالي",
    currentGrade: "الصف الحالي",
    currentSubjects: "المواد الحالية",
    search: "بحث",
    filters: "التصفية",
    saveBook: "حفظ الكتاب",
    unsaveBook: "إزالة من المحفوظات",
    continueLesson: "متابعة القراءة",
    tableOfContents: "جدول المحتويات",
    learningObjectives: "أهداف التعلم",
    lessonSummary: "ملخص الدرس",
    keyConcepts: "المفاهيم الأساسية",
    definitions: "التعريفات",
    importantNotes: "ملاحظات مهمة",
    diagrams: "الصور والمخططات",
    references: "المراجع",
    previousLesson: "الدرس السابق",
    nextLesson: "الدرس التالي",
    bookmarkLesson: "إشارة مرجعية",
    addNote: "إضافة ملاحظة",
    copyText: "نسخ النص",
    markComplete: "إكمال الدرس",
    fullscreen: "ملء الشاشة",
    exitFullscreen: "الخروج من ملء الشاشة",
    fontSize: "حجم الخط",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    searchInBook: "البحث في الكتاب",
    demoNotice: "محتوى تجريبي لاختبار الواجهة فقط",
    noResults: "لا توجد نتائج",
    progress: "التقدم",
    openLesson: "فتح الدرس",
    viewBook: "عرض الكتاب",
    allBooks: "جميع الكتب",
    country: "الدولة",
    system: "النظام التعليمي",
    curriculum: "المنهج",
    grade: "الصف",
    subject: "المادة",
    language: "اللغة",
    bookType: "نوع الكتاب",
    version: "الإصدار",
    description: "الوصف",
    units: "الوحدات",
    lessons: "الدروس",
    highlights: "التظليلات",
    myNotes: "ملاحظاتي",
    readingTools: "أدوات القراءة",
    unitNavigation: "تنقل الوحدات",
    completeLesson: "إكمال الدرس",
    authorizedCopy: "نسخ مقتطف مصرح",
    portalTitle: "بوابة الكتب الدراسية",
  },
};

type StudentPortalProviderProps = {
  children: ReactNode;
};

export function StudentPortalProvider({
  children,
}: StudentPortalProviderProps): ReactNode {
  const [settings, setSettings] = useState<StudentReadingSettings>({
    fontSize: FONT_SIZE.default,
    theme: "light",
    locale: "en",
    direction: "ltr",
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(studentDataService.getReadingSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    studentDataService.saveReadingSettings(settings);
    document.documentElement.lang = settings.locale;
    document.documentElement.dir = settings.direction;
  }, [settings, hydrated]);

  const persist = useCallback((next: StudentReadingSettings) => {
    setSettings(next);
  }, []);

  const setLocale = useCallback(
    (locale: PortalLocale) => {
      persist({
        ...settings,
        locale,
        direction: locale === "ar" ? "rtl" : "ltr",
      });
    },
    [persist, settings],
  );

  const setTheme = useCallback(
    (theme: "light" | "dark") => {
      persist({ ...settings, theme });
    },
    [persist, settings],
  );

  const increaseFontSize = useCallback(() => {
    persist({
      ...settings,
      fontSize: Math.min(settings.fontSize + FONT_SIZE.step, FONT_SIZE.max),
    });
  }, [persist, settings]);

  const decreaseFontSize = useCallback(() => {
    persist({
      ...settings,
      fontSize: Math.max(settings.fontSize - FONT_SIZE.step, FONT_SIZE.min),
    });
  }, [persist, settings]);

  const setFontSize = useCallback(
    (size: number) => {
      persist({
        ...settings,
        fontSize: Math.min(Math.max(size, FONT_SIZE.min), FONT_SIZE.max),
      });
    },
    [persist, settings],
  );

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const t = useCallback(
    (key: string) =>
      TRANSLATIONS[settings.locale][key] ?? TRANSLATIONS.en[key] ?? key,
    [settings.locale],
  );

  const value = useMemo(
    () => ({
      settings,
      locale: settings.locale,
      direction: settings.direction,
      isFullscreen,
      setLocale,
      setTheme,
      increaseFontSize,
      decreaseFontSize,
      setFontSize,
      toggleFullscreen,
      t,
    }),
    [
      settings,
      isFullscreen,
      setLocale,
      setTheme,
      increaseFontSize,
      decreaseFontSize,
      setFontSize,
      toggleFullscreen,
      t,
    ],
  );

  return (
    <StudentPortalContext.Provider value={value}>
      {children}
    </StudentPortalContext.Provider>
  );
}

export function useStudentPortal(): StudentPortalContextValue {
  const context = useContext(StudentPortalContext);
  if (!context) {
    throw new Error(
      "useStudentPortal must be used within StudentPortalProvider.",
    );
  }
  return context;
}
