# Knowledge Base API Integration

## Overview

The Knowledge Base feature has been fully integrated between the frontend and backend, allowing users to manage FAQs that Luna uses to respond to customer inquiries.

## Backend Implementation

### Endpoint: GET `/knowledge-base`

**Authentication**: Required (Bearer token)

**Description**: Retrieves the knowledge base FAQs for the authenticated user's brand.

**Response**:
```json
{
  "id": "uuid",
  "brand_id": "uuid",
  "faqs": [
    {
      "question": "What is your return policy?",
      "answer": "We accept returns within 30 days of purchase..."
    },
    {
      "question": "How long does shipping take?",
      "answer": "Standard shipping takes 5-7 business days..."
    }
  ]
}
```

**Error Handling**:
- Returns empty `faqs` array `[]` if no knowledge base exists for the brand
- Returns 404 if user not found
- Returns 500 for server errors

### Endpoint: POST `/knowledge-base`

**Authentication**: Required (Bearer token)

**Description**: Creates or updates the knowledge base FAQs for the authenticated user's brand.

**Request Body**:
```json
{
  "faqs": [
    {
      "question": "What is your return policy?",
      "answer": "We accept returns within 30 days of purchase..."
    }
  ]
}
```

**Validation**:
- `faqs` must be an array
- Each FAQ must have a non-empty `question` string
- Each FAQ must have a non-empty `answer` string

**Response**:
```json
{
  "message": "Knowledge base saved successfully",
  "id": "uuid",
  "brand_id": "uuid",
  "faqs": [...]
}
```

**Behavior**:
- Creates new knowledge base record if one doesn't exist
- Updates existing knowledge base record if one does exist
- Automatically associates with user's brand

### Endpoint: DELETE `/knowledge-base/:index`

**Authentication**: Required (Bearer token)

**Description**: Deletes a specific FAQ item from the knowledge base by its array index.

**URL Parameters**:
- `index` (number): The array index of the FAQ to delete (0-based)

**Response**:
```json
{
  "message": "FAQ deleted successfully",
  "faqs": [...]
}
```

**Error Handling**:
- Returns 400 if index is invalid
- Returns 400 if index is out of range
- Returns 404 if knowledge base not found

## Frontend Implementation

### API Client Functions

**File**: `lib/api.ts`

#### `getKnowledgeBase()`

Fetches the current knowledge base from the backend.

```typescript
export const getKnowledgeBase = async () => {
  return apiRequest('/knowledge-base', {
    method: 'GET',
  });
};
```

**Returns**: Object with `faqs` array

#### `saveKnowledgeBase(faqs)`

Saves or updates the knowledge base with new FAQs.

```typescript
export const saveKnowledgeBase = async (faqs: Array<{
  question: string;
  answer: string;
}>) => {
  return apiRequest('/knowledge-base', {
    method: 'POST',
    body: JSON.stringify({ faqs }),
  });
};
```

**Parameters**:
- `faqs`: Array of FAQ objects with `question` and `answer` properties

**Returns**: Confirmation response with saved FAQs

#### `deleteKnowledgeFAQ(index)`

Deletes a specific FAQ by index.

```typescript
export const deleteKnowledgeFAQ = async (index: number) => {
  return apiRequest(`/knowledge-base/${index}`, {
    method: 'DELETE',
  });
};
```

**Parameters**:
- `index`: Zero-based index of the FAQ to delete

**Returns**: Updated FAQs list

### Knowledge Base Page

**File**: `app/dashboard/luna/knowledge-base/page.tsx`

#### Features

1. **Load Knowledge Base on Mount**
   - Fetches FAQs from backend when page loads
   - Maps backend FAQs to frontend items with unique IDs
   - Falls back to empty state if fetch fails
   - Maintains default examples until user saves their own

2. **Add Questions**
   - Button to add new empty FAQ rows
   - Users can type questions and answers
   - No immediate API call (batched on save)

3. **Edit Questions**
   - Inline textarea editing for both question and answer
   - Real-time local state updates
   - No API calls until save

4. **Delete Questions**
   - Delete button removes FAQs from the list
   - No immediate API call (batched on save)
   - User can undo before saving

5. **Save Changes**
   - Single "Save changes" button
   - Sends all FAQs to backend in one request
   - Shows loading state while saving
   - Displays success message for 2.5 seconds
   - Handles and displays errors

#### User Flow

```
1. User navigates to Knowledge Base page
2. Frontend checks authentication
3. If authenticated:
   a. Fetches FAQs from backend
   b. Maps to local state
   c. Renders table with all FAQs
4. User can:
   a. Add new questions (creates empty row)
   b. Edit questions/answers (instant local update)
   c. Delete questions (removes from list)
5. When user clicks "Save changes":
   a. Shows loading state
   b. Sends all FAQs to backend
   c. Backend creates/updates knowledge base
   d. Shows success message
6. If user navigates away and returns:
   a. Fetches fresh data from backend
   b. Shows all saved FAQs
```

## Database Schema

### Knowledge Base Table

