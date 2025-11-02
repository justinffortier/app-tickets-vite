import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import { useEffectAsync } from '@fyclabs/tools-fyc-react/utils';
import { $events, $tickets } from '@src/signals';
import Loader from '@src/components/global/Loader';
import TicketsManager from './TicketsManager';
import DiscountsManager from './DiscountsManager';
import FormsManager from './FormsManager';
import SalesManager from './SalesManager';
import { loadEventData, getStatusBadge } from './_helpers/eventDetail.events';
import { $eventForm, loadEvent, handleChange, handleSubmit } from './_helpers/eventForm.events';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = $events.value.current;
  const tickets = $tickets.value.list;
  const loading = $events.value.isLoading;
  const formData = $eventForm.value;
  const formLoading = $eventForm.value.isLoading;

  useEffectAsync(async () => {
    await loadEventData(id);
    await loadEvent(id);
  }, [id]);

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit(e, id, () => { });
    await loadEventData(id);
  };

  if (loading) return <Loader />;
  if (!event) return <div>Event not found</div>;

  return (
    <Container fluid className="py-4">
      <Row className="mb-32">
        <Col>
          <div className="d-flex align-items-center gap-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => navigate('/admin/events')}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Button>
            <div>
              <h2 className="mb-8">{event.title}</h2>
              <div>
                <Badge bg={getStatusBadge(event.status).variant}>
                  {getStatusBadge(event.status).text}
                </Badge>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Tabs defaultActiveKey="basic" className="mb-24">
            <Tab eventKey="basic" title="Basic Info">
              <Card>
                <Card.Body>
                  <Form onSubmit={handleEventSubmit}>
                    <Form.Group className="mb-24">
                      <Form.Label>Title *</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-24">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-24">
                          <Form.Label>Start Date *</Form.Label>
                          <Form.Control
                            type="datetime-local"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-24">
                          <Form.Label>End Date *</Form.Label>
                          <Form.Control
                            type="datetime-local"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-24">
                      <Form.Label>Location</Form.Label>
                      <Form.Control
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-24">
                      <Form.Label>Image URL</Form.Label>
                      <Form.Control
                        type="url"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                      />
                    </Form.Group>

                    <Form.Group className="mb-24">
                      <Form.Label>Capacity</Form.Label>
                      <Form.Control
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        min="1"
                      />
                      <Form.Text className="text-muted">
                        Leave empty for unlimited capacity
                      </Form.Text>
                    </Form.Group>

                    <Button type="submit" variant="primary" disabled={formLoading}>
                      <FontAwesomeIcon icon={faSave} className="me-2" />
                      {formLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="tickets" title="Tickets">
              <TicketsManager eventId={id} tickets={tickets} onUpdate={() => loadEventData(id)} />
            </Tab>

            <Tab eventKey="forms" title="Forms">
              <FormsManager eventId={id} tickets={tickets} onUpdate={() => loadEventData(id)} />
            </Tab>

            <Tab eventKey="discounts" title="Discount Codes">
              <DiscountsManager eventId={id} />
            </Tab>

            <Tab eventKey="sales" title="Sales">
              <SalesManager eventId={id} />
            </Tab>
          </Tabs>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Body>
              <h5 className="mb-24">Quick Stats</h5>
              <div className="mb-24">
                <div className="text-muted small">Total Tickets</div>
                <div className="h4 mb-0">{tickets.length}</div>
              </div>
              <div className="mb-24">
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
