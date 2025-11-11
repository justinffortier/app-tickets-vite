import { Card, Spinner, Row, Col } from 'react-bootstrap';

const CardLoader = ({
  message = 'Loading payment form...',
  className = '',
  variant = 'spinner',
}) => {
  if (variant === 'skeleton') {
    return (
      <div className={className}>
        {/* Cardholder Name Field */}
        <div className="mb-24">
          <div className="placeholder-glow">
            <span className="placeholder col-3 mb-2 d-block" />
            <span className="placeholder col-12" style={{ height: '38px', display: 'block', borderRadius: '0.375rem' }} />
          </div>
        </div>

        {/* Credit Card Number Field */}
        <div className="mb-24">
          <div className="placeholder-glow">
            <span className="placeholder col-4 mb-2 d-block" />
            <span className="placeholder col-12" style={{ height: '38px', display: 'block', borderRadius: '0.375rem' }} />
          </div>
        </div>

        {/* Expiration and CVV Row */}
        <Row>
          <Col md={6}>
            <div className="mb-24">
              <div className="placeholder-glow">
                <span className="placeholder col-6 mb-2 d-block" />
                <span className="placeholder col-12" style={{ height: '38px', display: 'block', borderRadius: '0.375rem' }} />
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-24">
              <div className="placeholder-glow">
                <span className="placeholder col-4 mb-2 d-block" />
                <span className="placeholder col-12" style={{ height: '38px', display: 'block', borderRadius: '0.375rem' }} />
              </div>
            </div>
          </Col>
        </Row>

        {/* Submit Button */}
        <div className="d-grid">
          <div className="placeholder-glow">
            <span className="placeholder col-12 btn btn-lg" style={{ height: '48px', display: 'block', borderRadius: '0.375rem' }} />
          </div>
        </div>

        {/* Processing Message */}
        {message && (
          <div className="text-center mt-24 text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <Card.Body className="text-center py-5">
        <Spinner animation="border" role="status" variant="primary" className="mb-24">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <div className="text-muted">{message}</div>
      </Card.Body>
    </Card>
  );
};

export default CardLoader;
