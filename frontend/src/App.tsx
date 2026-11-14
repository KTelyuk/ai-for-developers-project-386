import { Route, Routes } from 'react-router';
import { SiteHeader } from '@/components/SiteHeader.tsx';
import { AdminEventTypesPage } from '@/pages/AdminEventTypesPage.tsx';
import { BookingPage } from '@/pages/BookingPage.tsx';
import { BookPage } from '@/pages/BookPage.tsx';
import { HomePage } from '@/pages/HomePage.tsx';

function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/bookings/:id" element={<BookingPage />} />
          <Route path="/admin/event-types" element={<AdminEventTypesPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
