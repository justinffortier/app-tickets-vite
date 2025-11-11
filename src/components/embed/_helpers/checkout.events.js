import { $checkout } from '@src/signals';
import paymentsAPI from '@src/api/payments.api';
import { isProcessingPayment, showTestCards } from './checkout.consts';

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

    // Confirm payment with backend - this must succeed before we redirect
    await paymentsAPI.confirmPayment(order.id, paymentData);

    // Only proceed with redirect logic if confirmPayment succeeded
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
    // Only update to completed status after successful confirmation
    $checkout.update({
      paymentStatus: 'completed',
    });

    // Only redirect after payment was successfully confirmed
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 2000);
  } catch (err) {
    // Payment confirmation failed - show clear error message
    const errorMessage = err.message || 'Payment confirmation failed. Please contact support if you were charged.';
    $checkout.update({
      error: errorMessage,
      paymentStatus: 'failed',
    });
    isProcessingPayment.value = false;
  } finally {
    // Only reset processing state if not embedded and not in completed status
    if (!$checkout.value.isEmbedded && $checkout.value.paymentStatus !== 'completed') {
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

export const toggleTestCards = () => {
  showTestCards.value = !showTestCards.value;
};
