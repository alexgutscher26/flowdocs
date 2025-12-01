# Bug Fix: Wiki Page publishedAt Logic

## Problem

The wiki page API routes had incorrect logic for managing the `publishedAt` timestamp field when creating and updating pages.

### Issues Found

1. **POST Route (`/api/wiki/[workspaceId]/pages/route.ts`)**
   - Validation checked `if (published && !content)` but `published` could be undefined
   - Default value `published ?? true` was applied after validation
   - This allowed creating published pages with empty content when `published` was not explicitly provided

2. **PUT Route (`/api/wiki/[workspaceId]/[slug]/route.ts`)** - **CRITICAL**
   - Logic: `publishedAt: published && !existingPage.published ? new Date() : existingPage.publishedAt`
   - Only set `publishedAt` when publishing for the first time
   - Did not clear `publishedAt` when unpublishing a page
   - When explicitly setting `published=false`, the old `publishedAt` was retained

### Impact

- Unpublished pages retained their `publishedAt` timestamp, causing confusion
- Published state and `publishedAt` field could be inconsistent
- Filtering or sorting by `publishedAt` would include unpublished pages

## Solution

### POST Route Fix

```typescript
// Before
if (published && !content) {
  return NextResponse.json({ error: "Content is required for published pages" }, { status: 400 });
}

// After
const willBePublished = published ?? true;

if (willBePublished && !content) {
  return NextResponse.json({ error: "Content is required for published pages" }, { status: 400 });
}
```

### PUT Route Fix

```typescript
// Before
publishedAt: published && !existingPage.published ? new Date() : existingPage.publishedAt;

// After
const newPublished = published ?? existingPage.published;

let publishedAt = existingPage.publishedAt;
if (newPublished && !existingPage.published) {
  // Publishing for the first time
  publishedAt = new Date();
} else if (!newPublished && existingPage.published) {
  // Unpublishing
  publishedAt = null;
}
// Otherwise keep existing publishedAt
```

## State Transitions

| Current State      | New State   | publishedAt Behavior |
| ------------------ | ----------- | -------------------- |
| Unpublished (null) | Published   | Set to current date  |
| Published (date)   | Published   | Keep existing date   |
| Published (date)   | Unpublished | Set to null          |
| Unpublished (null) | Unpublished | Keep null            |

## Testing

The fix includes unit tests in `app/api/wiki/__tests__/wiki-published-at.test.ts` that verify:

1. ✅ Creating published pages sets `publishedAt`
2. ✅ Creating unpublished pages keeps `publishedAt` null
3. ✅ Publishing for the first time sets `publishedAt`
4. ✅ Unpublishing clears `publishedAt`
5. ✅ Remaining published keeps original `publishedAt`
6. ✅ Remaining unpublished keeps `publishedAt` null
7. ✅ Explicit `published=false` correctly unpublishes

## Verification

To verify the fix works correctly:

1. Create an unpublished page → `publishedAt` should be null
2. Publish the page → `publishedAt` should be set to current date
3. Update the page while keeping it published → `publishedAt` should not change
4. Unpublish the page → `publishedAt` should become null
5. Update the unpublished page → `publishedAt` should remain null
