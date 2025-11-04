import { $checkout } from '@src/signals';
import ordersAPI from '@src/api/orders.api';
import paymentsAPI from '@src/api/payments.api';

export const loadOrderData = async (orderId) => {
  try {
    $checkout.loadingStart();
    $checkout.update({ error: null });

    const orderData = await ordersAPI.getById(orderId);

    if (!orderData) {
      throw new Error('Order not found');
    }

    if (orderData.status === 'PAID') {
      $checkout.update({
        order: orderData,
        paymentStatus: 'completed',
      });
      return;
    }

    if (orderData.status === 'CANCELLED') {
      throw new Error('This order has been cancelled');
    }

    // Extract form data from order's form_submissions relationship
    const formData = orderData.form_submissions?.forms || null;

    $checkout.update({ order: orderData, form: formData });
  } catch (err) {
    $checkout.update({ error: err.message || 'Error loading order' });
  } finally {
    $checkout.loadingEnd();
  }
};

export const initializePaymentSession = async (orderId) => {
  try {
    const sessionData = await paymentsAPI.createPaymentSession(orderId);
    $checkout.update({ paymentSession: sessionData });
    return sessionData;
  } catch (err) {
    $checkout.update({ error: err.message || 'Error initializing payment' });
    throw err;
  }
};

export const fetchPaymentSession = async (orderId) => {
  try {
    const sessionData = await paymentsAPI.getPaymentSession(orderId);
    return sessionData;
  } catch (err) {
    $checkout.update({ error: err.message || 'Error fetching payment session' });
    throw err;
  }
};
