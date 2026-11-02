export default function AuthLayout({ children }) {
  return (
    <section className="grid min-h-[80vh] place-items-center bg-raised px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm sm:p-10">{children}</div>
    </section>
  );
}