import { Signal } from '@fyclabs/tools-fyc-react/signals';
import { createNewUser, signInWithGoogle } from '@src/utils/auth';
import { $alert } from '@src/signals';

export const $signupForm = Signal({
  email: '',
  password: '',
  confirmPassword: '',
});

export const $signupUI = Signal({
  isLoading: false,
  showVerificationMessage: false,
});

export const validateForm = () => {
  const { email, password, confirmPassword } = $signupForm.value;

  if (!email || !password || !confirmPassword) {
    $alert.update({
      message: 'Please fill in all fields',
      variant: 'danger',
    });
    return false;
  }

  if (password.length < 6) {
    $alert.update({
      message: 'Password must be at least 6 characters long',
      variant: 'danger',
    });
    return false;
  }

  if (password !== confirmPassword) {
    $alert.update({
      message: 'Passwords do not match',
      variant: 'danger',
    });
    return false;
  }

  return true;
};

export const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  $signupUI.update({ isLoading: true });

  try {
    const { email, password } = $signupForm.value;
    await createNewUser(email, password);

    $signupUI.update({
      showVerificationMessage: true,
      isLoading: false,
    });

    $alert.update({
      message: 'Account created! Please check your email to verify your account.',
      variant: 'success',
    });
  } catch (error) {
    let errorMessage = 'Failed to create account. Please try again.';

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use a stronger password.';
    }

    $alert.update({
      message: errorMessage,
      variant: 'danger',
    });

    $signupUI.update({ isLoading: false });
  }
};

export const handleGoogleSignIn = async (navigate) => {
  $signupUI.update({ isLoading: true });

  try {
    await signInWithGoogle();
    navigate('/admin');
  } catch (error) {
    $alert.update({
      message: error.message || 'Failed to sign up with Google.',
      variant: 'danger',
    });
    $signupUI.update({ isLoading: false });
  }
};
