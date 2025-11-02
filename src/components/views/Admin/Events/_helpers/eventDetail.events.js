import { $events, $tickets } from '@src/signals';
import eventsAPI from '@src/api/events.api';
import ticketsAPI from '@src/api/tickets.api';

export const loadEventData = async (id) => {
  try {
    $events.loadingStart();
    const [eventData, ticketsData] = await Promise.all([
      eventsAPI.getById(id),
      ticketsAPI.getByEventId(id),
    ]);
    $events.update({ current: eventData });
    $tickets.update({ list: ticketsData });
  } catch (error) {
    console.error('Error loading event:', error);
  } finally {
    $events.loadingEnd();
  }
};

export const getStatusBadge = (status) => {
  const variants = {
    DRAFT: 'secondary',
    PUBLISHED: 'success',
    CANCELLED: 'danger',
  };
  return { variant: variants[status] || 'secondary', text: status };
};
