import { useParams } from 'react-router-dom';
import { Card, Alert, Container, Row, Col, Button, Form } from 'react-bootstrap';
import { useEffectAsync } from '@fyclabs/tools-fyc-react/utils';
import { AccruPay, form } from 'accru-pay-react';
import { $checkout } from '@src/signals';
import Loader from '@src/components/global/Loader';
import { useState } from 'react';
import paymentsAPI from '@src/api/payments.api';
import * as resolvers from './_helpers/checkout.resolvers';
import * as events from './_helpers/checkout.events';
import { isProcessingPayment } from './_helpers/checkout.consts';

const PAYMENT_PROCESSOR = 'nuvei';

function CreditCardForm() {
  const AccruPaymentForm = form(PAYMENT_PROCESSOR);
  const { order } = $checkout.value;

  return (
    <Form>
      <Form.Group className="mb-24" controlId="cardholderName">
        <Form.Label>Cardholder Name</Form.Label>
        <AccruPaymentForm.CardHolderName
          className="form-control"
          placeholder="Enter cardholder name"
        />
      </Form.Group>

      <Form.Group className="mb-24" controlId="cardNumber">
        <Form.Label>Credit Card Number</Form.Label>
        <div className="form-control">
          <AccruPaymentForm.CreditCardNumber />
        </div>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-24" controlId="cardExpiration">
            <Form.Label>Expiration Date</Form.Label>
            <div className="form-control">
              <AccruPaymentForm.CreditCardExpiration />
            </div>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-24" controlId="cardCvc">
            <Form.Label>CVV</Form.Label>
            <div className="form-control">
              <AccruPaymentForm.CreditCardCvc />
            </div>
          </Form.Group>
        </Col>
      </Row>

      <div className="d-grid">
        <AccruPaymentForm.SubmitBtn
          className="btn btn-primary btn-lg"
          text={`Pay $${parseFloat(order.total).toFixed(2)}`}
          onSubmit={() => {
            isProcessingPayment.value = true;
          }}
          onSuccess={events.handlePaymentSuccess}
          onError={events.handlePaymentError}
          onComplete={() => {
            isProcessingPayment.value = false;
          }}
          disabled={isProcessingPayment.value}
        />
      </div>
    </Form>
  );
}

function Checkout() {
  const { orderId } = useParams();
  const { order, error, paymentStatus, paymentSession } = $checkout.value;
  const { isLoading } = $checkout.value;
  const theme = $checkout.value.form?.theme || 'light';
  const [providers, setProviders] = useState(null);

  // Fetch providers configuration from AccruPay
  useEffectAsync(async () => {
    try {
      const providersData = await paymentsAPI.getProviders();
      setProviders(providersData);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      // Set fallback empty config if fetch fails
      setProviders([{ name: 'nuvei', config: {} }]);
    }
  }, []);

  // Function to get providers configuration for AccruPay React SDK
  const getProviders = () => {
    if (!providers) {
      console.log('Providers not loaded yet, returning empty array');
      return [];
    }
    console.log('Returning providers:', providers);
    return providers;
  };

  useEffectAsync(() => {
    document.body.className = '';
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

  const renderOrderSummary = () => {
    if (!order) return null;

    return (
      <Card className="mb-24">
        <Card.Body>
          <h5 className="mb-24">Order Summary</h5>

          <div className="mb-24">
            <strong>Event:</strong> {order.events?.title || 'N/A'}
          </div>

          <div className="mb-24">
            <strong>Customer:</strong>
            <div>{order.customer_name || 'Guest'}</div>
            <div className="text-muted">{order.customer_email}</div>
          </div>

          <div className="mb-24">
            <strong>Tickets:</strong>
            {order.order_items?.map((item, index) => (
              <div key={index} className="d-flex justify-content-between mt-8">
                <span>
                  {item.ticket_types?.name || 'Ticket'} x {item.quantity}
                </span>
                <span>${parseFloat(item.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-top pt-16 mt-16">
            <div className="d-flex justify-content-between mb-8">
              <span>Subtotal:</span>
              <strong>${parseFloat(order.subtotal).toFixed(2)}</strong>
            </div>

            {order.discount_amount > 0 && (
              <div className="d-flex justify-content-between mb-8 text-success">
                <span>Discount ({order.discount_codes?.code}):</span>
                <strong>-${parseFloat(order.discount_amount).toFixed(2)}</strong>
              </div>
            )}

            <div className="d-flex justify-content-between pt-16 border-top">
              <strong>Total:</strong>
              <strong className="text-primary">
                ${parseFloat(order.total).toFixed(2)}
              </strong>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const renderPaymentStatus = () => {
    if (paymentStatus === 'completed') {
      return (
        <Alert variant="success">
          <Alert.Heading>Payment Successful!</Alert.Heading>
          <p>
            Your payment has been processed successfully. You will receive a confirmation
            email shortly at {order?.customer_email}.
          </p>
          <p className="mb-0">Redirecting to confirmation page...</p>
        </Alert>
      );
    }

    if (paymentStatus === 'failed') {
      return (
        <Alert variant="danger">
          <Alert.Heading>Payment Failed</Alert.Heading>
          <p>{error || 'There was an error processing your payment.'}</p>
          <Button variant="danger" onClick={events.retryPayment}>
            Try Again
          </Button>
        </Alert>
      );
    }

    if (paymentStatus === 'cancelled') {
      return (
        <Alert variant="warning">
          <Alert.Heading>Payment Cancelled</Alert.Heading>
          <p>You cancelled the payment process.</p>
          <Button variant="primary" onClick={events.retryPayment}>
            Resume Payment
          </Button>
        </Alert>
      );
    }

    return null;
  };

  if (isLoading) return <Loader />;

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
        {renderOrderSummary()}
      </Container>
    );
  }

  return (
    <Container className={`py-5 ${theme}`} style={{ maxWidth: '800px' }}>
      {error && <Alert variant="danger" className="mb-24">{error}</Alert>}

      {renderPaymentStatus()}

      <Row>
        <Col md={12}>
          {renderOrderSummary()}

          {order && paymentSession && !paymentStatus && (
            <Card>
              <Card.Body>
                <h5 className="mb-24">Payment Information</h5>
                {paymentSession.sessionToken ? (
                  <AccruPay
                    sessionToken={paymentSession.sessionToken}
                    preferredProvider={PAYMENT_PROCESSOR}
                    preReleaseGetProviders={() => [
                      {
                        name: 'nuvei',
                        config: {
                          provider: 'NUVEI',
                          merchantId: '5316846880324403100',
                          merchantSiteId: '241418',
                          environment: 'int',
                          __typename: 'MerchantClientTransactionNuveiPreSessionData',
                        },
                      },
                    ]}
                  >
                    <CreditCardForm />
                  </AccruPay>
                ) : (
                  <Alert variant="warning">
                    Payment session could not be initialized. Please contact support.
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
