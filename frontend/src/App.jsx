import React from "react";
import { Routes, Route } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  SignIn,
  SignUp,
} from "@clerk/clerk-react";

import Home from "./pages/Home";
import NotFound from "./pages/Notfound";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import CreateInvoice from "./pages/CreateInvoice";
import InvoicePreview from "./components/InvoicePreview";
import Invoices from "./pages/Invoices";
import BusinessProfile from "./pages/BusinessProfile";

const ClerkProtected = ({ children }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
);

const App = () => {
  return (
    // Prevent horizontal overflow globally for the app
    <div className="min-h-screen max-w-full overflow-x-hidden">
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />

        {/* Clerk Auth Pages */}
        <Route
          path="/login"
          element={<SignIn routing="path" path="/login" />}
        />
        <Route
          path="/signup"
          element={<SignUp routing="path" path="/signup" />}
        />

        {/* ------------- Protected Section ------------- */}
        <Route
          path="/app"
          element={
            <ClerkProtected>
              <AppShell />
            </ClerkProtected>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Invoice Routes */}
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<CreateInvoice />} />
          <Route path="invoices/:id" element={<InvoicePreview />} />
          <Route path="invoices/:id/preview" element={<InvoicePreview />} />
          <Route path="invoices/:id/edit" element={<CreateInvoice />} />

          <Route path="create-invoice" element={<CreateInvoice />} />
          <Route path="business" element={<BusinessProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;
