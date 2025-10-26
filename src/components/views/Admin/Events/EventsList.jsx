import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import eventsAPI from '@src/api/events.api';
import Loader from '@src/components/global/Loader';
import { showToast } from '@src/components/global/Alert/_helpers/alert.events';

function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsAPI.getAll();
      setEvents(data);
    } catch (error) {
      showToast('Error loading events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventsAPI.delete(id);
      showToast('Event deleted successfully', 'success');
      loadEvents();
    } catch (error) {
      showToast('Error deleting event', 'error');
    }
  };

  const handlePublish = async (id, currentStatus) => {
    try {
      if (currentStatus === 'PUBLISHED') {
        await eventsAPI.unpublish(id);
        showToast('Event unpublished', 'success');
      } else {
        await eventsAPI.publish(id);
        showToast('Event published successfully', 'success');
      }
      loadEvents();
    } catch (error) {
      showToast('Error updating event status', 'error');
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

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Events</h2>
            <Link to="/admin/events/new">
              <Button variant="primary">
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Create Event
              </Button>
            </Link>
          </div>
        </Col>
      </Row>

      {events.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <p className="text-muted mb-3">No events yet</p>
            <Link to="/admin/events/new">
              <Button variant="primary">Create Your First Event</Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <strong>{event.title}</strong>
                    </td>
                    <td>
                      {format(new Date(event.start_date), 'MMM d, yyyy')}
                    </td>
                    <td>{event.location || '-'}</td>
                    <td>{getStatusBadge(event.status)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link to={`/admin/events/${event.id}`}>
                          <Button size="sm" variant="outline-primary">
                            <FontAwesomeIcon icon={faEye} />
                          </Button>
                        </Link>
                        <Link to={`/admin/events/${event.id}/edit`}>
                          <Button size="sm" variant="outline-secondary">
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant={event.status === 'PUBLISHED' ? 'outline-warning' : 'outline-success'}
                          onClick={() => handlePublish(event.id, event.status)}
                        >
                          {event.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(event.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default EventsList;
