import { CalendarDays } from 'lucide-react';
import { Link } from 'react-router';

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-2 font-semibold focus-visible:outline-2 focus-visible:outline-ring"
        >
          <CalendarDays className="size-5" aria-hidden="true" />
          Календарь звонков
        </Link>
      </div>
    </header>
  );
}
