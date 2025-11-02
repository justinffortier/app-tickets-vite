import { $events, $view } from '@src/signals';
import eventsAPI from '@src/api/events.api';
import { showToast } from '@src/components/global/Alert/_helpers/alert.events';

export const loadEvents = async () => {
  try {
    $events.loadingStart();
    $view.update({ isTableLoading: true });
    const data = await eventsAPI.getAll();
    $events.update({ list: data });
  } catch (error) {
    showToast('Error loading events', 'error');
  } finally {
    $events.loadingEnd();
    $view.update({ isTableLoading: false });
  }
};

export const handleDelete = async (e, id) => {
  e.stopPropagation();
  if (!window.confirm('Are you sure you want to delete this event?')) return;

  try {
    await eventsAPI.delete(id);
    showToast('Event deleted successfully', 'success');
    loadEvents();
  } catch (error) {
    showToast('Error deleting event', 'error');
  }
};

export const handlePublish = async (e, id, currentStatus) => {
  e.stopPropagation();
  try {
    if (currentStatus === 'PUBLISHED') {
      await eventsAPI.unpublish(id);
      showToast('Event unpublished', 'success');
    } else {
      await eventsAPI.publish(id);
      showToast('Event published successfully', 'success');
    }
    loadEvents();
  } catch (error) {
    showToast('Error updating event status', 'error');
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
