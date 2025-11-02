import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import UniversalInput from '@src/components/global/Inputs/UniversalInput';
import { $forgotPasswordForm, $forgotPasswordUI, handleSubmit } from './_helpers/forgotPassword.events';

const ForgotPassword = () => {
  const { isLoading } = $forgotPasswordUI.value;
  const { emailSent } = $forgotPasswordUI.value;

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Row className="w-100">
        <Col xs={12} md={6} lg={5} xl={4} className="mx-auto">
          <Card className="shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-32">Reset Password</h2>

              {emailSent && (
                <Alert variant="success" className="mb-24">
                  <strong>Email Sent!</strong>
                  <p className="mb-0 mt-16 small">
                    We've sent a password reset link to your email address.
                    Please check your inbox and follow the instructions.
                  </p>
                </Alert>
              )}

              <p className="text-muted text-center mb-32">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-24">
                  <Form.Label>Email</Form.Label>
                  <UniversalInput
                    type="email"
                    name="email"
                    signal={$forgotPasswordForm}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mb-24"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-decoration-none">
                    Back to Login
                  </Link>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPassword;
