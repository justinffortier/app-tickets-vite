import { $checkout } from '@src/signals';
import paymentsAPI from '@src/api/payments.api';
import { isProcessingPayment } from './checkout.consts';

// Build URL with order details as query parameters
const buildConfirmationUrl = (baseUrl, order) => {
  // Handle relative URLs and ensure absolute URL for URL constructor
  let absoluteUrl = baseUrl;
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    // If it's a relative URL, prepend current origin
    absoluteUrl = `${window.location.origin}${baseUrl.startsWith('/') ? '' : '/'}${baseUrl}`;
  }

  const url = new URL(absoluteUrl);

  // Add all order details as query parameters
  url.searchParams.set('orderId', order.id);
  url.searchParams.set('customerEmail', order.customer_email || '');
  url.searchParams.set('customerName', order.customer_name || '');
  url.searchParams.set('total', order.total?.toString() || '0');
  url.searchParams.set('subtotal', order.subtotal?.toString() || '0');
  url.searchParams.set('discountAmount', order.discount_amount?.toString() || '0');
  url.searchParams.set('status', order.status || '');
  url.searchParams.set('eventTitle', order.events?.title || '');
  url.searchParams.set('discountCode', order.discount_codes?.code || '');
  url.searchParams.set('createdAt', order.created_at || '');
  url.searchParams.set('paymentIntentId', order.payment_intent_id || '');

  // Serialize order items as JSON string
  if (order.order_items && order.order_items.length > 0) {
    const itemsData = order.order_items.map(item => ({
      ticketTypeName: item.ticket_types?.name || '',
      quantity: item.quantity,
      unitPrice: item.unit_price?.toString() || '0',
      subtotal: item.subtotal?.toString() || '0',
    }));
    url.searchParams.set('orderItems', JSON.stringify(itemsData));
  }

  return url.toString();
};

export const handlePaymentSuccess = async (paymentData) => {
  try {
    isProcessingPayment.value = true;
    $checkout.update({ error: null });

    const { order, form, confirmationUrlOverride, isEmbedded } = $checkout.value;

    await paymentsAPI.confirmPayment(order.id, paymentData);
    let redirectUrl;

    if (confirmationUrlOverride) {
      // Use query parameter override
      redirectUrl = buildConfirmationUrl(confirmationUrlOverride, order);
    } else if (form?.order_confirmation_url) {
      // Use form's configured URL
      redirectUrl = buildConfirmationUrl(form.order_confirmation_url, order);
    } else {
      // Default fallback
      redirectUrl = `/embed/order-confirmation/${order.id}`;
    }

    // Prepare order details for the event
    const orderDetails = {
      orderId: order.id,
      customerEmail: order.customer_email || '',
      customerName: order.customer_name || '',
      total: order.total?.toString() || '0',
      subtotal: order.subtotal?.toString() || '0',
      discountAmount: order.discount_amount?.toString() || '0',
      status: order.status || '',
      eventTitle: order.events?.title || '',
      discountCode: order.discount_codes?.code || '',
      createdAt: order.created_at || '',
      paymentIntentId: order.payment_intent_id || '',
      orderItems: order.order_items?.map(item => ({
        ticketTypeName: item.ticket_types?.name || '',
        quantity: item.quantity,
        unitPrice: item.unit_price?.toString() || '0',
        subtotal: item.subtotal?.toString() || '0',
      })) || [],
    };

    // Emit postMessage event to parent window if in iframe
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'order-complete',
        redirectUrl,
        orderDetails,
        order, // Include full order object for convenience
      }, '*'); // In production, you might want to specify the origin
    }

    if (isEmbedded) {
      // When embedded, don't update UI - just let parent handle redirect
      // Keep the processing state so iframe doesn't show success screen
      return;
    }

    // Standalone mode - show success message and redirect
    $checkout.update({
      paymentStatus: 'completed',
    });

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 2000);
  } catch (err) {
    $checkout.update({
      error: err.message || 'Payment confirmation failed',
      paymentStatus: 'failed',
    });
  } finally {
    if (!$checkout.value.isEmbedded) {
      isProcessingPayment.value = false;
    }
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
