import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import UniversalInput from '@src/components/global/Inputs/UniversalInput';
import Password from '@src/components/global/Inputs/Password';
import { createNewUser, signInWithGoogle } from '@src/utils/auth';
import { $alert } from '@src/signals';
import { Signal } from '@fyclabs/tools-fyc-react/signals';

const $signupForm = Signal({
  email: '',
  password: '',
  confirmPassword: ''
});

const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const validateForm = () => {
    const { email, password, confirmPassword } = $signupForm.value;

    if (!email || !password || !confirmPassword) {
      $alert.update({
        message: 'Please fill in all fields',
        variant: 'danger',
      });
      return false;
    }

    if (password.length < 6) {
      $alert.update({
        message: 'Password must be at least 6 characters long',
        variant: 'danger',
      });
      return false;
    }

    if (password !== confirmPassword) {
      $alert.update({
        message: 'Passwords do not match',
        variant: 'danger',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { email, password } = $signupForm.value;
      await createNewUser(email, password);

      setShowVerificationMessage(true);
      $alert.update({
        message: 'Account created successfully! Please check your email to verify your account.',
        variant: 'success',
      });

      // Clear the form
      $signupForm.reset();

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      let errorMessage = 'Failed to create account. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      }

      $alert.update({
        message: errorMessage,
        variant: 'danger',
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();

      $alert.update({
        message: 'Successfully signed up with Google!',
        variant: 'success',
      });

      navigate('/admin');
    } catch (error) {
      $alert.update({
        message: error.message || 'Failed to sign up with Google.',
        variant: 'danger',
      });
      setIsLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Row className="w-100">
        <Col xs={12} md={6} lg={5} xl={4} className="mx-auto">
          <Card className="shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-32">Sign Up</h2>

              {showVerificationMessage && (
                <Alert variant="info" className="mb-24">
                  <strong>Email Verification Sent!</strong>
                  <p className="mb-0 mt-16 small">
                    We've sent a verification email to your address.
                    Please verify your email before logging in.
                  </p>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-24">
                  <Form.Label>Email</Form.Label>
                  <UniversalInput
                    type="email"
                    name="email"
                    signal={$signupForm}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={isLoading || showVerificationMessage}
                  />
                </Form.Group>

                <Form.Group className="mb-24">
                  <Form.Label>Password</Form.Label>
                  <Password
                    name="password"
                    signal={$signupForm}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    disabled={isLoading || showVerificationMessage}
                  />
                  <Form.Text className="text-muted small">
                    Password must be at least 6 characters long
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-24">
                  <Form.Label>Confirm Password</Form.Label>
                  <Password
                    name="confirmPassword"
                    signal={$signupForm}
                    placeholder="Confirm your password"
                    passwordToMatch={$signupForm.value.password}
                    autoComplete="new-password"
                    disabled={isLoading || showVerificationMessage}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mb-24"
                  disabled={isLoading || showVerificationMessage}
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </Button>

                {!showVerificationMessage && (
                  <>
                    <div className="text-center mb-24">
                      <span className="text-muted">or</span>
                    </div>

                    <Button
                      variant="outline-secondary"
                      className="w-100 mb-24"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <FontAwesomeIcon icon={faGoogle} className="me-2" />
                      Sign up with Google
                    </Button>
                  </>
                )}

                <div className="text-center">
                  <span className="text-muted">Already have an account? </span>
                  <Link to="/login" className="text-decoration-none">
                    Login
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

export default Signup;

