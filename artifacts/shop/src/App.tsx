import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import { GuestCartProvider } from "./lib/guest-cart";
import { LoginPromptProvider } from "./lib/login-prompt";
import { LoginPromptDialog } from "./components/shared/LoginPromptDialog";
import { AppLayout } from "./components/layout/AppLayout";
import { AdminAppShell } from "./components/layout/AdminAppShell";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ProtectedRoute } from "./components/shared/ProtectedRoute";
import { StorefrontGuard } from "./components/shared/StorefrontGuard";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import TrackOrder from "./pages/TrackOrder";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/not-found";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute adminOnly loginPath="/admin/login">
      <AdminAppShell>
        <AdminLayout>{children}</AdminLayout>
      </AdminAppShell>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      {/* Admin portal — separate from customer storefront */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <AdminRoute><AdminDashboard /></AdminRoute>
      </Route>
      <Route path="/admin/products">
        <AdminRoute><AdminProducts /></AdminRoute>
      </Route>
      <Route path="/admin/orders">
        <AdminRoute><AdminOrders /></AdminRoute>
      </Route>
      <Route path="/admin/users">
        <AdminRoute><AdminUsers /></AdminRoute>
      </Route>

      {/* Customer storefront */}
      <Route>
        <StorefrontGuard>
          <AppLayout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/products" component={Products} />
              <Route path="/products/:id" component={ProductDetail} />

              <Route path="/cart" component={Cart} />
              <Route path="/checkout" component={Checkout} />
              <Route path="/orders">
                <ProtectedRoute><Orders /></ProtectedRoute>
              </Route>
              <Route path="/orders/:id" component={OrderDetail} />
              <Route path="/track-order" component={TrackOrder} />
              <Route path="/wishlist">
                <ProtectedRoute><Wishlist /></ProtectedRoute>
              </Route>
              <Route path="/profile">
                <ProtectedRoute><Profile /></ProtectedRoute>
              </Route>

              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              <Route path="/forgot-password" component={ForgotPassword} />
              <Route path="/reset-password" component={ResetPassword} />

              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        </StorefrontGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GuestCartProvider>
          <LoginPromptProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <LoginPromptDialog />
              <Toaster />
            </TooltipProvider>
          </LoginPromptProvider>
        </GuestCartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
