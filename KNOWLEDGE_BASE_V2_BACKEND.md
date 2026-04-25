# Knowledge Base v2 — Backend Integration Guide

## What Changed in the Frontend

Two new optional feature sections were added to the Customize page:

1. **Situations** — A togglable list of real-time context statements Luna should be aware of (e.g. "We are currently experiencing delivery delays"). Each entry is a single text string, not a Q/A pair.
2. **Size Guides** — A togglable table where each row has a product name and a size guide. Each size guide is **either** free text **or** an uploaded image — never both. The UI enforces this:
   - Empty row: shows a textarea with a placeholder + an "attach image instead" button below it.
   - Text entered: the "attach image" option is hidden. To switch to image mode the user must clear the text first.
   - Image uploaded: the textarea is hidden entirely. A 120px-tall clickable preview card is shown. Clicking the card opens a full-screen lightbox overlay. A "remove image" link returns the row to text mode.

Both features are off by default and activated via a toggle. The entire Customize page (FAQs + situations + size guides) is saved together via a single `POST /knowledge-base` call.

---

## Database Schema Changes

### Option A — Add columns to existing `knowledge_base` table (recommended)

```sql
ALTER TABLE knowledge_base
  ADD COLUMN IF NOT EXISTS situations_enabled  BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS situations          JSONB     NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS size_guides_enabled BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS size_guides         JSONB     NOT NULL DEFAULT '[]'::jsonb;
```

