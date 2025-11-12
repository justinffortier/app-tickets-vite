import { useParams, useSearchParams } from 'react-router-dom';
import { Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { useEffectAsync } from '@fyclabs/tools-fyc-react/utils';
import { AccruPay } from 'accru-pay-react';
import { $checkout } from '@src/signals';
import Loader from '@src/components/global/Loader';
import CardLoader from '@src/components/global/CardLoader';
import { useState } from 'react';
import paymentsAPI from '@src/api/payments.api';
import * as resolvers from './_helpers/checkout.resolvers';
import { providerConfigError, sessionInitError } from './_helpers/checkout.consts';
import CreditCardForm from './_components/CreditCardForm';
import OrderSummary from './_components/OrderSummary';
import PaymentStatus from './_components/PaymentStatus';
import TestCards from './_components/TestCards';

const PAYMENT_PROCESSOR = 'nuvei';

function Checkout() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const { order, error, paymentStatus, paymentSession } = $checkout.value;
  const { isLoading } = $checkout.value;
  const theme = $checkout.value.form?.theme || 'light';
  const [providers, setProviders] = useState(null);

  useEffectAsync(() => {
    const confirmationUrlOverride = searchParams.get('confirmationUrl');
    const isEmbedded = searchParams.get('embed') === 'true';

    if (confirmationUrlOverride) {
      // Decode the URL in case it was encoded
      const decodedUrl = decodeURIComponent(confirmationUrlOverride);
      $checkout.update({ confirmationUrlOverride: decodedUrl });
    }

    if (isEmbedded) {
      $checkout.update({ isEmbedded: true });
    }
  }, [searchParams]);

  useEffectAsync(async () => {
    try {
      providerConfigError.value = null;
      const providersData = await paymentsAPI.getProviders();
      setProviders(providersData);
    } catch (err) {
      // Payment provider configuration could not be loaded
      const errorMsg = 'Unable to load payment provider configuration. Please try refreshing the page.';
      providerConfigError.value = errorMsg;
      $checkout.update({ error: errorMsg });
      // Don't set fallback providers - we need valid config to process payments
    }
  }, []);

  useEffectAsync(async () => {
    if (orderId) {
      await resolvers.loadOrderData(orderId);
    }
  }, [orderId]);

  useEffectAsync(async () => {
    const { order: orderData, paymentSession: currentSession } = $checkout.value;
    if (orderData && orderData.status === 'PENDING' && !currentSession) {
      try {
        let session = await resolvers.fetchPaymentSession(orderId);
        if (!session) {
          session = await resolvers.initializePaymentSession(orderId);
        }
        // Only update if we got a valid session to avoid loops
        if (session) {
          $checkout.update({ paymentSession: session });
        }
      } catch (err) {
        // Error is handled in resolver
      }
    }
  }, [order, orderId]);

  if (isLoading) {
    return (
      <div className="min-vh-100 w-100 d-flex justify-content-center align-items-center">
        <Loader className="text-center" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <Container className={`py-5 ${theme}`} style={{ maxWidth: '800px' }}>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (order?.status === 'PAID') {
    return (
      <Container className={`py-5 ${theme}`} style={{ maxWidth: '800px' }}>
        <Alert variant="info">
          <Alert.Heading>Order Already Paid</Alert.Heading>
          <p>This order has already been paid.</p>
        </Alert>
        <OrderSummary order={order} />
      </Container>
    );
  }

  return (
    <Container className={`py-5 ${theme}`} style={{ maxWidth: '800px' }}>
      {/* Show provider configuration errors */}
      {providerConfigError.value && (
        <Alert variant="danger" className="mb-24">
          <Alert.Heading>Configuration Error</Alert.Heading>
          <p>{providerConfigError.value}</p>
        </Alert>
      )}

      {/* Show session initialization errors */}
      {sessionInitError.value && !providerConfigError.value && (
        <Alert variant="danger" className="mb-24">
          <Alert.Heading>Payment Session Error</Alert.Heading>
          <p>{sessionInitError.value}</p>
        </Alert>
      )}

      {/* Show general errors that aren't provider or session related */}
      {error && !providerConfigError.value && !sessionInitError.value && (
        <Alert variant="danger" className="mb-24">{error}</Alert>
      )}

      <PaymentStatus paymentStatus={paymentStatus} error={error} order={order} />

      <Row>
        <Col md={12}>
          <OrderSummary order={order} />

          {/* Show loader when providers or payment session are loading (and no errors) */}
          {order && order.status === 'PENDING' && !paymentStatus && !providerConfigError.value && !sessionInitError.value && (!providers || !paymentSession) && (
            <CardLoader message="Initializing payment form..." />
          )}

          {/* Show payment form when everything is ready and no critical errors */}
          {order && providers && paymentSession && !paymentStatus && !providerConfigError.value && !sessionInitError.value && (
            <Card>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <h5 className="mb-24">Payment Information</h5>
                  </Col>
                  <Col md={8} className="text-end">
                    <TestCards providers={providers} />
                  </Col>
                </Row>
                {paymentSession.sessionToken ? (
                  <AccruPay
                    sessionToken={paymentSession.sessionToken}
                    preferredProvider={PAYMENT_PROCESSOR}
                    preReleaseGetProviders={() => providers || []}
                  >
                    <CreditCardForm order={order} />
                  </AccruPay>
                ) : (
                  <Alert variant="warning">
                    <Alert.Heading>Session Error</Alert.Heading>
                    <p>Payment session could not be initialized. Please refresh the page or contact support if the problem persists.</p>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Checkout;
