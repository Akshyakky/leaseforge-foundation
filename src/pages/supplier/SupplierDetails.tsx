// src/pages/supplier/SupplierDetails.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supplierService } from "@/services/supplierService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Eye, FileText, Calendar, HandCoins, CreditCard, Building, Phone, Mail, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { Supplier, SupplierContact, SupplierBankDetails, SupplierGLDetails } from "@/types/supplierTypes";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export const SupplierDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [bankDetails, setBankDetails] = useState<SupplierBankDetails[]>([]);
  const [glDetails, setGlDetails] = useState<SupplierGLDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSupplierData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const data = await supplierService.getSupplierById(parseInt(id));

        if (data.supplier) {
          setSupplier(data.supplier);
          setContacts(data.contacts || []);
          setBankDetails(data.bankDetails || []);
          setGlDetails(data.glDetails || []);
        } else {
          setError("Supplier not found");
          toast.error("Supplier not found");
        }
      } catch (err) {
        console.error("Error fetching supplier:", err);
        setError("Failed to load supplier details");
        toast.error("Failed to load supplier details");
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
  }, [id]);

  const handleDelete = async () => {
    if (!supplier) return;

    try {
      const result = await supplierService.deleteSupplier(supplier.SupplierID);
      if (result.Status === 1) {
        toast.success(result.Message || "Supplier deleted successfully");
        navigate("/suppliers");
      } else {
        toast.error(result.Message || "Failed to delete supplier");
      }
    } catch (err) {
      console.error("Error deleting supplier:", err);
      toast.error("Failed to delete supplier");
    }
  };

  if (loading) {
    return (
      <div className="container p-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="container p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-red-500 mb-4">{error || "Supplier not found"}</p>
            <Button onClick={() => navigate("/suppliers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Suppliers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Supplier Details</CardTitle>
            <CardDescription>View supplier information and related details</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/suppliers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate(`/suppliers/edit/${supplier.SupplierID}`)}>
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
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <h2 className="text-2xl font-bold">
                  {supplier.SupplierNo} - {supplier.SupplierName}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={supplier.Status === "Active" ? "default" : "destructive"}
                    className={supplier.Status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {supplier.Status}
                  </Badge>
                  {supplier.HasCreditFacility && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      Credit Facility
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-gray-500 mb-4">{supplier.Remarks || "No remarks provided."}</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Supplier Type:</span>
                    <span className="font-medium">{supplier.SupplierTypeName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Payment Terms:</span>
                    <span className="font-medium">{supplier.PaymentTermName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Credit Limit:</span>
                    <span className="font-medium">{supplier.CreditLimit ? `${supplier.CreditLimit.toFixed(2)}` : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Credit Days:</span>
                    <span className="font-medium">{supplier.CreditDays || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">VAT Reg No:</span>
                    <span className="font-medium">{supplier.VatRegNo || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Tax ID:</span>
                    <span className="font-medium">{supplier.TaxName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Discount %:</span>
                    <span className="font-medium">{supplier.DiscountPercentage ? `${supplier.DiscountPercentage}%` : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{[supplier.CityName, supplier.CountryName].filter(Boolean).join(", ") || "N/A"}</span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {supplier.PhoneNo && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.PhoneNo}</span>
                  </div>
                )}
                {supplier.MobileNo && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.MobileNo}</span>
                  </div>
                )}
                {supplier.Email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supplier.Email}</span>
                  </div>
                )}
                {supplier.Website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={supplier.Website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {supplier.Website}
                    </a>
                  </div>
                )}
              </div>

              {supplier.Address && (
                <div className="mt-4">
                  <span className="text-muted-foreground">Address:</span>
                  <p className="mt-1 text-sm">{supplier.Address}</p>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          <Tabs defaultValue="contacts">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="banking">Banking Details</TabsTrigger>
              <TabsTrigger value="gl-accounts">GL Accounts</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="mt-6">
              <h3 className="text-lg font-medium mb-4">Contact Details</h3>
              {contacts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No contacts found for this supplier.</div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Default</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.SupplierContactID}>
                          <TableCell className="font-medium">{contact.ContactName}</TableCell>
                          <TableCell>{contact.ContactTypeDescription || "N/A"}</TableCell>
                          <TableCell>{contact.Designation || "-"}</TableCell>
                          <TableCell>{contact.EmailID || "-"}</TableCell>
                          <TableCell>{contact.PhoneNo || "-"}</TableCell>
                          <TableCell>{contact.MobileNo || "-"}</TableCell>
                          <TableCell>
                            {contact.IsDefault ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="banking" className="mt-6">
              <h3 className="text-lg font-medium mb-4">Banking Details</h3>
              {bankDetails.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No banking details found for this supplier.</div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account No</TableHead>
                        <TableHead>Bank Name</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>SWIFT Code</TableHead>
                        <TableHead>IBAN</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Default</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankDetails.map((bank) => (
                        <TableRow key={bank.SupplierBankID}>
                          <TableCell className="font-medium">{bank.AccountNo}</TableCell>
                          <TableCell>{bank.BankName || "N/A"}</TableCell>
                          <TableCell>{bank.BranchName || "-"}</TableCell>
                          <TableCell>{bank.SwiftCode || "-"}</TableCell>
                          <TableCell>{bank.IBAN || "-"}</TableCell>
                          <TableCell>{bank.BankCategoryName || "-"}</TableCell>
                          <TableCell>
                            {bank.IsDefault ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="gl-accounts" className="mt-6">
              <h3 className="text-lg font-medium mb-4">GL Account Details</h3>
              {glDetails.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No GL accounts found for this supplier.</div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Account Type</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {glDetails.map((gl) => (
                        <TableRow key={gl.SupplierGLID}>
                          <TableCell className="font-medium">{gl.AccountCode}</TableCell>
                          <TableCell>{gl.AccountName || "N/A"}</TableCell>
                          <TableCell>{gl.AccountTypeName || "-"}</TableCell>
                          <TableCell>{gl.CurrencyName || "-"}</TableCell>
                          <TableCell>
                            {gl.IsDefault ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell>{gl.Remarks || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="mt-6">
              <h3 className="text-lg font-medium mb-4">Transaction History</h3>
              <div className="text-center py-10 text-muted-foreground">Transaction history feature will be implemented when purchase order and invoice modules are available.</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        description={`Are you sure you want to delete the supplier "${supplier.SupplierName}"? This action cannot be undone and will remove all data associated with this supplier.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default SupplierDetails;