```sql
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE UNIQUE,
  brand_name TEXT,
  tone TEXT,
  guidelines TEXT,
  faqs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields**:
- `id`: Unique identifier for the knowledge base record
- `brand_id`: Links to the brand (user's business)
- `brand_name`: Stored copy of business name
- `tone`: (Optional) Luna's response tone
- `guidelines`: (Optional) Response guidelines
- `faqs`: JSONB array of FAQ objects
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Example Request/Response

### Create/Update Knowledge Base

**Request**:
```bash
POST https://krew-ai-backend-production.up.railway.app/knowledge-base
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "faqs": [
    {
      "question": "What is your return policy?",
      "answer": "We accept returns within 30 days of purchase with original receipt."
    },
    {
      "question": "Do you offer international shipping?",
      "answer": "Yes, we ship to all countries. International shipping takes 10-14 business days."
    }
  ]
}
```

**Response** (Status 200):
```json
{
  "message": "Knowledge base saved successfully",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "brand_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "faqs": [
    {
      "question": "What is your return policy?",
      "answer": "We accept returns within 30 days of purchase with original receipt."
    },
    {
      "question": "Do you offer international shipping?",
      "answer": "Yes, we ship to all countries. International shipping takes 10-14 business days."
    }
  ]
}
```

## Frontend-Backend Data Flow

### Fetch Flow

```
Frontend Page Load
  ↓
Check Authentication (isLoggedIn())
  ↓
Call getKnowledgeBase() from lib/api.ts
  ↓
Backend GET /knowledge-base (with Bearer token)
  ↓
Backend retrieves user's brand_id from token
  ↓
Backend queries knowledge_base table
  ↓
Backend returns faqs array
  ↓
Frontend maps faqs to items with IDs
  ↓
Frontend renders table with questions/answers
```

### Save Flow

```
User clicks "Save changes" button
  ↓
Extract faqs from local state (remove IDs)
  ↓
Call saveKnowledgeBase(faqs) from lib/api.ts
  ↓
Backend POST /knowledge-base (with Bearer token and faqs)
  ↓
Backend validates faq array and fields
  ↓
Backend retrieves user's brand_id from token
  ↓
Backend checks if knowledge_base exists for brand
  ↓
If exists: UPDATE; If not: INSERT
  ↓
Backend returns updated faqs
  ↓
Frontend shows "Knowledge base saved" message
  ↓
Message auto-hides after 2.5 seconds
```

## Error Handling

### Common Error Scenarios

**Scenario 1: User Not Authenticated**
- Frontend checks `isLoggedIn()` before fetching
- Redirects to login page immediately
- Backend validates Bearer token on all requests

**Scenario 2: No Existing Knowledge Base**
- Backend returns empty `faqs: []` array
- Frontend shows table with default examples
- User can add their own FAQs

**Scenario 3: Save with Invalid Data**
- Frontend validates each FAQ has question and answer
- Backend validates same rules
- Returns 400 with specific error message

**Scenario 4: Network Error During Save**
- Frontend catch block displays alert
- Loading state is cleared
- User can retry

**Scenario 5: FAQ Array Too Large**
- Database has JSONB field with no explicit limit
- Practical limit depends on database configuration
- Should implement frontend limit if needed

## Testing

### Manual Testing Checklist

- [ ] Navigate to Knowledge Base page when authenticated
- [ ] Verify FAQs load from backend
- [ ] Add new FAQ and verify it appears in table
- [ ] Edit question text and verify local update
- [ ] Edit answer text and verify local update
- [ ] Delete FAQ and verify removal from table
- [ ] Click "Save changes" and verify loading state
- [ ] Verify success message appears after save
- [ ] Navigate away and return to verify data persists
- [ ] Verify proper error handling if network fails

### API Testing

```bash
# Login to get token
curl -X POST https://krew-ai-backend-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get knowledge base
curl -X GET https://krew-ai-backend-production.up.railway.app/knowledge-base \
  -H "Authorization: Bearer YOUR_TOKEN"

# Save knowledge base
curl -X POST https://krew-ai-backend-production.up.railway.app/knowledge-base \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "faqs": [
      {"question": "Test?", "answer": "This is a test."}
    ]
  }'

# Delete FAQ at index 0
curl -X DELETE https://krew-ai-backend-production.up.railway.app/knowledge-base/0 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT token
2. **Authorization**: Users only access their own brand's knowledge base
3. **Input Validation**: Backend validates all FAQ fields
4. **Token Injection**: API client automatically includes token in requests
5. **HTTPS Only**: All requests use HTTPS (production backend)

## Future Enhancements

1. **Categories**: Add category field to FAQs for organization
2. **Search**: Implement search/filter for large FAQ lists
3. **Bulk Operations**: Support importing FAQs from CSV/JSON
4. **Version History**: Track FAQ changes over time
5. **Analytics**: Track which FAQs Luna uses most
6. **AI Suggestions**: Suggest FAQ improvements based on conversations
7. **Multi-language**: Support FAQs in multiple languages

## Status

✅ **Complete and Ready for Production**

- Backend endpoints fully implemented
- Frontend fully integrated
- TypeScript validation passes
- Error handling in place
- Database schema set up
- Ready for user testing

---

Last Updated: March 10, 2025
