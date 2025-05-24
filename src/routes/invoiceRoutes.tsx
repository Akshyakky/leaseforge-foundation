// src/routes/invoiceRoutes.tsx
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import InvoiceList from "@/pages/invoice/InvoiceList";
import InvoiceForm from "@/pages/invoice/InvoiceForm";
import InvoiceDetails from "@/pages/invoice/InvoiceDetails";

const invoiceRoutes = (
  <>
    <Route
      path="invoices"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <InvoiceList />
        </ProtectedRoute>
      }
    />
    <Route
      path="invoices/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <InvoiceForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="invoices/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <InvoiceForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="invoices/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <InvoiceDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default invoiceRoutes;
