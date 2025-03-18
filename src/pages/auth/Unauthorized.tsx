import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="space-y-6 max-w-md">
        <div className="mx-auto bg-amber-100 text-amber-800 rounded-full w-20 h-20 flex items-center justify-center">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold">Unauthorized Access</h1>
        <p className="text-muted-foreground">You don't have permission to access this page. Please contact your administrator if you believe this is an error.</p>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
