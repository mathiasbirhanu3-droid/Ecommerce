'use client';

export default function TextField({ label, name, type = 'text', value, onChange, error, autoComplete, placeholder, required }) {
  return (
    <label htmlFor={name} className="block">
      <span className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-accent ${
          error ? 'border-danger' : 'border-black/10'
        }`}
      />
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </label>
  );
}