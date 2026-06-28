// =============================================================================
// Waitlist capture — pre-launch (invite-only beta)
// =============================================================================
// Luna isn't publicly available yet. The /early-access page collects waitlist
// entries through this single function. There is no backend wired up yet, so
// for now we just log the payload and resolve successfully.
//
// TODO: wire to backend /api/waitlist
//   Replace the body below with a real request, e.g.
//   const res = await fetch('/api/waitlist', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) throw new Error('Failed to join waitlist');
// =============================================================================

export type WaitlistPlatform = 'shopify' | 'no' | 'other';
export type WaitlistDmsBucket = '<50' | '50-200' | '200-500' | '500+';

export interface WaitlistData {
  email: string;
  brandName: string;
  instagramHandle: string;
  platform: WaitlistPlatform;
  dmsPerWeek: WaitlistDmsBucket;
  market: string;
  painPoint?: string;
}

export async function submitWaitlist(data: WaitlistData): Promise<void> {
  // TODO: wire to backend /api/waitlist
  console.log('[waitlist] submission', data);
  // Simulate a short network round-trip so the submitting state is visible.
  await new Promise((resolve) => setTimeout(resolve, 600));
}