**Existing table for reference:**
```sql
CREATE TABLE knowledge_base (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    UUID REFERENCES brands(id) ON DELETE CASCADE UNIQUE,
  brand_name  TEXT,
  tone        TEXT,
  guidelines  TEXT,
  faqs        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### JSONB Shapes

**`situations`** — array of situation objects:
```json
[
  { "text": "We are experiencing delivery delays and are working to resolve this." },
  { "text": "Our exchange window has been extended to 30 days until further notice." }
]
```

**`size_guides`** — array of size guide objects. Each entry has **either** `content` (text) **or** `image_url` (image) — never both. The frontend enforces mutual exclusivity; the backend should treat both as optional but validate that at least one is present when `size_guides_enabled` is `true`.

```json
[
  {
    "product_name": "Classic Tee",
    "content": "XS = chest 36cm, S = chest 38cm, M = chest 42cm, L = chest 46cm",
    "image_url": null
  },
  {
    "product_name": "Cargo Shorts",
    "content": "",
    "image_url": "https://your-storage-bucket.com/size-guides/uuid-filename.jpg"
  }
]
```

---

## Image Storage

Size guide images need a storage bucket. Recommended approach: **AWS S3** or **Supabase Storage**.

### Supabase Storage (if already using Supabase)

1. Create a bucket named `size-guide-images` (public read, authenticated write).
2. Set policy: authenticated users can upload to their own brand folder.
3. Use path pattern: `/{brand_id}/{uuid}.{ext}`

### AWS S3 alternative

1. Create bucket `krew-size-guides`.
2. Set CORS to allow your API origin.
3. Use signed URLs or a presigned upload flow.

---

## New Endpoint: `POST /knowledge-base/upload-image`

**Authentication**: Required (Bearer token)

**Content-Type**: `multipart/form-data`

**Request**: Form field `file` containing the image file.

**Response**:
```json
{ "url": "https://your-storage-bucket.com/size-guides/brand-id/uuid.jpg" }
```

**Backend steps:**
1. Validate file is an image (`image/jpeg`, `image/png`, `image/webp`, `image/gif`).
2. Enforce max file size (recommend 5 MB).
3. Generate a UUID filename, preserving the extension.
4. Upload to storage bucket under `/{brand_id}/{uuid}.{ext}`.
5. Return the public URL.

**Error responses:**
- `400` — no file provided, or invalid file type.
- `413` — file too large.
- `500` — storage upload failed.

**Example Express handler:**
```javascript
router.post('/knowledge-base/upload-image', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  const ext = req.file.originalname.split('.').pop();
  const key = `${req.user.brand_id}/${uuidv4()}.${ext}`;

  // Upload to S3 / Supabase Storage
  const url = await storageUpload(key, req.file.buffer, req.file.mimetype);

  res.json({ url });
});
```

---

## Updated Endpoint: `GET /knowledge-base`

No changes to the URL or authentication. The response must now include the four new fields.

**Updated response shape:**
```json
{
  "id": "uuid",
  "brand_id": "uuid",
  "faqs": [
    { "question": "What's the delivery time?", "answer": "3-5 business days" }
  ],
  "situations_enabled": false,
  "situations": [],
  "size_guides_enabled": false,
  "size_guides": []
}
```

**If the row predates the migration**, the new columns default to `false` and `[]`, so no extra logic is needed — just `SELECT *` and the new columns will be present.

---

## Updated Endpoint: `POST /knowledge-base`

No changes to the URL or authentication. The request body now optionally includes the new fields alongside `faqs`.

**Updated request body:**
```json
{
  "faqs": [
    { "question": "What's the delivery time?", "answer": "3-5 business days" }
  ],
  "situations_enabled": true,
  "situations": [
    { "text": "We are experiencing delivery delays right now." }
  ],
  "size_guides_enabled": true,
  "size_guides": [
    {
      "product_name": "Classic Tee",
      "content": "XS = 36cm, S = 38cm, M = 42cm",
      "image_url": "https://bucket.com/size-guides/brand-id/abc.jpg"
    }
  ]
}
```

**Validation rules:**
- `faqs` — required, array (existing rule).
- `situations_enabled` — optional boolean, default `false`.
- `situations` — optional array; each item must have a non-empty `text` string if `situations_enabled` is `true`.
- `size_guides_enabled` — optional boolean, default `false`.
- `size_guides` — optional array; each item must have a non-empty `product_name`; exactly one of `content` (non-empty string) or `image_url` (non-empty string) must be present — the frontend enforces mutual exclusivity so both being set should be treated as a validation error.

**Updated upsert query (example):**
```sql
INSERT INTO knowledge_base (brand_id, brand_name, faqs, situations_enabled, situations, size_guides_enabled, size_guides, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
ON CONFLICT (brand_id) DO UPDATE SET
  faqs               = EXCLUDED.faqs,
  situations_enabled = EXCLUDED.situations_enabled,
  situations         = EXCLUDED.situations,
  size_guides_enabled = EXCLUDED.size_guides_enabled,
  size_guides        = EXCLUDED.size_guides,
  updated_at         = NOW();
```

---

## How Luna Should Use the New Data

When building the system prompt / context for Luna, extend the existing FAQ injection to include:

### Situations injection (when `situations_enabled = true`)
```
## Current Situations
Luna must proactively mention these situations when relevant:
- We are experiencing delivery delays right now and are working to resolve this.
- Our exchange window has been extended to 30 days until further notice.
```

### Size guides injection (when `size_guides_enabled = true`)
```
## Size Guides
When a customer asks about sizing, refer to the following:

Classic Tee: XS = chest 36cm, S = chest 38cm, M = chest 42cm, L = chest 46cm
[Size chart image available at: https://bucket.com/.../abc.jpg]

Cargo Shorts: [Size chart image available at: https://bucket.com/.../def.jpg]
```

For image-only size guides, tell Luna to share the image URL directly in the conversation if the platform supports image messages (e.g. Instagram DMs).

---

## Migration Steps (in order)

1. **Run the `ALTER TABLE` SQL** above in your database.
2. **Deploy the image upload endpoint** (`POST /knowledge-base/upload-image`) with storage integration.
3. **Deploy the updated `GET /knowledge-base`** to return the four new fields.
4. **Deploy the updated `POST /knowledge-base`** to accept and persist the new fields.
5. **Update the Luna prompt builder** to inject situations and size guides into context.
6. **Deploy the updated frontend** from branch `hazem`.

---

## Rollback

The new columns have safe defaults (`false` / `[]`). If a rollback is needed:

- The old frontend version ignores unknown fields in the GET response — safe.
- The old frontend never sends `situations_*` or `size_guides_*` — the new columns will simply stay at their defaults.

No data loss in either direction.

---

## Testing Checklist

### Image upload
- [ ] `POST /knowledge-base/upload-image` with a valid JPEG — returns `{ url: "..." }`
- [ ] Same with PNG, WebP
- [ ] Attempt with a PDF — returns 400
- [ ] Attempt with a file > 5 MB — returns 413
- [ ] Confirm file appears in storage bucket under the correct brand path

### Situations
- [ ] Save KB with `situations_enabled: true` and two situation entries
- [ ] `GET /knowledge-base` returns `situations_enabled: true` and both entries
- [ ] Save KB with `situations_enabled: false` — entries are preserved but Luna should not use them
- [ ] Save KB with empty `situations` array — no error

### Size guides
- [ ] Save KB with a size guide entry (text only) — persists correctly
- [ ] Save KB with a size guide entry (image URL only) — persists correctly
- [ ] Save KB with a size guide entry (both text and image) — persists correctly
- [ ] `GET /knowledge-base` returns all size guide fields including `image_url`

### Backwards compatibility
- [ ] Old rows with no new columns return `situations_enabled: false`, `situations: []`, `size_guides_enabled: false`, `size_guides: []`
- [ ] Saving via old frontend (only `faqs`) does not clear `situations` or `size_guides` columns — **important:** the upsert must only overwrite the fields actually sent; use `COALESCE` or only update columns present in the request body if this is a concern.

---

## Status

- [ ] `ALTER TABLE` migration applied
- [ ] Image storage bucket created and configured
- [ ] `POST /knowledge-base/upload-image` deployed
- [ ] `GET /knowledge-base` returns new fields
- [ ] `POST /knowledge-base` persists new fields
- [ ] Luna prompt builder updated
- [ ] Frontend branch `hazem` deployed

---

*Last updated: 2026-04-25*
