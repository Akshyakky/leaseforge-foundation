import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

type ConfirmationDialogType = "info" | "success" | "warning" | "danger";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  type?: ConfirmationDialogType;
}

const iconMap: Record<ConfirmationDialogType, React.ReactNode> = {
  info: <Info className="h-6 w-6 text-blue-500" />,
  success: <CheckCircle className="h-6 w-6 text-green-500" />,
  warning: <AlertTriangle className="h-6 w-6 text-amber-500" />,
  danger: <AlertCircle className="h-6 w-6 text-red-500" />,
};

const typeClasses: Record<ConfirmationDialogType, string> = {
  info: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, description, cancelText = "Cancel", confirmText = "Confirm", type = "info" }: ConfirmationDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {iconMap[type]}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction className={typeClasses[type]} onClick={handleConfirm}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
