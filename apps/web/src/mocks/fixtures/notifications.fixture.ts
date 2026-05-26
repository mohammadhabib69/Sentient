export const MOCK_NOTIFICATIONS = Array.from({ length: 10 }).map((_, i) => {
  const isUnread = i < 3 // First 3 are unread
  const isApproval = i % 4 === 0
  
  return {
    id: `notif_${i}`,
    userId: 'usr_1',
    type: isApproval ? 'approval_required' : 'mention',
    title: isApproval ? 'High Risk Action Blocked' : 'You were mentioned in a task',
    body: isApproval 
      ? 'Agent Nova requires approval for Execute Refund (INV-2039).'
      : 'Alex P. mentioned you in "Design API schema".',
    isRead: !isUnread,
    actionUrl: isApproval ? '/agents' : '/projects/proj_1/board',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * i).toISOString(),
  }
})
