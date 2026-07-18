# Student Book Portal

The Student Book Portal is a dedicated digital reading experience for Success OS students.

## Demo content

All books, units, and lessons currently come from `content/demo/catalog.ts`. This data is **explicitly marked as demo content** and is separated from future production curriculum integrations.

```typescript
import { DEMO_CONTENT_META } from "@/content/demo/catalog";
// DEMO_CONTENT_META.isDemo === true
```

## Routes

| Route | Purpose |
|-------|---------|
| `/student/dashboard` | Student home with continue reading, progress, recommendations |
| `/student/books` | Filterable books library |
| `/student/books/[bookId]` | Book detail with table of contents |
| `/student/books/[bookId]/units/[unitId]` | Redirects to first lesson in unit |
| `/student/books/.../lessons/[lessonId]` | Full lesson reader with tools |
| `/student/bookmarks` | Saved lesson bookmarks |
| `/student/notes` | Personal lesson notes |
| `/student/reading-history` | Reading activity log |
| `/student/profile` | Curriculum journey preferences |

## Architecture

```
content/demo/          Demo catalog (replace with API/Firestore later)
types/student-portal.ts Shared types
services/student/        BookCatalogService + StudentDataService
components/student-portal/  UI by feature area
app/(protected)/student/    Next.js routes
```

## Student data persistence

Bookmarks, notes, highlights, progress, and profile are stored in `localStorage` via `StudentDataService`. The service interface is ready to swap for Firestore without changing UI components.

## Reading tools

- Search inside book
- Font size controls
- Light/dark reading mode
- Fullscreen mode
- Bookmark lessons
- Text highlighting
- Personal notes
- Authorized text copy
- Reading progress tracking
- Reading history
- EN/AR interface with RTL/LTR support

## Access control

Only users with the `student` role (or elevated platform roles) can access `/student/*`. Middleware rules are defined in `lib/auth/middleware-config.ts`.

## Replacing demo content

1. Create a production curriculum service under `services/student/`
2. Replace `bookCatalogService` data source
3. Keep types in `types/student-portal.ts`
4. Remove or gate `DEMO_CONTENT_META` banner
