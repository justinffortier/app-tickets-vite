import { Card, Table, Button, Modal, Form, Row, Col, Badge, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { useEffectAsync } from '@fyclabs/tools-fyc-react/utils';
import { $discounts } from '@src/signals';
import UniversalInput from '@src/components/global/Inputs/UniversalInput';
import {
  $discountForm,
  $discountUI,
  loadDiscounts,
  handleOpenModal,
  handleCloseModal,
  handleSubmit,
  handleDelete,
  handleToggleActive,
} from './_helpers/discountsManager.events';

function DiscountsManager({ eventId }) {
  const discounts = $discounts.value.list;
  const { showModal } = $discountUI.value;
  const { editingDiscount } = $discountUI.value;

  useEffectAsync(async () => {
    await loadDiscounts(eventId);
  }, [eventId]);

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
                      <Dropdown>
                        <Dropdown.Toggle variant="link" size="sm" className="text-white">
                          <FontAwesomeIcon icon={faEllipsisV} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleToggleActive(discount, eventId)}>
                            {discount.is_active ? 'Deactivate' : 'Activate'}
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleOpenModal(discount)}>
                            Edit
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item
                            className="text-danger"
                            onClick={() => handleDelete(discount.id, eventId)}
                          >
                            Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
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
        <Form onSubmit={(e) => handleSubmit(e, eventId)}>
          <Modal.Body>
            <Form.Group className="mb-24">
              <Form.Label>Code *</Form.Label>
              <UniversalInput
                type="text"
                name="code"
                signal={$discountForm}
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
                  <UniversalInput
                    as="select"
                    name="type"
                    signal={$discountForm}
                    required
                  >
                    <option value="PERCENT">Percentage</option>
                    <option value="AMOUNT">Fixed Amount</option>
                  </UniversalInput>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-24">
                  <Form.Label>Value *</Form.Label>
                  <UniversalInput
                    type="number"
                    step="0.01"
                    min="0"
                    name="value"
                    signal={$discountForm}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-24">
              <Form.Label>Max Uses</Form.Label>
              <UniversalInput
                type="number"
                min="1"
                name="max_uses"
                signal={$discountForm}
              />
              <Form.Text className="text-muted">
                Leave empty for unlimited uses
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-24">
              <Form.Label>Expires At</Form.Label>
              <UniversalInput
                type="datetime-local"
                name="expires_at"
                signal={$discountForm}
              />
              <Form.Text className="text-muted">
                Leave empty for no expiration
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-24">
              <UniversalInput
                type="checkbox"
                name="is_active"
                signal={$discountForm}
                label="Active"
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
