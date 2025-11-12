import { Card, Table, Badge } from 'react-bootstrap';
import { format } from 'date-fns';
import { useEffectAsync } from '@fyclabs/tools-fyc-react/utils';
import Loader from '@src/components/global/Loader';
import { $sales, loadSales } from './_helpers/salesManager.events';
import { showToast } from '@src/components/global/Alert/_helpers/alert.events';

function SalesManager({ eventId }) {
  const { orders } = $sales.value;
  const loading = $sales.value.isLoading;

  useEffectAsync(async () => {
    await loadSales(eventId);
  }, [eventId]);

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'warning',
      COMPLETED: 'success',
      CANCELLED: 'danger',
      REFUNDED: 'secondary',
    };
    return variants[status] || 'secondary';
  };

  const handleCopyOrderId = async (orderId) => {
    try {
      await navigator.clipboard.writeText(orderId);
      showToast('Order ID copied to clipboard', 'success');
    } catch (error) {
      showToast('Failed to copy Order ID', 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-24">
          <h5 className="mb-0">Sales & Orders</h5>
          <div className="text-muted small">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-5 text-muted">
            No orders yet for this event
          </div>
        ) : (
          <Table responsive hover>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Tickets</th>
                <th>Total</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td 
                    className="font-monospace small" 
                    style={{ cursor: 'pointer', color: '#0d6efd' }}
                    onClick={() => handleCopyOrderId(order.id)}
                    title="Click to copy full Order ID"
                  >
                    {order.id.substring(0, 8)}...
                  </td>
                  <td>
                    <div>
                      <strong>{order.customer_name || 'N/A'}</strong>
                    </div>
                    <div className="small text-muted">{order.customer_email}</div>
                  </td>
                  <td>
                    {order.order_items?.map((item, idx) => (
                      <div key={idx} className="small">
                        {item.quantity}x {item.ticket_types?.name || 'Ticket'}
                      </div>
                    )) || '-'}
                  </td>
                  <td>
                    <strong>${parseFloat(order.total || 0).toFixed(2)}</strong>
                    {order.subtotal !== order.total && (
                      <div className="small text-muted">
                        (was ${parseFloat(order.subtotal || 0).toFixed(2)})
                      </div>
                    )}
                  </td>
                  <td>
                    {order.discount_amount > 0 ? (
                      <span className="text-success">
                        -${parseFloat(order.discount_amount).toFixed(2)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <Badge bg={getStatusBadge(order.status)}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="small">
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                    <div className="text-muted">
                      {format(new Date(order.created_at), 'h:mm a')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {orders.length > 0 && (
          <div className="mt-24 pt-24 border-top">
            <div className="row">
              <div className="col-md-3">
                <div className="text-muted small">Total Orders</div>
                <div className="h4 mb-0">{orders.length}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small">Total Tickets Sold</div>
                <div className="h4 mb-0">
                  {orders.reduce((sum, order) => sum + (order.order_items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0)}
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small">Total Revenue</div>
                <div className="h4 mb-0">
                  ${orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0).toFixed(2)}
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small">Total Discounts</div>
                <div className="h4 mb-0 text-success">
                  ${orders.reduce((sum, order) => sum + parseFloat(order.discount_amount || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default SalesManager;
