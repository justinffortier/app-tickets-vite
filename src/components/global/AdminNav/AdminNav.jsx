import { useNavigate, Link } from 'react-router-dom';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { signOut } from '@src/utils/auth';
import { $global, $auth, $user, $alert } from '@src/signals';

const AdminNav = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      $auth.reset();
      $global.reset();
      $user.reset();

      $alert.update({
        message: 'Logged out successfully!',
        variant: 'success',
      });

      navigate('/login');
    } catch (error) {
      $alert.update({
        message: 'Failed to log out. Please try again.',
        variant: 'danger',
      });
    }
  };

  return (
    <Navbar bg="grey-900" expand="lg" className="mb-32 shadow-sm sticky-top">
      <Container fluid>
        <Navbar.Brand as={Link} to="/admin">
          <img src="/logo.svg" alt="Logo" className="me-2" width={150} />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="admin-navbar-nav" />
        <Navbar.Collapse id="admin-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/admin" className="me-5">
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/events">
              Events
            </Nav.Link>
          </Nav>
          <Nav className="ms-4">
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" id="user-dropdown" className="text-light text-decoration-none">
                <FontAwesomeIcon icon={faUser} className="me-2" />
                <small>{$user.value?.email || 'Account'}</small>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AdminNav;
