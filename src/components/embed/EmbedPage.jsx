import { useParams } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import EventForm from './EventForm';

function EmbedPage() {
  const { formId } = useParams();

  const handleSubmitSuccess = (data) => {
    if (data.order) {
      window.location.href = `/checkout/${data.order.id}`;
    } else {
      alert('Form submitted successfully!');
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: '800px' }}>
      <EventForm
        formId={formId}
        onSubmitSuccess={handleSubmitSuccess}
        theme="light"
      />
    </Container>
  );
}

export default EmbedPage;
