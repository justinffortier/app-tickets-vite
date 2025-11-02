import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useEffectAsync } from '@fyclabs/tools-fyc-react/utils';
import Loader from '@src/components/global/Loader';
import UniversalInput from '@src/components/global/Inputs/UniversalInput';
import { $eventForm, loadEvent, handleSubmit } from './_helpers/eventForm.events';

function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const formData = $eventForm.value;
  const loading = $eventForm.value.isLoading;

  useEffectAsync(async () => {
    if (id) {
      await loadEvent(id);
    } else {
      $eventForm.reset();
    }
  }, [id]);

  if (loading && id) return <Loader />;

  return (
    <Container fluid className="py-4">
      <Row className="mb-32">
        <Col>
          <h2>{id ? 'Edit Event' : 'Create Event'}</h2>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card>
            <Card.Body>
              <Form onSubmit={(e) => handleSubmit(e, id, navigate)}>
                <Form.Group className="mb-24">
                  <Form.Label>Title *</Form.Label>
                  <UniversalInput
                    type="text"
                    name="title"
                    signal={$eventForm}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-24">
                  <Form.Label>Description</Form.Label>
                  <UniversalInput
                    as="textarea"
                    rows={4}
                    name="description"
                    signal={$eventForm}
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-24">
                      <Form.Label>Start Date *</Form.Label>
                      <UniversalInput
                        type="datetime-local"
                        name="start_date"
                        signal={$eventForm}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-24">
                      <Form.Label>End Date *</Form.Label>
                      <UniversalInput
                        type="datetime-local"
                        name="end_date"
                        signal={$eventForm}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-24">
                  <Form.Label>Location</Form.Label>
                  <UniversalInput
                    type="text"
                    name="location"
                    signal={$eventForm}
                  />
                </Form.Group>

                <Form.Group className="mb-24">
                  <Form.Label>Image URL</Form.Label>
                  <UniversalInput
                    type="url"
                    name="image_url"
                    signal={$eventForm}
                    placeholder="https://example.com/image.jpg"
                  />
                </Form.Group>

                <Form.Group className="mb-24">
                  <Form.Label>Capacity</Form.Label>
                  <UniversalInput
                    type="number"
                    name="capacity"
                    signal={$eventForm}
                    min="1"
                  />
                  <Form.Text className="text-muted">
                    Leave empty for unlimited capacity
                  </Form.Text>
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Saving...' : id ? 'Update Event' : 'Create Event'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => navigate('/admin/events')}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default EventForm;
