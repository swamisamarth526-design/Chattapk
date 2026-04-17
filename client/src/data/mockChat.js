export const mockCurrentUser = {
  id: 'me',
  name: 'Alex Mercer',
  email: 'alex@chatx.dev',
};

export const mockConversations = [
  {
    id: 'conv-1',
    title: 'Maya Chen',
    status: 'online',
    role: 'Product designer',
    unreadCount: 2,
    updatedAt: '2026-03-30T08:45:00Z',
    lastMessage: 'I updated the mobile layout and the sidebar feels much cleaner now.',
    participants: [
      { id: 'me', name: 'Alex Mercer' },
      { id: 'maya', name: 'Maya Chen' },
    ],
    messages: [
      {
        id: 'm-1',
        senderId: 'maya',
        senderName: 'Maya Chen',
        text: 'I adjusted the spacing in the mobile header.',
        createdAt: '2026-03-30T08:20:00Z',
        delivery: 'sent',
      },
      {
        id: 'm-2',
        senderId: 'me',
        senderName: 'Alex Mercer',
        text: 'Looks good. Can we make the action button a little more obvious?',
        createdAt: '2026-03-30T08:25:00Z',
        delivery: 'delivered',
      },
      {
        id: 'm-3',
        senderId: 'maya',
        senderName: 'Maya Chen',
        text: 'Yes, I will push a brighter version in the next pass.',
        createdAt: '2026-03-30T08:45:00Z',
        delivery: 'sent',
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'Jordan Lee',
    status: 'away',
    role: 'Frontend engineer',
    unreadCount: 0,
    updatedAt: '2026-03-29T16:10:00Z',
    lastMessage: 'The route config is ready, I just need to wire the guarded layout.',
    participants: [
      { id: 'me', name: 'Alex Mercer' },
      { id: 'jordan', name: 'Jordan Lee' },
    ],
    messages: [
      {
        id: 'm-4',
        senderId: 'jordan',
        senderName: 'Jordan Lee',
        text: 'The route config is ready, I just need to wire the guarded layout.',
        createdAt: '2026-03-29T16:10:00Z',
        delivery: 'delivered',
      },
      {
        id: 'm-5',
        senderId: 'me',
        senderName: 'Alex Mercer',
        text: 'Perfect. I am polishing the auth screens now.',
        createdAt: '2026-03-29T16:18:00Z',
        delivery: 'read',
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'Design Review',
    status: 'busy',
    role: 'Shared channel',
    unreadCount: 5,
    updatedAt: '2026-03-28T11:30:00Z',
    lastMessage: 'Let us keep the interface lightweight and easy to scan.',
    participants: [{ id: 'channel', name: 'Design Review' }],
    messages: [],
  },
];

export const conversationStatusLabel = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
};
