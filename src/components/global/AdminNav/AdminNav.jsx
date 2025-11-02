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
    <Navbar bg="grey-900" expand="lg" className="mb-32 border-bottom">
      <Container fluid>
        <Navbar.Brand as={Link} to="/admin">
          <img src="/logo-white.svg" alt="Logo" className="me-2" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="admin-navbar-nav" />
        <Navbar.Collapse id="admin-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/admin">
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/events">
              Events
            </Nav.Link>
          </Nav>
          <Nav>
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-secondary" id="user-dropdown">
                <FontAwesomeIcon icon={faUser} className="me-2" />
                {$user.value?.email || 'Account'}
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
