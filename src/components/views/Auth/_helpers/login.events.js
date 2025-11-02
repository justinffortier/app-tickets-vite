import { Signal } from '@fyclabs/tools-fyc-react/signals';
import { signIn, signInWithGoogle } from '@src/utils/auth';
import { $alert } from '@src/signals';

export const $loginForm = Signal({
  email: '',
  password: '',
});

export const $loginUI = Signal({
  isLoading: false,
});

export const handleSubmit = async (e, navigate, redirectPath) => {
  e.preventDefault();
  $loginUI.update({ isLoading: true });

  try {
    const { email, password } = $loginForm.value;

    if (!email || !password) {
      $alert.update({
        message: 'Please enter both email and password',
        variant: 'danger',
      });
      $loginUI.update({ isLoading: false });
      return;
    }

    await signIn(email, password);

    $alert.update({
      message: 'Successfully logged in!',
      variant: 'success',
    });

    navigate(redirectPath);
  } catch (error) {
    $alert.update({
      message: error.message || 'Failed to log in. Please check your credentials.',
      variant: 'danger',
    });
    $loginUI.update({ isLoading: false });
  }
};

export const handleGoogleSignIn = async (navigate, redirectPath) => {
  $loginUI.update({ isLoading: true });

  try {
    await signInWithGoogle();
    navigate(redirectPath);
  } catch (error) {
    $alert.update({
      message: error.message || 'Failed to sign in with Google.',
      variant: 'danger',
    });
    $loginUI.update({ isLoading: false });
  }
};
