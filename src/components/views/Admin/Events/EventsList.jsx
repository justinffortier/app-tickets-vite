import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { useEffectAsync } from '@fyclabs/tools-fyc-react/utils';
import { $events, $view, $filter } from '@src/signals';
import SignalTable from '@src/components/global/SignalTable';
import { loadEvents, handleDelete, handlePublish, getStatusBadge } from './_helpers/eventsList.events';

function EventsList() {
  const navigate = useNavigate();
  const events = $events.value.list;

  useEffectAsync(async () => {
    await loadEvents();
  }, []);

  // Define table headers
  const headers = [
    { key: 'title', value: 'Title', sortKey: 'title' },
    { key: 'date', value: 'Date', sortKey: 'start_date' },
    { key: 'location', value: 'Location', sortKey: 'location' },
    { key: 'status', value: 'Status', sortKey: 'status' },
    { key: 'actions', value: 'Actions' },
  ];

  // Transform events data to table rows
  const rows = events.map((event) => ({
    id: event.id,
    title: () => <strong>{event.title}</strong>,
    date: () => format(new Date(event.start_date), 'MMM d, yyyy'),
    location: event.location || '-',
    status: () => {
      const badge = getStatusBadge(event.status);
      return (
        <Badge bg={badge.variant}>
          <span className={`text-${badge.variant}-900`}>{badge.text}</span>
        </Badge>
      );
    },
    actions: () => (
      <span onClick={(e) => e.stopPropagation()}>
        <Dropdown>
          <Dropdown.Toggle
            variant="link"
            size="sm"
            className="text-white"
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/events/${event.id}`);
              }}
            >
              Manage Event
            </Dropdown.Item>
            <Dropdown.Item onClick={(e) => handlePublish(e, event.id, event.status)}>
              {event.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
              className="text-danger"
              onClick={(e) => handleDelete(e, event.id)}
            >
              Delete
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </span>
    ),
  }));

  // Handle row click
  const handleRowClick = (row) => {
    navigate(`/admin/events/${row.id}`);
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-32">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Events</h2>
            <Link to="/admin/events/new">
              <Button variant="primary">
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Create Event
              </Button>
            </Link>
          </div>
        </Col>
      </Row>

      {events.length === 0 && !$view.value.isTableLoading ? (
        <Card>
          <Card.Body className="text-center py-5">
            <p className="text-muted mb-24">No events yet</p>
            <Link to="/admin/events/new">
              <Button variant="primary">Create Your First Event</Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <SignalTable
              $filter={$filter}
              $view={$view}
              headers={headers}
              rows={rows}
              onRowClick={handleRowClick}
              hasPagination
              itemsPerPageAmount={10}
              totalCount={events.length}
              currentPageItemsCount={rows.length}
              currentPage={$filter.value.page || 1}
              paginationMaxButtonAmount={5}
            />
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default EventsList;
