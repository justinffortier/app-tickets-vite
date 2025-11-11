import { useParams, useSearchParams } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { $embed } from '@src/signals';
import EventForm from './EventForm';

function EmbedPage() {
  const { formId } = useParams();
  const [searchParams] = useSearchParams();
  const { form } = $embed.value;
  const confirmationUrlOverride = searchParams.get('confirmationUrl');

  const handleSubmitSuccess = (data) => {
    if (data.order) {
      // Pass confirmationUrl as query param to checkout if present
      const checkoutUrl = confirmationUrlOverride
        ? `/embed/checkout/${data.order.id}?confirmationUrl=${encodeURIComponent(confirmationUrlOverride)}`
        : `/embed/checkout/${data.order.id}`;
      window.location.href = checkoutUrl;
    } else {
      alert('Form submitted successfully!');
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: '800px' }}>
      <EventForm
        formId={formId}
        onSubmitSuccess={handleSubmitSuccess}
        theme={form?.theme || 'light'}
      />
    </Container>
  );
}

export default EmbedPage;
