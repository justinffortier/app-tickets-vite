import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import UniversalInput from '@src/components/global/Inputs/UniversalInput';
import Password from '@src/components/global/Inputs/Password';
import { $loginForm, $loginUI, handleSubmit, handleGoogleSignIn } from './_helpers/login.events';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoading } = $loginUI.value;
  const redirectPath = searchParams.get('redirect') || '/admin';

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Row className="w-100">
        <Col xs={12} md={6} lg={5} xl={4} className="mx-auto">
          <Card className="shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-32">Login</h2>

              <Form onSubmit={(e) => handleSubmit(e, navigate, redirectPath)}>
                <Form.Group className="mb-24">
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

                <Form.Group className="mb-24">
                  <Form.Label>Password</Form.Label>
                  <Password
                    name="password"
                    signal={$loginForm}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center mb-24">
                  <Link to="/forgot-password" className="text-decoration-none small">
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mb-24"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>

                <div className="text-center mb-24">
                  <span className="text-muted">or</span>
                </div>

                <Button
                  variant="outline-secondary"
                  className="w-100 mb-24"
                  onClick={() => handleGoogleSignIn(navigate, redirectPath)}
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
