// src/routes/receiptRoutes.tsx
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ReceiptList from "@/pages/receipt/ReceiptList";
import ReceiptForm from "@/pages/receipt/ReceiptForm";
import ReceiptDetails from "@/pages/receipt/ReceiptDetails";

const receiptRoutes = (
  <>
    <Route
      path="receipts"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <ReceiptList />
        </ProtectedRoute>
      }
    />
    <Route
      path="receipts/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <ReceiptForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="receipts/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <ReceiptForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="receipts/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          <ReceiptDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default receiptRoutes;
