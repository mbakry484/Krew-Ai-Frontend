// Middleware is disabled because we use client-side localStorage for tokens
// Protection is handled by useEffect checks in each protected page component
// For production, implement server-side authentication with httpOnly cookies

export const config = {
  matcher: [],
};