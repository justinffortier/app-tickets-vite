import { $dashboard } from '@src/signals';
import eventsAPI from '@src/api/events.api';
import formsAPI from '@src/api/forms.api';
import ordersAPI from '@src/api/orders.api';

export const loadStats = async () => {
  try {
    $dashboard.loadingStart();

    const [events, forms, orders] = await Promise.all([
      eventsAPI.getAll(),
      formsAPI.getAll(),
      ordersAPI.getAll(),
    ]);

    const revenue = orders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + parseFloat(o.total), 0);

    $dashboard.update({
      stats: {
        events: events.length,
        forms: forms.length,
        orders: orders.length,
        revenue,
      },
    });
  } catch (error) {
    console.error('Error loading stats:', error);
  } finally {
    $dashboard.loadingEnd();
  }
};
