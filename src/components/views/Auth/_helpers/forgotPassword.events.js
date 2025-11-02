import { Signal } from '@fyclabs/tools-fyc-react/signals';
import { sendPasswordResetEmail } from '@src/utils/auth';
import { $alert } from '@src/signals';

export const $forgotPasswordForm = Signal({ email: '' });

export const $forgotPasswordUI = Signal({
  isLoading: false,
  emailSent: false,
});

export const handleSubmit = async (e) => {
  e.preventDefault();
  $forgotPasswordUI.update({ isLoading: true });

  try {
    const { email } = $forgotPasswordForm.value;

    if (!email) {
      $alert.update({
        message: 'Please enter your email address',
        variant: 'danger',
      });
      $forgotPasswordUI.update({ isLoading: false });
      return;
    }

    await sendPasswordResetEmail(email);

    $forgotPasswordUI.update({ emailSent: true });
    $alert.update({
      message: 'Password reset email sent! Please check your inbox.',
      variant: 'success',
    });

    // Clear the form
    $forgotPasswordForm.reset();
  } catch (error) {
    let errorMessage = 'Failed to send password reset email. Please try again.';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }

    $alert.update({
      message: errorMessage,
      variant: 'danger',
    });
  } finally {
    $forgotPasswordUI.update({ isLoading: false });
  }
};
