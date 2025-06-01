import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bankService } from "@/services/bankService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Building2, Globe, CreditCard, Calendar, User, Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { Bank } from "@/types/bankTypes";
import { format } from "date-fns";

export const BankDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bank, setBank] = useState<Bank | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchBankData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const bankData = await bankService.getBankById(parseInt(id));

        if (bankData) {
          setBank(bankData);
        } else {
          setError("Bank not found");
          toast.error("Bank not found");
        }
      } catch (err) {
        console.error("Error fetching bank:", err);
        setError("Failed to load bank details");
        toast.error("Failed to load bank details");
      } finally {
        setLoading(false);
      }
    };

    fetchBankData();
  }, [id]);

  const handleDelete = async () => {
    if (!bank) return;

    try {
      const result = await bankService.deleteBank(bank.BankID);
      if (result.Status === 1) {
        toast.success(result.Message || "Bank deleted successfully");
        navigate("/banks");
      } else {
        toast.error(result.Message || "Failed to delete bank");
      }
    } catch (err) {
      console.error("Error deleting bank:", err);
      toast.error("Failed to delete bank");
    }
  };

  const handleCopySwiftCode = () => {
    if (bank?.SwiftCode) {
      navigator.clipboard.writeText(bank.SwiftCode);
      toast.success("SWIFT code copied to clipboard");
    }
  };

  const handleCopyBankCode = () => {
    if (bank?.BankCode) {
      navigator.clipboard.writeText(bank.BankCode);
      toast.success("Bank code copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="container p-4">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded-md w-3/4 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded-md w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bank) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Bank not found"}</p>
            <Button onClick={() => navigate("/banks")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Banks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "PPP");
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Bank Details</CardTitle>
            <CardDescription>View and manage bank information</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/banks")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/banks/edit/${bank.BankID}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex items-center justify-center md:justify-start">
              <div className="h-24 w-24 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h2 className="text-2xl font-bold">{bank.BankName}</h2>
                <Badge variant={bank.IsActive ? "default" : "secondary"} className={bank.IsActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {bank.IsActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Bank Code:</span>
                  <code className="bg-muted px-2 py-1 rounded text-sm">{bank.BankCode}</code>
                  <Button variant="ghost" size="sm" onClick={handleCopyBankCode}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {bank.SwiftCode && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">SWIFT Code:</span>
                    <code className="bg-muted px-2 py-1 rounded text-sm">{bank.SwiftCode}</code>
                    <Button variant="ghost" size="sm" onClick={handleCopySwiftCode}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`https://www.swift.com/our-solutions/compliance-and-shared-services/business-intelligence/standards/iso-9362`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                )}
                {bank.CountryName && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Country:</span>
                    <span>{bank.CountryName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span>{formatDate(bank.CreatedOn)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bank Information</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Bank ID:</span>
                  <span>{bank.BankID}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Bank Code:</span>
                  <span className="font-mono">{bank.BankCode}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Bank Name:</span>
                  <span>{bank.BankName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">SWIFT Code:</span>
                  <span className="font-mono">{bank.SwiftCode || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Country:</span>
                  <span>{bank.CountryName || "Not specified"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  <Badge variant={bank.IsActive ? "default" : "secondary"} className={bank.IsActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {bank.IsActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">System Information</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                  <span>{bank.CreatedBy || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Created On:</span>
                  <span>{formatDate(bank.CreatedOn)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Last Updated By:</span>
                  <span>{bank.UpdatedBy || "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Last Updated On:</span>
                  <span>{bank.UpdatedOn ? formatDate(bank.UpdatedOn) : "—"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Record Status:</span>
                  <Badge variant="outline">{bank.RecordStatus === 1 ? "Active" : "Deleted"}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* SWIFT Code Information */}
          {bank.SwiftCode && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">SWIFT Code Information</h3>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Bank Code:</span>
                      <p className="font-mono text-lg">{bank.SwiftCode.substring(0, 4)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Country Code:</span>
                      <p className="font-mono text-lg">{bank.SwiftCode.substring(4, 6)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Location Code:</span>
                      <p className="font-mono text-lg">{bank.SwiftCode.substring(6, 8)}</p>
                    </div>
                    {bank.SwiftCode.length > 8 && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Branch Code:</span>
                        <p className="font-mono text-lg">{bank.SwiftCode.substring(8)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Usage Information */}
          <Separator className="my-6" />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Usage & Integration</h3>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-900">This bank can be used in:</p>
                <ul className="space-y-1 text-blue-800 ml-4">
                  <li>• Supplier bank details</li>
                  <li>• Payment voucher bank references</li>
                  <li>• Receipt deposit bank information</li>
                  <li>• Bank transfer transactions</li>
                  <li>• Cheque processing</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Bank"
        description={`Are you sure you want to delete "${bank.BankName}"? This action cannot be undone and may affect related transactions and supplier records.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default BankDetails;
