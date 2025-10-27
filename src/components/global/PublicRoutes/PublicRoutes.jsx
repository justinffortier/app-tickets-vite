import { Navigate, Outlet } from 'react-router-dom';
import { $global } from '@src/signals';

const PublicRoutes = () => {
  // If user is signed in, redirect auth pages to admin
  // But allow embed pages (they don't need ContentWrapper)
  if ($global.value.isSignedIn && !$global.value.isLoading) {
    const path = window.location.pathname;
    // Allow embed pages for authenticated users
    if (!path.startsWith('/embed')) {
      return <Navigate to="/admin" />;
    }
  }
  return <Outlet />;
};

export default PublicRoutes;
