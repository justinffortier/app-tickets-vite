import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import discountsAPI from '@src/api/discounts.api';
import { showToast } from '@src/components/global/Alert/_helpers/alert.events';

function DiscountsManager({ eventId }) {
  const [discounts, setDiscounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENT',
    value: '',
    max_uses: '',
    expires_at: '',
    is_active: true,
  });

  useEffect(() => {
    loadDiscounts();
  }, [eventId]);

  const loadDiscounts = async () => {
    try {
      const data = await discountsAPI.getByEventId(eventId);
      setDiscounts(data);
    } catch (error) {
      showToast('Error loading discounts', 'error');
    }
  };

  const handleOpenModal = (discount = null) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        code: discount.code,
        type: discount.type,
        value: discount.value,
        max_uses: discount.max_uses || '',
        expires_at: discount.expires_at ? new Date(discount.expires_at).toISOString().slice(0, 16) : '',
        is_active: discount.is_active,
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        code: '',
        type: 'PERCENT',
        value: '',
        max_uses: '',
        expires_at: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDiscount(null);
  };

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        event_id: eventId,
        code: formData.code.toUpperCase(),
        value: parseFloat(formData.value),
        max_uses: formData.max_uses ? parseInt(formData.max_uses, 10) : null,
        expires_at: formData.expires_at || null,
      };

      if (editingDiscount) {
        await discountsAPI.update(editingDiscount.id, submitData);
        showToast('Discount updated successfully', 'success');
      } else {
        await discountsAPI.create(submitData);
        showToast('Discount created successfully', 'success');
      }

      handleCloseModal();
      loadDiscounts();
    } catch (error) {
      showToast('Error saving discount', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount code?')) return;

    try {
      await discountsAPI.delete(id);
      showToast('Discount deleted successfully', 'success');
      loadDiscounts();
    } catch (error) {
      showToast('Error deleting discount', 'error');
    }
  };

  const handleToggleActive = async (discount) => {
    try {
      await discountsAPI.update(discount.id, { is_active: !discount.is_active });
      showToast(`Discount ${!discount.is_active ? 'activated' : 'deactivated'}`, 'success');
      loadDiscounts();
    } catch (error) {
      showToast('Error updating discount', 'error');
    }
  };

  return (
    <>
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-24">
            <h5 className="mb-0">Discount Codes</h5>
            <Button size="sm" variant="primary" onClick={() => handleOpenModal()}>
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add Discount
            </Button>
          </div>

          {discounts.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No discount codes yet
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Usage</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr key={discount.id}>
                    <td><strong>{discount.code}</strong></td>
                    <td>
                      <Badge bg="info">{discount.type}</Badge>
                    </td>
                    <td>
                      {discount.type === 'PERCENT' ? `${discount.value}%` : `$${discount.value}`}
                    </td>
                    <td>
                      {discount.used_count || 0}
                      {discount.max_uses ? ` / ${discount.max_uses}` : ' / ∞'}
                    </td>
                    <td className="small">
                      {discount.expires_at ? format(new Date(discount.expires_at), 'MMM d, yyyy') : 'Never'}
                    </td>
                    <td>
                      <Badge bg={discount.is_active ? 'success' : 'secondary'}>
                        {discount.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant={discount.is_active ? 'outline-warning' : 'outline-success'}
                          onClick={() => handleToggleActive(discount)}
                        >
                          <FontAwesomeIcon icon={discount.is_active ? faToggleOff : faToggleOn} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => handleOpenModal(discount)}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(discount.id)}
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

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingDiscount ? 'Edit Discount' : 'Add Discount'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-24">
              <Form.Label>Code *</Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                style={{ textTransform: 'uppercase' }}
                required
              />
              <Form.Text className="text-muted">
                Will be converted to uppercase
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-24">
                  <Form.Label>Type *</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="PERCENT">Percentage</option>
                    <option value="AMOUNT">Fixed Amount</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-24">
                  <Form.Label>Value *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-24">
              <Form.Label>Max Uses</Form.Label>
              <Form.Control
                type="number"
                min="1"
                name="max_uses"
                value={formData.max_uses}
                onChange={handleChange}
              />
              <Form.Text className="text-muted">
                Leave empty for unlimited uses
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-24">
              <Form.Label>Expires At</Form.Label>
              <Form.Control
                type="datetime-local"
                name="expires_at"
                value={formData.expires_at}
                onChange={handleChange}
              />
              <Form.Text className="text-muted">
                Leave empty for no expiration
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-24">
              <Form.Check
                type="checkbox"
                name="is_active"
                label="Active"
                checked={formData.is_active}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingDiscount ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default DiscountsManager;
