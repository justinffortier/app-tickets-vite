import { useParams, useSearchParams } from 'react-router-dom';
import { Card, Alert, Container, Row, Col, Button, Form } from 'react-bootstrap';
import { useEffectAsync } from '@fyclabs/tools-fyc-react/utils';
import { AccruPay, form } from 'accru-pay-react';
import { $checkout } from '@src/signals';
import Loader from '@src/components/global/Loader';
import CardLoader from '@src/components/global/CardLoader';
import { useState } from 'react';
import paymentsAPI from '@src/api/payments.api';
import * as resolvers from './_helpers/checkout.resolvers';
import * as events from './_helpers/checkout.events';
import { isProcessingPayment, showTestCards } from './_helpers/checkout.consts';

const PAYMENT_PROCESSOR = 'nuvei';

function CreditCardForm() {
  const AccruPaymentForm = form(PAYMENT_PROCESSOR);
  const { order } = $checkout.value;

  return (
    <div style={{ position: 'relative' }}>
      {/* Overlay skeleton loader while payment is processing */}
      {isProcessingPayment.value && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'white',
            zIndex: 10,
          }}
        >
          <CardLoader
            variant="skeleton"
            message="Processing payment..."
          />
        </div>
      )}

      {/* Keep form mounted but hidden during processing */}
      <div style={{ opacity: isProcessingPayment.value ? 0 : 1 }}>
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
      </div>
    </div>
  );
}

function Checkout() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const { order, error, paymentStatus, paymentSession } = $checkout.value;
  const { isLoading } = $checkout.value;
  const theme = $checkout.value.form?.theme || 'light';
  const [providers, setProviders] = useState(null);

  // Read confirmationUrl and embed flag from query params
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

  // Fetch providers configuration from AccruPay
  useEffectAsync(async () => {
    try {
      const providersData = await paymentsAPI.getProviders();
      setProviders(providersData);
    } catch (err) {
      // Set fallback empty config if fetch fails
      setProviders([{ name: 'nuvei', config: {} }]);
    }
  }, []);

  // Function to get providers configuration for AccruPay React SDK
  const getProviders = () => {
    if (!providers) {
      return [];
    }
    return providers;
  };

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

  const renderTestCards = () => {
    // Get environment from providers
    const env = providers?.[0]?.config?.env || providers?.[0]?.config?.environment;

    // Only show test cards in dev/sandbox/qa environments
    if (env !== 'int') {
      return null;
    }

    const testCards = [
      {
        scenario: 'Frictionless',
        amount: '>= 150',
        cardHolderName: 'FL-BRW1',
        cardNumber: '4000020951595032',
        expiration: '01/30',
        cvv: '123',
      },
      {
        scenario: 'Challenge',
        amount: '151',
        cardHolderName: 'CL-BRW2',
        cardNumber: '2221008123677736',
        expiration: '01/30',
        cvv: '123',
      },
      {
        scenario: 'non-3DS',
        amount: '10',
        cardHolderName: 'Jane Smith',
        cardNumber: '4000027891380961',
        expiration: '01/30',
        cvv: '123',
      },
    ];

    return (
      <div className="mb-24">
        <Button
          variant="outline-dark"
          size="sm"
          onClick={events.toggleTestCards}
          className="mb-16"
        >
          {showTestCards.value ? 'Hide' : 'Show'} Test Cards
        </Button>

        {showTestCards.value && (
          <Alert variant="info">
            <small className="text-muted d-block mb-16">
              Environment: <strong>{env}</strong>
            </small>
            <div className="table-responsive">
              <table className="table table-sm table-bordered mb-0" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Amount</th>
                    <th>Name</th>
                    <th>CC Number</th>
                    <th>Exp Date</th>
                    <th>CVV</th>
                  </tr>
                </thead>
                <tbody>
                  {testCards.map((card, index) => (
                    <tr key={index}>
                      <td>{card.scenario}</td>
                      <td>{card.amount}</td>
                      <td>
                        <code>{card.cardHolderName}</code>
                      </td>
                      <td>
                        <code>{card.cardNumber}</code>
                      </td>
                      <td>
                        <code>{card.expiration}</code>
                      </td>
                      <td>
                        <code>{card.cvv}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Alert>
        )}
      </div>
    );
  };

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

          {/* Show loader when providers or payment session are loading */}
          {order && order.status === 'PENDING' && !paymentStatus && (!providers || !paymentSession) && (
            <CardLoader message="Initializing payment form..." />
          )}

          {/* Show payment form when everything is ready */}
          {order && providers && paymentSession && !paymentStatus && (
            <Card>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <h5 className="mb-24">Payment Information</h5>
                  </Col>
                  <Col md={8} className="text-end">
                    {renderTestCards()}
                  </Col>
                </Row>
                {paymentSession.sessionToken ? (
                  <AccruPay
                    sessionToken={paymentSession.sessionToken}
                    preferredProvider={PAYMENT_PROCESSOR}
                    preReleaseGetProviders={getProviders}
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
