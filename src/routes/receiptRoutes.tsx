// src/routes/receiptRoutes.tsx
import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import ReceiptList from "@/pages/receipt/ReceiptList";
import ReceiptForm from "@/pages/receipt/ReceiptForm";
import ReceiptDetails from "@/pages/receipt/ReceiptDetails";
import ContractReceiptList from "@/pages/contractReceipt/ContractReceiptList";
import ContractReceiptForm from "@/pages/contractReceipt/ContractReceiptForm";
import ContractReceiptDetails from "@/pages/contractReceipt/ContractReceiptDetails";

const receiptRoutes = (
  <>
    <Route
      path="receipts"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          {/* <ReceiptList /> */}
          <ContractReceiptList />
        </ProtectedRoute>
      }
    />
    <Route
      path="receipts/new"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          {/* <ReceiptForm /> */}
          <ContractReceiptForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="receipts/edit/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          {/* <ReceiptForm /> */}
          <ContractReceiptForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="receipts/:id"
      element={
        <ProtectedRoute requiredRoles={["admin", "manager", "user"]}>
          {/* <ReceiptDetails /> */}
          <ContractReceiptDetails />
        </ProtectedRoute>
      }
    />
  </>
);

export default receiptRoutes;
