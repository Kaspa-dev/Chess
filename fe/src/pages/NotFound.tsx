import { Link } from "react-router-dom";

import MainLayout from "@/layouts/main";

export default function NotFound() {
  return (
    <MainLayout>
      <section className="flex min-h-full flex-col items-center justify-center gap-6 py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-500">
          404 Error
        </p>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 md:text-5xl">
            Page not found
          </h1>
          <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-300 md:text-lg">
            The page you were looking for does not exist or may have been moved.
            Use the link below to get back into the app.
          </p>
        </div>
        <Link
          to="/main"
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900"
        >
          Go back to the home page
        </Link>
      </section>
    </MainLayout>
  );
}
