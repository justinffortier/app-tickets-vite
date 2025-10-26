import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faTicket, faFileAlt, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import eventsAPI from '@src/api/events.api';
import formsAPI from '@src/api/forms.api';
import ordersAPI from '@src/api/orders.api';

function Dashboard() {
  const [stats, setStats] = useState({
    events: 0,
    forms: 0,
    orders: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [events, forms, orders] = await Promise.all([
        eventsAPI.getAll(),
        formsAPI.getAll(),
        ordersAPI.getAll(),
      ]);

      const revenue = orders
        .filter((o) => o.status === 'PAID')
        .reduce((sum, o) => sum + parseFloat(o.total), 0);

      setStats({
        events: events.length,
        forms: forms.length,
        orders: orders.length,
        revenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Dashboard</h2>
          <p className="text-muted">Headless Ticketing Platform</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FontAwesomeIcon icon={faCalendar} size="2x" className="text-primary mb-3" />
              <h3 className="mb-1">{stats.events}</h3>
              <p className="text-muted mb-0">Events</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FontAwesomeIcon icon={faFileAlt} size="2x" className="text-success mb-3" />
              <h3 className="mb-1">{stats.forms}</h3>
              <p className="text-muted mb-0">Forms</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FontAwesomeIcon icon={faShoppingCart} size="2x" className="text-info mb-3" />
              <h3 className="mb-1">{stats.orders}</h3>
              <p className="text-muted mb-0">Orders</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <FontAwesomeIcon icon={faTicket} size="2x" className="text-warning mb-3" />
              <h3 className="mb-1">${stats.revenue.toFixed(2)}</h3>
              <p className="text-muted mb-0">Revenue</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <h5 className="mb-3">Quick Actions</h5>
              <div className="d-flex flex-column gap-2">
                <Link to="/admin/events/new">
                  <Button variant="outline-primary" className="w-100">
                    Create New Event
                  </Button>
                </Link>
                <Link to="/admin/forms/new">
                  <Button variant="outline-success" className="w-100">
                    Create New Form
                  </Button>
                </Link>
                <Link to="/admin/events">
                  <Button variant="outline-secondary" className="w-100">
                    View All Events
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <h5 className="mb-3">Getting Started</h5>
              <ol className="mb-0">
                <li className="mb-2">Create your first event</li>
                <li className="mb-2">Add ticket types and pricing</li>
                <li className="mb-2">Build a custom registration form</li>
                <li className="mb-2">Publish and get your embed code</li>
                <li>Start selling tickets!</li>
              </ol>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;
