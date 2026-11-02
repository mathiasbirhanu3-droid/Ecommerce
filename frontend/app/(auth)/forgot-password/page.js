// page.js (server)
import ForgotPasswordForm from './ForgotPasswordForm';
export const metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Reset your password</h1>
      <p className="mt-2 text-sm text-ink/60">Enter your email and we'll send you a reset link.</p>
      <ForgotPasswordForm />
    </>
  );
}