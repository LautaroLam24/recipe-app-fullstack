import Link from "next/link";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-7 flex flex-col items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-base font-bold text-white">
            R
          </span>
          <span className="font-semibold text-zinc-900">Recetario</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>
            )}
          </div>
          {children}
        </div>

        {/* Back link */}
        <p className="mt-5 text-center text-sm text-zinc-400">
          <Link href="/" className="transition-colors hover:text-zinc-700">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
