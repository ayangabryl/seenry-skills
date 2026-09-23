// Application-neutral presentation state. No timers, DOM or operation-success claims.
export function createNotificationState(limit = 3) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('limit must be a positive integer');
  return { limit, sequence: 0, items: [], leaving: null };
}
export function notificationEvent(state, event) {
  switch (event.type) {
    case 'add': {
      const item = { id: state.sequence + 1, content: event.content };
      const overflow = state.items.length === state.limit;
      return { ...state, sequence: item.id, items: [item, ...state.items].slice(0, state.limit), leaving: overflow ? { ...state.items.at(-1), index: state.limit - 1 } : state.leaving };
    }
    case 'dismiss': {
      const index = state.items.findIndex(item => item.id === event.id);
      if (index === -1) return state;
      return { ...state, items: state.items.filter(item => item.id !== event.id), leaving: { ...state.items[index], index } };
    }
    case 'exit-finished':
      return state.leaving?.id === event.id ? { ...state, leaving: null } : state;
    case 'clear':
      return { ...state, items: [], leaving: null };
    default: throw new TypeError('Unknown notification event');
  }
}
