// src/routes/invoiceRoutes.tsx
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import LeaseInvoiceList from "@/pages/invoice/InvoiceList";
import LeaseInvoiceForm from "@/pages/invoice/InvoiceForm";
import LeaseInvoiceDetails from "@/pages/invoice/InvoiceDetails";

const invoiceRoutes = (
  <>
    <Route
      path="invoices"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseInvoiceList />
        </ProtectedRoute>
      }
    />
    <Route
      path="invoices/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <LeaseInvoiceForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="invoices/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <LeaseInvoiceForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="invoices/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseInvoiceDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default invoiceRoutes;
