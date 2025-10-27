import { Outlet, Navigate } from 'react-router-dom';
import { $global } from '@src/signals';
import ContentWrapper from '../ContentWrapper';

const PrivateRoutes = () => {
  if (!$global.value.isSignedIn && !$global.value.isLoading) {
    return <Navigate to={`/login?redirect=${window.location.pathname}`} />;
  }
  return (
    <ContentWrapper>
      <Outlet />
    </ContentWrapper>
  );
};

export default PrivateRoutes;
