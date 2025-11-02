import { $global } from '@src/signals';
import { Container } from 'react-bootstrap';
import Loader from '@src/components/global/Loader';
import AdminNav from '@src/components/global/AdminNav';

const ContentWrapper = ({ children, className, fluid }) => {
  if ($global.value?.isLoading) {
    return (
      <div>
        <div className="min-vh-100 w-100 d-flex justify-content-center align-items-center flex-grow-1">
          <Loader
            message="Loading..."
            className="text-center"
          />
        </div>
      </div>
    );
  }
  return (
    <div>
      <AdminNav />
      <Container fluid={!!fluid} className={className}>
        {children}
      </Container>
    </div>
  );
};

export default ContentWrapper;
