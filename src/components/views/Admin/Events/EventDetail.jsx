import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import eventsAPI from '@src/api/events.api';
import ticketsAPI from '@src/api/tickets.api';
import Loader from '@src/components/global/Loader';
import TicketsManager from './TicketsManager';
import DiscountsManager from './DiscountsManager';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventData();
  }, [id]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const [eventData, ticketsData] = await Promise.all([
        eventsAPI.getById(id),
        ticketsAPI.getByEventId(id),
      ]);
      setEvent(eventData);
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      DRAFT: 'secondary',
      PUBLISHED: 'success',
      CANCELLED: 'danger',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) return <Loader />;
  if (!event) return <div>Event not found</div>;

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigate('/admin/events')}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </Button>
              <div>
                <h2 className="mb-1">{event.title}</h2>
                <div>{getStatusBadge(event.status)}</div>
              </div>
            </div>
            <Link to={`/admin/events/${id}/edit`}>
              <Button variant="primary">
                <FontAwesomeIcon icon={faEdit} className="me-2" />
                Edit Event
              </Button>
            </Link>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Event Details</h5>
              {event.description && (
                <p className="text-muted">{event.description}</p>
              )}
              <Row className="mt-3">
                <Col md={6}>
                  <strong>Start:</strong> {format(new Date(event.start_date), 'PPpp')}
                </Col>
                <Col md={6}>
                  <strong>End:</strong> {format(new Date(event.end_date), 'PPpp')}
                </Col>
              </Row>
              {event.location && (
                <div className="mt-2">
                  <strong>Location:</strong> {event.location}
                </div>
              )}
              {event.capacity && (
                <div className="mt-2">
                  <strong>Capacity:</strong> {event.capacity}
                </div>
              )}
            </Card.Body>
          </Card>

          <Tabs defaultActiveKey="tickets" className="mb-3">
            <Tab eventKey="tickets" title="Tickets">
              <TicketsManager eventId={id} tickets={tickets} onUpdate={loadEventData} />
            </Tab>
            <Tab eventKey="discounts" title="Discount Codes">
              <DiscountsManager eventId={id} />
            </Tab>
            <Tab eventKey="forms" title="Forms">
              <Card>
                <Card.Body className="text-center py-5">
                  <p className="text-muted">Form builder coming soon</p>
                  <Link to={`/admin/forms/new?event=${id}`}>
                    <Button variant="primary">Create Form</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Quick Stats</h5>
              <div className="mb-3">
                <div className="text-muted small">Total Tickets</div>
                <div className="h4 mb-0">{tickets.length}</div>
              </div>
              <div className="mb-3">
                <div className="text-muted small">Tickets Sold</div>
                <div className="h4 mb-0">
                  {tickets.reduce((sum, t) => sum + (t.sold || 0), 0)}
                </div>
              </div>
              <div>
                <div className="text-muted small">Revenue</div>
                <div className="h4 mb-0">
                  ${tickets.reduce((sum, t) => sum + (t.sold || 0) * parseFloat(t.price || 0), 0).toFixed(2)}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default EventDetail;
