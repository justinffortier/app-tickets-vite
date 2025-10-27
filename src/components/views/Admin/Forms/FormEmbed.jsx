import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import formsAPI from '@src/api/forms.api';
import Loader from '@src/components/global/Loader';
import { showToast } from '@src/components/global/Alert/_helpers/alert.events';

function FormEmbed() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForm();
  }, [id]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const data = await formsAPI.getById(id);
      setForm(data);
    } catch (error) {
      showToast('Error loading form', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  if (loading) return <Loader />;
  if (!form) return <div>Form not found</div>;

  const embedUrl = `${window.location.origin}/embed/form/${id}`;
  const scriptEmbed = `<script src="${window.location.origin}/embed.js" data-form-id="${id}"></script>`;
  const iframeEmbed = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  return (
    <Container fluid className="py-4">
      <Row className="mb-32">
        <Col>
          <div className="d-flex align-items-center gap-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => navigate('/admin/forms')}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Button>
            <h2>Embed Form: {form.name}</h2>
          </div>
        </Col>
      </Row>

      {!form.is_published && (
        <Alert variant="warning" className="mb-32">
          This form is not published. Publish it to make it available for embedding.
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <Card className="mb-32">
            <Card.Body>
              <h5 className="mb-24">Direct Link</h5>
              <p className="text-muted">Share this link directly or embed it in an iframe</p>
              <Form.Group>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    value={embedUrl}
                    readOnly
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => handleCopy(embedUrl)}
                  >
                    <FontAwesomeIcon icon={faCopy} />
                  </Button>
                </div>
              </Form.Group>
            </Card.Body>
          </Card>

          <Card className="mb-32">
            <Card.Body>
              <h5 className="mb-24">Script Embed (Recommended)</h5>
              <p className="text-muted">
                Copy this code and paste it anywhere in your website where you want the form to appear
              </p>
              <Form.Group>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={scriptEmbed}
                  readOnly
                />
                <div className="mt-16">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCopy(scriptEmbed)}
                  >
                    <FontAwesomeIcon icon={faCopy} className="me-2" />
                    Copy Code
                  </Button>
                </div>
              </Form.Group>
            </Card.Body>
          </Card>

          <Card className="mb-32">
            <Card.Body>
              <h5 className="mb-24">iFrame Embed</h5>
              <p className="text-muted">
                Alternative method using an iframe (may have styling limitations)
              </p>
              <Form.Group>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={iframeEmbed}
                  readOnly
                />
                <div className="mt-16">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCopy(iframeEmbed)}
                  >
                    <FontAwesomeIcon icon={faCopy} className="me-2" />
                    Copy Code
                  </Button>
                </div>
              </Form.Group>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h5 className="mb-24">React Component</h5>
              <p className="text-muted">
                For React applications, you can import and use the EventForm component
              </p>
              <pre className="bg-light p-3 rounded">
                <code>{`import { EventForm } from '@/components/embed/EventForm';

<EventForm
  formId="${id}"
  onSubmitSuccess={(data) => {
    console.log('Form submitted:', data);
  }}
/>`}</code>
              </pre>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Body>
              <h5 className="mb-24">Configuration Options</h5>
              <p className="small text-muted">
                You can customize the embedded form with these data attributes:
              </p>
              <ul className="small">
                <li><code>data-theme</code> - light or dark</li>
                <li><code>data-primary-color</code> - Custom color</li>
                <li><code>data-success-url</code> - Redirect URL after submission</li>
              </ul>
              <h6 className="mb-32 mb-16">Example:</h6>
              <pre className="bg-light p-2 rounded small">
                <code>{`<script
  src="${window.location.origin}/embed.js"
  data-form-id="${id}"
  data-theme="dark"
></script>`}</code>
              </pre>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default FormEmbed;
