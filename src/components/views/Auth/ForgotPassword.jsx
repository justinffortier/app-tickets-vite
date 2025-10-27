import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import UniversalInput from '@src/components/global/Inputs/UniversalInput';
import { sendPasswordResetEmail } from '@src/utils/auth';
import { $alert } from '@src/signals';
import { Signal } from '@fyclabs/tools-fyc-react/signals';

const $forgotPasswordForm = Signal({ email: '' });

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { email } = $forgotPasswordForm.value;

      if (!email) {
        $alert.update({
          message: 'Please enter your email address',
          variant: 'danger',
        });
        setIsLoading(false);
        return;
      }

      await sendPasswordResetEmail(email);

      setEmailSent(true);
      $alert.update({
        message: 'Password reset email sent! Please check your inbox.',
        variant: 'success',
      });

      // Clear the form
      $forgotPasswordForm.reset();
    } catch (error) {
      let errorMessage = 'Failed to send password reset email. Please try again.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }

      $alert.update({
        message: errorMessage,
        variant: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

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

