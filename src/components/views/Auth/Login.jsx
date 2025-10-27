import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import UniversalInput from '@src/components/global/Inputs/UniversalInput';
import Password from '@src/components/global/Inputs/Password';
import { signIn, signInWithGoogle } from '@src/utils/auth';
import { $alert } from '@src/signals';
import { Signal } from '@fyclabs/tools-fyc-react/signals';

const $loginForm = Signal({ email: '', password: '' });

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const redirectPath = searchParams.get('redirect') || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { email, password } = $loginForm.value;

      if (!email || !password) {
        $alert.update({
          message: 'Please enter both email and password',
          variant: 'danger',
        });
        setIsLoading(false);
        return;
      }

      await signIn(email, password);

      $alert.update({
        message: 'Successfully logged in!',
        variant: 'success',
      });

      navigate(redirectPath);
    } catch (error) {
      $alert.update({
        message: error.message || 'Failed to log in. Please check your credentials.',
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
        message: 'Successfully logged in with Google!',
        variant: 'success',
      });

      navigate(redirectPath);
    } catch (error) {
      $alert.update({
        message: error.message || 'Failed to log in with Google.',
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
              <h2 className="text-center mb-4">Login</h2>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <UniversalInput
                    type="email"
                    name="email"
                    signal={$loginForm}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Password
                    name="password"
                    signal={$loginForm}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Link to="/forgot-password" className="text-decoration-none small">
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mb-3"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>

                <div className="text-center mb-3">
                  <span className="text-muted">or</span>
                </div>

                <Button
                  variant="outline-secondary"
                  className="w-100 mb-3"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon icon={faGoogle} className="me-2" />
                  Sign in with Google
                </Button>

                <div className="text-center">
                  <span className="text-muted">Don't have an account? </span>
                  <Link to="/signup" className="text-decoration-none">
                    Sign up
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

export default Login;

