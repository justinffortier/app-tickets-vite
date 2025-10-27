import { useState } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import ticketsAPI from '@src/api/tickets.api';
import { showToast } from '@src/components/global/Alert/_helpers/alert.events';

function TicketsManager({ eventId, tickets, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    sales_start: '',
    sales_end: '',
  });

  const handleOpenModal = (ticket = null) => {
    if (ticket) {
      setEditingTicket(ticket);
      setFormData({
        name: ticket.name,
        description: ticket.description || '',
        price: ticket.price,
        quantity: ticket.quantity,
        sales_start: new Date(ticket.sales_start).toISOString().slice(0, 16),
        sales_end: new Date(ticket.sales_end).toISOString().slice(0, 16),
      });
    } else {
      setEditingTicket(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        quantity: '',
        sales_start: '',
        sales_end: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTicket(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        event_id: eventId,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity, 10),
      };

      if (editingTicket) {
        await ticketsAPI.update(editingTicket.id, submitData);
        showToast('Ticket updated successfully', 'success');
      } else {
        await ticketsAPI.create(submitData);
        showToast('Ticket created successfully', 'success');
      }

      handleCloseModal();
      onUpdate();
    } catch (error) {
      showToast('Error saving ticket', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ticket type?')) return;

    try {
      await ticketsAPI.delete(id);
      showToast('Ticket deleted successfully', 'success');
      onUpdate();
    } catch (error) {
      showToast('Error deleting ticket', 'error');
    }
  };

  return (
    <>
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-24">
            <h5 className="mb-0">Ticket Types</h5>
            <Button size="sm" variant="primary" onClick={() => handleOpenModal()}>
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add Ticket
            </Button>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No ticket types yet
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Sold / Quantity</th>
                  <th>Sales Period</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <strong>{ticket.name}</strong>
                      {ticket.description && (
                        <div className="small text-muted">{ticket.description}</div>
                      )}
                    </td>
                    <td>${parseFloat(ticket.price).toFixed(2)}</td>
                    <td>
                      {ticket.sold || 0} / {ticket.quantity}
                    </td>
                    <td className="small">
                      {format(new Date(ticket.sales_start), 'MMM d')} - {format(new Date(ticket.sales_end), 'MMM d')}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => handleOpenModal(ticket)}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(ticket.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingTicket ? 'Edit Ticket' : 'Add Ticket'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-24">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-24">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-24">
                  <Form.Label>Price *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-24">
                  <Form.Label>Quantity *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-24">
                  <Form.Label>Sales Start *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="sales_start"
                    value={formData.sales_start}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-24">
                  <Form.Label>Sales End *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="sales_end"
                    value={formData.sales_end}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingTicket ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default TicketsManager;
