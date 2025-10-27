import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { $global } from '@src/signals';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth state to be determined
    if (!$global.value.isLoading) {
      if ($global.value.isSignedIn) {
        navigate('/admin');
      } else {
        navigate('/login');
      }
    }
  }, [$global.value.isLoading, $global.value.isSignedIn, navigate]);

  return null;
};

export default Home;
