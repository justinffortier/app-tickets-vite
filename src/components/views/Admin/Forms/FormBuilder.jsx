import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, ListGroup, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faGripVertical, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import formsAPI from '@src/api/forms.api';
import eventsAPI from '@src/api/events.api';
import Loader from '@src/components/global/Loader';
import { showToast } from '@src/components/global/Alert/_helpers/alert.events';
import { $user } from '@src/signals';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'tel', label: 'Phone' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'date', label: 'Date' },
];

function DraggableField({ field, index, moveField, onEdit, onDelete }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'field',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'field',
    hover: (item) => {
      if (item.index !== index) {
        moveField(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <ListGroup.Item
      ref={(node) => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
      className="d-flex align-items-center justify-content-between"
    >
      <div className="d-flex align-items-center gap-2">
        <FontAwesomeIcon icon={faGripVertical} className="text-muted" />
        <div>
          <strong>{field.label || 'Untitled Field'}</strong>
          <Badge bg="secondary" className="ms-2">{field.type}</Badge>
          {field.required && <Badge bg="danger" className="ms-1">Required</Badge>}
        </div>
      </div>
      <div className="d-flex gap-2">
        <Button size="sm" variant="outline-primary" onClick={() => onEdit(index)}>
          Edit
        </Button>
        <Button size="sm" variant="outline-danger" onClick={() => onDelete(index)}>
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      </div>
    </ListGroup.Item>
  );
}

function FormBuilder() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_id: searchParams.get('event') || '',
    is_published: false,
  });
  const [fields, setFields] = useState([]);
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const [currentField, setCurrentField] = useState({
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    options: [],
  });

  useEffect(() => {
    loadEvents();
    if (id) {
      loadForm();
    }
  }, [id]);

  const loadEvents = async () => {
    try {
      const data = await eventsAPI.getAll({ status: 'PUBLISHED' });
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadForm = async () => {
    try {
      setLoading(true);
      const data = await formsAPI.getById(id);
      setFormData({
        name: data.name,
        description: data.description || '',
        event_id: data.event_id || '',
        is_published: data.is_published,
      });
      setFields(data.schema || []);
    } catch (error) {
      showToast('Error loading form', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFieldChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setCurrentField((prev) => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value,
    }));
  };

  const handleAddField = () => {
    if (!currentField.label) {
      showToast('Please enter a field label', 'error');
      return;
    }

    if (editingFieldIndex !== null) {
      const newFields = [...fields];
      newFields[editingFieldIndex] = currentField;
      setFields(newFields);
      setEditingFieldIndex(null);
    } else {
      setFields([...fields, currentField]);
    }

    setCurrentField({
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [],
    });
  };

  const handleEditField = (index) => {
    setCurrentField(fields[index]);
    setEditingFieldIndex(index);
  };

  const handleDeleteField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const moveField = (fromIndex, toIndex) => {
    const newFields = [...fields];
    const [removed] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, removed);
    setFields(newFields);
  };

  const handleOptionsChange = (value) => {
    const options = value.split('\n').filter((opt) => opt.trim());
    setCurrentField((prev) => ({ ...prev, options }));
  };

  const handleSave = async (publish = false) => {
    if (!formData.name) {
      showToast('Please enter a form name', 'error');
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        schema: fields,
        is_published: publish || formData.is_published,
      };

      if (id) {
        await formsAPI.update(id, submitData);
        showToast('Form updated successfully', 'success');
      } else {
        // Add created_by field when creating a new form
        const userData = $user.value;
        if (!userData?.id) {
          throw new Error('User not authenticated. Please log in and try again.');
        }

        submitData.created_by = userData.id;

        // Convert empty strings to null for UUID fields
        if (submitData.event_id === '') {
          submitData.event_id = null;
        }

        await formsAPI.create(submitData);
        showToast('Form created successfully', 'success');
      }

      navigate('/admin/forms');
    } catch (error) {
      showToast(error.message || 'Error saving form', 'error');
    } finally {
      setLoading(false);
    }
  };

  const needsOptions = ['select', 'radio'].includes(currentField.type);

  if (loading && id) return <Loader />;

  return (
    <DndProvider backend={HTML5Backend}>
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
              <h2>{id ? 'Edit Form' : 'Create Form'}</h2>
            </div>
          </Col>
        </Row>

        <Row>
          <Col lg={4}>
            <Card className="mb-32">
              <Card.Body>
                <h5 className="mb-24">Form Settings</h5>
                <Form.Group className="mb-24">
                  <Form.Label>Form Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormDataChange}
                  />
                </Form.Group>

                <Form.Group className="mb-24">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleFormDataChange}
                  />
                </Form.Group>

                <Form.Group className="mb-24">
                  <Form.Label>Linked Event</Form.Label>
                  <Form.Select
                    name="event_id"
                    value={formData.event_id}
                    onChange={handleFormDataChange}
                  >
                    <option value="">No event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="primary" onClick={() => handleSave(false)}>
                    Save Draft
                  </Button>
                  <Button variant="success" onClick={() => handleSave(true)}>
                    Publish
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <h5 className="mb-24">Add Field</h5>
                <Form.Group className="mb-24">
                  <Form.Label>Field Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={currentField.type}
                    onChange={handleFieldChange}
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-24">
                  <Form.Label>Label *</Form.Label>
                  <Form.Control
                    type="text"
                    name="label"
                    value={currentField.label}
                    onChange={handleFieldChange}
                  />
                </Form.Group>

                <Form.Group className="mb-24">
                  <Form.Label>Placeholder</Form.Label>
                  <Form.Control
                    type="text"
                    name="placeholder"
                    value={currentField.placeholder}
                    onChange={handleFieldChange}
                  />
                </Form.Group>

                {needsOptions && (
                  <Form.Group className="mb-24">
                    <Form.Label>Options (one per line)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={currentField.options.join('\n')}
                      onChange={(e) => handleOptionsChange(e.target.value)}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-24">
                  <Form.Check
                    type="checkbox"
                    name="required"
                    label="Required field"
                    checked={currentField.required}
                    onChange={handleFieldChange}
                  />
                </Form.Group>

                <Button variant="primary" onClick={handleAddField} className="w-100">
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  {editingFieldIndex !== null ? 'Update Field' : 'Add Field'}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <Card>
              <Card.Body>
                <h5 className="mb-24">Form Preview ({fields.length} fields)</h5>
                {fields.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    No fields added yet. Add fields using the panel on the left.
                  </div>
                ) : (
                  <ListGroup>
                    {fields.map((field, index) => (
                      <DraggableField
                        key={index}
                        field={field}
                        index={index}
                        moveField={moveField}
                        onEdit={handleEditField}
                        onDelete={handleDeleteField}
                      />
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DndProvider>
  );
}

export default FormBuilder;
