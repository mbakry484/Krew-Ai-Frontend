import { IvyState } from '@/lib/ivy/ivyClient';

// Revenue channels need to be tellable-apart (like capital pool cards), so each
// gets a stable hue keyed to its position in the channel list — starting from
// Ivy's identity teal (152) and rotating. Not a new "palette": light is still
// delivered the aura way (hsl at low alpha / glow), never flat brand fills.
const CHANNEL_HUES = [172, 210, 262, 30, 320, 90];

export function channelHue(state: Pick<IvyState, 'revenueChannels'>, channelId: string): number {
  const idx = state.revenueChannels.findIndex((c) => c.id === channelId);
  return CHANNEL_HUES[(idx < 0 ? 0 : idx) % CHANNEL_HUES.length];
}

export function channelColor(state: Pick<IvyState, 'revenueChannels'>, channelId: string, alpha = 1): string {
  return `hsl(${channelHue(state, channelId)} 58% 58% / ${alpha})`;
}
