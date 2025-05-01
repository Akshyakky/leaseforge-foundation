// src/routes/receiptRoutes.tsx
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import LeaseReceiptList from "@/pages/finance/receipt/LeaseReceiptList";
import LeaseReceiptForm from "@/pages/finance/receipt/LeaseReceiptForm";
import LeaseReceiptDetails from "@/pages/finance/receipt/LeaseReceiptDetails";

const receiptRoutes = (
  <>
    <Route
      path="receipts"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseReceiptList />
        </ProtectedRoute>
      }
    />
    <Route
      path="receipts/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <LeaseReceiptForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="receipts/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <LeaseReceiptForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="receipts/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <LeaseReceiptDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default receiptRoutes;
