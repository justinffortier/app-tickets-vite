import { $checkout } from '@src/signals';
import paymentsAPI from '@src/api/payments.api';
import { isProcessingPayment } from './checkout.consts';

export const handlePaymentSuccess = async (paymentData) => {
  try {
    isProcessingPayment.value = true;
    $checkout.update({ error: null });

    const { order } = $checkout.value;

    console.log('Payment success callback received:', paymentData);
    console.log('Order ID:', order.id);

    // Confirm payment with backend
    await paymentsAPI.confirmPayment(order.id, paymentData);

    $checkout.update({
      paymentStatus: 'completed',
    });

    // Redirect to success page or show success message
    setTimeout(() => {
      window.location.href = `/embed/order-confirmation/${order.id}`;
    }, 2000);
  } catch (err) {
    $checkout.update({
      error: err.message || 'Payment confirmation failed',
      paymentStatus: 'failed',
    });
  } finally {
    isProcessingPayment.value = false;
  }
};

export const handlePaymentError = (error) => {
  $checkout.update({
    error: error.message || 'Payment processing failed. Please try again.',
    paymentStatus: 'failed',
  });
  isProcessingPayment.value = false;
};

export const handlePaymentCancel = () => {
  $checkout.update({
    paymentStatus: 'cancelled',
  });
  isProcessingPayment.value = false;
};

export const retryPayment = () => {
  $checkout.update({
    error: null,
    paymentStatus: null,
  });
};
