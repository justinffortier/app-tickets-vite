import { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import formsAPI from '@src/api/forms.api';
import ticketsAPI from '@src/api/tickets.api';
import ordersAPI from '@src/api/orders.api';
import discountsAPI from '@src/api/discounts.api';
import Loader from '@src/components/global/Loader';

function EventForm({ formId, eventId, onSubmitSuccess, theme = 'light' }) {
  const [form, setForm] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedTickets, setSelectedTickets] = useState({});
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [totals, setTotals] = useState({ subtotal: 0, discount_amount: 0, total: 0 });

  useEffect(() => {
    loadFormData();
  }, [formId, eventId]);

  useEffect(() => {
    calculateTotals();
  }, [selectedTickets, appliedDiscount]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      if (formId) {
        const formData = await formsAPI.getById(formId);
        setForm(formData);
        if (formData.event_id) {
          const ticketsData = await ticketsAPI.getByEventId(formData.event_id);
          setTickets(ticketsData);
        }
      } else if (eventId) {
        const ticketsData = await ticketsAPI.getByEventId(eventId);
        setTickets(ticketsData);
      }
    } catch (err) {
      setError('Error loading form');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
      if (quantity > 0) {
        const ticket = tickets.find((t) => t.id === ticketId);
        if (ticket) {
          subtotal += parseFloat(ticket.price) * quantity;
        }
      }
    });

    let discountAmount = 0;
    if (appliedDiscount) {
      if (appliedDiscount.type === 'PERCENT') {
        discountAmount = (subtotal * parseFloat(appliedDiscount.value)) / 100;
      } else {
        discountAmount = parseFloat(appliedDiscount.value);
      }
    }

    const total = Math.max(0, subtotal - discountAmount);

    setTotals({
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount_amount: parseFloat(discountAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    });
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleTicketChange = (ticketId, quantity) => {
    setSelectedTickets((prev) => ({
      ...prev,
      [ticketId]: parseInt(quantity, 10) || 0,
    }));
  };

  const handleApplyDiscount = async () => {
    if (!discountCode) return;

    try {
      const result = await discountsAPI.validateCode(discountCode, form?.event_id || eventId);
      if (result.valid) {
        setAppliedDiscount(result.discount);
        setError(null);
      } else {
        setError(result.error);
        setAppliedDiscount(null);
      }
    } catch (err) {
      setError('Error validating discount code');
    }
  };

  const validateForm = () => {
    if (form?.schema) {
      for (const field of form.schema) {
        if (field.required && !formData[field.label]) {
          return `${field.label} is required`;
        }
      }
    }

    const hasTickets = Object.values(selectedTickets).some((qty) => qty > 0);
    if (tickets.length > 0 && !hasTickets) {
      return 'Please select at least one ticket';
    }

    if (!formData.email) {
      return 'Email is required';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let submissionId = null;

      if (form) {
        const submission = await formsAPI.submitForm(form.id, formData, formData.email);
        submissionId = submission.id;
      }

      const hasTickets = Object.values(selectedTickets).some((qty) => qty > 0);

      if (hasTickets) {
        const orderItems = Object.entries(selectedTickets)
          .filter(([, quantity]) => quantity > 0)
          .map(([ticketId, quantity]) => {
            const ticket = tickets.find((t) => t.id === ticketId);
            return {
              ticket_type_id: ticketId,
              quantity,
              unit_price: parseFloat(ticket.price),
            };
          });

        const orderData = {
          event_id: form?.event_id || eventId,
          form_submission_id: submissionId,
          discount_code_id: appliedDiscount?.id || null,
          subtotal: totals.subtotal,
          discount_amount: totals.discount_amount,
          total: totals.total,
          status: 'PENDING',
          customer_email: formData.email,
          customer_name: formData.name || null,
          items: orderItems,
        };

        const order = await ordersAPI.create(orderData);

        if (onSubmitSuccess) {
          onSubmitSuccess({ order, submission: submissionId });
        }
      } else {
        if (onSubmitSuccess) {
          onSubmitSuccess({ submission: submissionId });
        }
      }
    } catch (err) {
      setError('Error submitting form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field, index) => {
    const value = formData[field.label] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <Form.Group key={index} className="mb-3">
            <Form.Label>
              {field.label} {field.required && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.label, e.target.value)}
              required={field.required}
            />
          </Form.Group>
        );

      case 'select':
        return (
          <Form.Group key={index} className="mb-3">
            <Form.Label>
              {field.label} {field.required && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Select
              value={value}
              onChange={(e) => handleFieldChange(field.label, e.target.value)}
              required={field.required}
            >
              <option value="">Select...</option>
              {field.options?.map((option, i) => (
                <option key={i} value={option}>
                  {option}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        );

      case 'checkbox':
        return (
          <Form.Group key={index} className="mb-3">
            <Form.Check
              type="checkbox"
              label={field.label}
              checked={!!value}
              onChange={(e) => handleFieldChange(field.label, e.target.checked)}
              required={field.required}
            />
          </Form.Group>
        );

      case 'radio':
        return (
          <Form.Group key={index} className="mb-3">
            <Form.Label>
              {field.label} {field.required && <span className="text-danger">*</span>}
            </Form.Label>
            {field.options?.map((option, i) => (
              <Form.Check
                key={i}
                type="radio"
                label={option}
                name={field.label}
                value={option}
                checked={value === option}
                onChange={(e) => handleFieldChange(field.label, e.target.value)}
                required={field.required}
              />
            ))}
          </Form.Group>
        );

      default:
        return (
          <Form.Group key={index} className="mb-3">
            <Form.Label>
              {field.label} {field.required && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              type={field.type}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.label, e.target.value)}
              required={field.required}
            />
          </Form.Group>
        );
    }
  };

  if (loading) return <Loader />;

  return (
    <Card className={`event-form-embed ${theme}`}>
      <Card.Body>
        {form && (
          <div className="mb-4">
            <h3>{form.name}</h3>
            {form.description && <p className="text-muted">{form.description}</p>}
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email *</Form.Label>
            <Form.Control
              type="email"
              placeholder="your@email.com"
              value={formData.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Your name"
              value={formData.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
          </Form.Group>

          {form?.schema?.map((field, index) => renderField(field, index))}

          {tickets.length > 0 && (
            <div className="mb-4">
              <h5 className="mb-3">Select Tickets</h5>
              {tickets.map((ticket) => {
                const available = ticket.quantity - (ticket.sold || 0);
                return (
                  <Card key={ticket.id} className="mb-3">
                    <Card.Body>
                      <Row className="align-items-center">
                        <Col md={6}>
                          <h6 className="mb-1">{ticket.name}</h6>
                          {ticket.description && (
                            <p className="text-muted small mb-0">{ticket.description}</p>
                          )}
                          <strong className="text-primary">
                            ${parseFloat(ticket.price).toFixed(2)}
                          </strong>
                        </Col>
                        <Col md={3} className="text-muted small">
                          {available > 0 ? `${available} available` : 'Sold out'}
                        </Col>
                        <Col md={3}>
                          <Form.Control
                            type="number"
                            min="0"
                            max={available}
                            value={selectedTickets[ticket.id] || 0}
                            onChange={(e) => handleTicketChange(ticket.id, e.target.value)}
                            disabled={available === 0}
                          />
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                );
              })}

              <div className="mb-3">
                <Form.Label>Discount Code</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    placeholder="Enter code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  />
                  <Button variant="outline-secondary" onClick={handleApplyDiscount}>
                    Apply
                  </Button>
                </div>
                {appliedDiscount && (
                  <small className="text-success">
                    Discount applied: {appliedDiscount.code}
                  </small>
                )}
              </div>

              {totals.subtotal > 0 && (
                <Card className="bg-light">
                  <Card.Body>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal:</span>
                      <strong>${totals.subtotal.toFixed(2)}</strong>
                    </div>
                    {totals.discount_amount > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Discount:</span>
                        <strong>-${totals.discount_amount.toFixed(2)}</strong>
                      </div>
                    )}
                    <div className="d-flex justify-content-between pt-2 border-top">
                      <strong>Total:</strong>
                      <strong className="text-primary">${totals.total.toFixed(2)}</strong>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-100"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : tickets.length > 0 ? 'Proceed to Payment' : 'Submit'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default EventForm;
