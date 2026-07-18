import {
  DEMO_BOOKS,
  DEMO_CONTENT_META,
  DEMO_COUNTRIES,
  DEMO_CURRICULA,
  DEMO_GRADES,
  DEMO_SUBJECTS,
  DEMO_SYSTEMS,
  filterDemoBooks,
  getLocalizedText,
} from "@/content/demo/catalog";
import type {
  BookDefinition,
  BookFilters,
  BookProgress,
  ContinueReadingItem,
  LessonDefinition,
  PortalLocale,
  UnitDefinition,
} from "@/types/student-portal";

export class BookCatalogService {
  getMeta() {
    return DEMO_CONTENT_META;
  }

  getCountries() {
    return DEMO_COUNTRIES;
  }

  getSystems(countryId?: string) {
    return countryId
      ? DEMO_SYSTEMS.filter((system) => system.countryId === countryId)
      : DEMO_SYSTEMS;
  }

  getCurricula(systemId?: string) {
    return systemId
      ? DEMO_CURRICULA.filter((curriculum) => curriculum.systemId === systemId)
      : DEMO_CURRICULA;
  }

  getGrades(curriculumId?: string) {
    return curriculumId
      ? DEMO_GRADES.filter((grade) => grade.curriculumId === curriculumId)
      : DEMO_GRADES;
  }

  getSubjects() {
    return DEMO_SUBJECTS;
  }

  getAllBooks(): BookDefinition[] {
    return DEMO_BOOKS;
  }

  filterBooks(filters: BookFilters): BookDefinition[] {
    return filterDemoBooks(DEMO_BOOKS, filters);
  }

  getBookById(bookId: string): BookDefinition | null {
    return DEMO_BOOKS.find((book) => book.id === bookId) ?? null;
  }

  getUnit(bookId: string, unitId: string): UnitDefinition | null {
    const book = this.getBookById(bookId);
    return book?.units.find((unit) => unit.id === unitId) ?? null;
  }

  getLesson(
    bookId: string,
    unitId: string,
    lessonId: string,
  ): LessonDefinition | null {
    const unit = this.getUnit(bookId, unitId);
    return unit?.lessons.find((lesson) => lesson.id === lessonId) ?? null;
  }

  getTotalLessons(bookId: string): number {
    const book = this.getBookById(bookId);
    if (!book) return 0;
    return book.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
  }

  getLessonPath(
    bookId: string,
    unitId: string,
    lessonId: string,
  ): {
    book: BookDefinition;
    unit: UnitDefinition;
    lesson: LessonDefinition;
    lessonIndex: number;
    totalLessons: number;
  } | null {
    const book = this.getBookById(bookId);
    const unit = this.getUnit(bookId, unitId);
    const lesson = this.getLesson(bookId, unitId, lessonId);

    if (!book || !unit || !lesson) return null;

    const allLessons = book.units.flatMap((u) =>
      u.lessons.map((l) => ({ unitId: u.id, lessonId: l.id })),
    );
    const lessonIndex = allLessons.findIndex(
      (item) => item.unitId === unitId && item.lessonId === lessonId,
    );

    return {
      book,
      unit,
      lesson,
      lessonIndex,
      totalLessons: allLessons.length,
    };
  }

  getAdjacentLessons(bookId: string, unitId: string, lessonId: string) {
    const book = this.getBookById(bookId);
    if (!book) return { previous: null, next: null };

    const flat = book.units.flatMap((unit) =>
      unit.lessons.map((lesson) => ({
        unitId: unit.id,
        lessonId: lesson.id,
      })),
    );

    const index = flat.findIndex(
      (item) => item.unitId === unitId && item.lessonId === lessonId,
    );

    if (index === -1) return { previous: null, next: null };

    return {
      previous: index > 0 ? flat[index - 1]! : null,
      next: index < flat.length - 1 ? flat[index + 1]! : null,
    };
  }

  searchInBook(bookId: string, query: string, locale: PortalLocale) {
    const book = this.getBookById(bookId);
    if (!book || !query.trim()) return [];

    const q = query.toLowerCase();
    const results: {
      unitId: string;
      lessonId: string;
      unitTitle: string;
      lessonTitle: string;
      snippet: string;
    }[] = [];

    for (const unit of book.units) {
      for (const lesson of unit.lessons) {
        const fields = [
          getLocalizedText(lesson.title, locale),
          getLocalizedText(lesson.summary, locale),
          getLocalizedText(lesson.content, locale),
          ...lesson.keyConcepts[locale],
          ...lesson.definitions[locale].map((d) => `${d.term} ${d.meaning}`),
        ]
          .join(" ")
          .toLowerCase();

        if (fields.includes(q)) {
          results.push({
            unitId: unit.id,
            lessonId: lesson.id,
            unitTitle: getLocalizedText(unit.title, locale),
            lessonTitle: getLocalizedText(lesson.title, locale),
            snippet: getLocalizedText(lesson.summary, locale),
          });
        }
      }
    }

    return results;
  }

  getRecommendedBooks(
    profile: {
      countryId?: string;
      gradeId?: string;
      subjectIds?: string[];
    },
    savedBookIds: string[],
    locale: PortalLocale,
  ): BookDefinition[] {
    const scored = DEMO_BOOKS.map((book) => {
      let score = 0;
      if (profile.countryId && book.countryId === profile.countryId) score += 3;
      if (profile.gradeId && book.gradeId === profile.gradeId) score += 3;
      if (profile.subjectIds?.includes(book.subjectId)) score += 2;
      if (savedBookIds.includes(book.id)) score -= 5;
      if (book.language === locale) score += 1;
      return { book, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.book);
  }

  buildContinueReading(
    progressList: BookProgress[],
    locale: PortalLocale,
  ): ContinueReadingItem[] {
    return progressList
      .filter((item) => item.lastLessonId && item.lastUnitId)
      .sort(
        (a, b) =>
          new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime(),
      )
      .slice(0, 5)
      .map((item) => {
        const book = this.getBookById(item.bookId);
        const lesson = book
          ? this.getLesson(item.bookId, item.lastUnitId!, item.lastLessonId!)
          : null;

        return {
          bookId: item.bookId,
          unitId: item.lastUnitId!,
          lessonId: item.lastLessonId!,
          bookTitle: book ? getLocalizedText(book.title, locale) : item.bookId,
          lessonTitle: lesson
            ? getLocalizedText(lesson.title, locale)
            : item.lastLessonId!,
          progressPercent: item.progressPercent,
          lastReadAt: item.lastReadAt,
        };
      });
  }

  resolveJourneyLabels(bookId: string, locale: PortalLocale) {
    const book = this.getBookById(bookId);
    if (!book) return null;

    const country = DEMO_COUNTRIES.find((c) => c.id === book.countryId);
    const system = DEMO_SYSTEMS.find((s) => s.id === book.systemId);
    const curriculum = DEMO_CURRICULA.find((c) => c.id === book.curriculumId);
    const grade = DEMO_GRADES.find((g) => g.id === book.gradeId);
    const subject = DEMO_SUBJECTS.find((s) => s.id === book.subjectId);

    return {
      country: country ? getLocalizedText(country.name, locale) : "",
      system: system ? getLocalizedText(system.name, locale) : "",
      curriculum: curriculum ? getLocalizedText(curriculum.name, locale) : "",
      grade: grade ? getLocalizedText(grade.name, locale) : "",
      subject: subject ? getLocalizedText(subject.name, locale) : "",
    };
  }
}

export const bookCatalogService = new BookCatalogService();
