import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faCode } from '@fortawesome/free-solid-svg-icons';
import formsAPI from '@src/api/forms.api';
import Loader from '@src/components/global/Loader';
import { showToast } from '@src/components/global/Alert/_helpers/alert.events';

function FormsList() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await formsAPI.getAll();
      setForms(data);
    } catch (error) {
      showToast('Error loading forms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return;

    try {
      await formsAPI.delete(id);
      showToast('Form deleted successfully', 'success');
      loadForms();
    } catch (error) {
      showToast('Error deleting form', 'error');
    }
  };

  const handlePublish = async (id, isPublished) => {
    try {
      if (isPublished) {
        await formsAPI.unpublish(id);
        showToast('Form unpublished', 'success');
      } else {
        await formsAPI.publish(id);
        showToast('Form published successfully', 'success');
      }
      loadForms();
    } catch (error) {
      showToast('Error updating form status', 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <Container fluid className="py-4">
      <Row className="mb-32">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Forms</h2>
            <Link to="/admin/forms/new">
              <Button variant="primary">
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Create Form
              </Button>
            </Link>
          </div>
        </Col>
      </Row>

      {forms.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <p className="text-muted mb-24">No forms yet</p>
            <Link to="/admin/forms/new">
              <Button variant="primary">Create Your First Form</Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Event</th>
                  <th>Fields</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
                  <tr key={form.id}>
                    <td>
                      <strong>{form.name}</strong>
                    </td>
                    <td>{form.events?.title || '-'}</td>
                    <td>{form.schema?.length || 0}</td>
                    <td>
                      <Badge bg={form.is_published ? 'success' : 'secondary'}>
                        {form.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link to={`/admin/forms/${form.id}/edit`}>
                          <Button size="sm" variant="outline-secondary">
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                        </Link>
                        <Link to={`/admin/forms/${form.id}/submissions`}>
                          <Button size="sm" variant="outline-info">
                            Submissions
                          </Button>
                        </Link>
                        <Link to={`/admin/forms/${form.id}/embed`}>
                          <Button size="sm" variant="outline-primary">
                            <FontAwesomeIcon icon={faCode} />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant={form.is_published ? 'outline-warning' : 'outline-success'}
                          onClick={() => handlePublish(form.id, form.is_published)}
                        >
                          {form.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(form.id)}
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

export default FormsList;
