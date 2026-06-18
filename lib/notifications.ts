// =============================================================================
// NOTIFICATIONS — transient event feed (frontend, mocked)
// =============================================================================
// This is a SEPARATE system from onboarding. Onboarding is persistent setup
// state; notifications are transient events (escalations, orders, exchanges).
// Do not entangle the two.
//
// v1 is bell + dropdown only. Unread/read is local component state for now
// (resets on refresh, by design). No real feed, websocket, or polling.
//
// TODO(backend): replace mock notifications with real event feed.
//   Backend should provide a per-store notification feed with read/unread
//   persistence (and ideally real-time delivery). See the "Notifications"
//   section of AGENT_NAME_INTEGRATION.md for which system emits each type.
// =============================================================================

export type NotificationType = 'escalation' | 'new_order' | 'new_exchange';

export interface AppNotification {
  id: string;
  type: NotificationType;
  /** Short human label shown in the dropdown row. */
  label: string;
  /** Display timestamp (mock). Backend should send a real ISO timestamp. */
  time: string;
  /** Where clicking the notification navigates. */
  href: string;
  read: boolean;
}

// Per-type metadata. Add a new type here + its icon in the dropdown component
// and everything else (routing, count, rendering) works without further changes.
export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  escalation: 'Escalation',
  new_order: 'New order',
  new_exchange: 'Exchange request',
};

// Default routing target per type. Individual notifications can override `href`
// to deep-link a specific conversation/order/exchange.
export const NOTIFICATION_DEFAULT_HREF: Record<NotificationType, string> = {
  escalation: '/dashboard/luna/issues',
  new_order: '/dashboard/luna/conversations',
  new_exchange: '/dashboard/luna/exchanges-refunds',
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'escalation',
    label: 'A conversation was escalated and needs your attention',
    time: '2m ago',
    href: '/dashboard/luna/issues',
    read: false,
  },
  {
    id: 'n2',
    type: 'new_order',
    label: 'New order placed through a chat',
    time: '1h ago',
    href: '/dashboard/luna/conversations',
    read: false,
  },
  {
    id: 'n3',
    type: 'new_exchange',
    label: 'A customer requested an exchange',
    time: '3h ago',
    href: '/dashboard/luna/exchanges-refunds',
    read: true,
  },
];
