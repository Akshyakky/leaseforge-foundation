// src/routes/invoiceRoutes.tsx
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import InvoiceList from "@/pages/invoice/InvoiceList";
import InvoiceForm from "@/pages/invoice/InvoiceForm";
import InvoiceDetails from "@/pages/invoice/InvoiceDetails";
import ContractInvoiceList from "@/pages/contractInvoice/ContractInvoiceList";
import ContractInvoiceForm from "@/pages/contractInvoice/ContractInvoiceForm";
import ContractInvoiceDetails from "@/pages/contractInvoice/ContractInvoiceDetails";

const invoiceRoutes = (
  <>
    <Route
      path="invoices"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          {/* <InvoiceList /> */}
          <ContractInvoiceList />
        </ProtectedRoute>
      }
    />
    <Route
      path="invoices/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          {/* <InvoiceForm /> */}
          <ContractInvoiceForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="invoices/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          {/* <InvoiceForm /> */}
          <ContractInvoiceForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="invoices/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          {/* <InvoiceDetails /> */}
          <ContractInvoiceDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default invoiceRoutes;
