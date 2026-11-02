// page.js (server)
import RegisterForm from './RegisterForm';
export const metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">
        Join Vendora<span className="text-accent">.</span>
      </h1>
      <p className="mt-2 text-sm text-ink/60">One account to shop from every vendor.</p>
      <RegisterForm />
    </>
  );
}