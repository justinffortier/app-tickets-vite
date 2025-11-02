import { Signal } from '@fyclabs/tools-fyc-react/signals';
import ordersAPI from '@src/api/orders.api';
import { showToast } from '@src/components/global/Alert/_helpers/alert.events';

export const $sales = Signal({
  orders: [],
  isLoading: false,
});

export const loadSales = async (eventId) => {
  try {
    $sales.loadingStart();
    const data = await ordersAPI.getByEventId(eventId);
    $sales.update({ orders: data || [] });
  } catch (error) {
    console.error('Error loading sales:', error);
    showToast('Error loading sales data', 'error');
  } finally {
    $sales.loadingEnd();
  }
};
