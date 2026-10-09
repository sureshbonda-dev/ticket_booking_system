import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthProvider.jsx';
import { RequireAdmin, RequireAuth } from './RouteGuards.jsx';
import AppShell from './AppShell.jsx';
import CatalogPage from '../features/catalog/pages/CatalogPage.jsx';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegisterPage from '../features/auth/pages/RegisterPage.jsx';
import AccountPage from '../features/account/pages/AccountPage.jsx';
import TicketPage from '../features/account/pages/TicketPage.jsx';
import SeatSelectionPage from '../features/booking/pages/SeatSelectionPage.jsx';
import CheckoutPage from '../features/booking/pages/CheckoutPage.jsx';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage.jsx';
import VerifyTicketPage from '../features/admin/pages/VerifyTicketPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<CatalogPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="showtimes/:showtimeId/seats" element={<RequireAuth><SeatSelectionPage /></RequireAuth>} />
            <Route path="checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
            <Route path="account" element={<RequireAuth><AccountPage /></RequireAuth>} />
            <Route path="tickets/:bookingId" element={<RequireAuth><TicketPage /></RequireAuth>} />
            <Route path="admin" element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />
            <Route path="admin/verify-ticket" element={<RequireAdmin><VerifyTicketPage /></RequireAdmin>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
