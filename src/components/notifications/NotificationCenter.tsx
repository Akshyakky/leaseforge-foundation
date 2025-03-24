import React, { useState } from "react";
import { Bell, X, Check, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { clearNotifications, removeNotification } from "@/features/ui/uiSlice";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "success":
      return <Check className="h-5 w-5 text-green-500" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "info":
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

const NotificationCenter = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector((state) => state.ui);
  const [open, setOpen] = useState(false);

  const handleClearAll = () => {
    dispatch(clearNotifications());
  };

  const handleDismiss = (id: string) => {
    dispatch(removeNotification(id));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px]">
              {notifications.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[440px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>{t("notifications.title", "Notifications")}</SheetTitle>
          <SheetDescription>
            {notifications.length > 0
              ? t("notifications.description", "You have {{count}} unread notifications", { count: notifications.length })
              : t("notifications.empty", "No new notifications")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center justify-between px-4 py-2 border-b">
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              {t("notifications.clearAll", "Clear all")}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <AnimatePresence>
            {notifications.length > 0 ? (
              <div className="py-2">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn("flex items-start gap-3 p-4 border-b last:border-0 relative", `bg-${notification.type === "error" ? "destructive" : notification.type}/5`)}
                  >
                    <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium break-words">{notification.message}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => handleDismiss(notification.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Info className="h-10 w-10 mb-2 opacity-20" />
                <p>{t("notifications.noNotifications", "No notifications")}</p>
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
