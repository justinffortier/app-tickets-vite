import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import UniversalInput from '@src/components/global/Inputs/UniversalInput';
import Password from '@src/components/global/Inputs/Password';
import { $signupForm, $signupUI, handleSubmit, handleGoogleSignIn } from './_helpers/signup.events';

const Signup = () => {
  const navigate = useNavigate();
  const { isLoading } = $signupUI.value;
  const { showVerificationMessage } = $signupUI.value;

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
                      onClick={() => handleGoogleSignIn(navigate)}
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
