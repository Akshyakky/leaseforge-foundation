// src/pages/email/EmailSetups.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Server, Settings, TestTube, CheckCircle, XCircle, AlertCircle, Star } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { emailService } from "@/services/emailService";
import { EmailSetup, Company } from "@/types/emailTypes";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/forms/FormField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import * as z from "zod";

const testEmailSchema = z.object({
  TestToEmail: z.string().email("Please enter a valid email address"),
  TestSubject: z.string().min(1, "Subject is required").optional(),
  TestMessage: z.string().min(1, "Message is required").optional(),
});

type TestEmailFormValues = z.infer<typeof testEmailSchema>;

const EmailSetups = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [emailSetups, setEmailSetups] = useState<EmailSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSetup, setSelectedSetup] = useState<EmailSetup | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("");
  const [testingSetup, setTestingSetup] = useState(false);

  // Test email form
  const testForm = useForm<TestEmailFormValues>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      TestToEmail: "",
      TestSubject: "Email Configuration Test",
      TestMessage: "This is a test email to verify that your email configuration is working correctly.",
    },
  });

  // Fetch email setups and companies on component mount
  useEffect(() => {
    fetchEmailSetups();
    fetchCompanies();
  }, []);

  // Fetch all email setups
  const fetchEmailSetups = async (search?: string, companyId?: number, isActive?: boolean) => {
    try {
      setLoading(true);
      let setupsData: EmailSetup[];

      if (search || companyId || isActive !== undefined) {
        setupsData = await emailService.searchEmailSetups({
          searchText: search,
          companyId: companyId,
          isActive: isActive,
        });
      } else {
        setupsData = await emailService.getAllEmailSetups();
      }

      setEmailSetups(setupsData);
    } catch (error) {
      console.error("Error fetching email setups:", error);
      toast.error("Failed to load email setups");
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies for filtering
  const fetchCompanies = async () => {
    try {
      const companiesData = await emailService.getCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchEmailSetups(value, selectedCompanyId ? parseInt(selectedCompanyId) : undefined, isActiveFilter ? isActiveFilter === "true" : undefined);
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle company filter change
  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    fetchEmailSetups(searchTerm, value ? parseInt(value) : undefined, isActiveFilter ? isActiveFilter === "true" : undefined);
  };

  // Handle active filter change
  const handleActiveFilterChange = (value: string) => {
    setIsActiveFilter(value);
    fetchEmailSetups(searchTerm, selectedCompanyId ? parseInt(selectedCompanyId) : undefined, value ? value === "true" : undefined);
  };

  // Navigation handlers
  const handleAddSetup = () => {
    navigate("/email/setups/new");
  };

  const handleEditSetup = (setupId: number) => {
    navigate(`/email/setups/edit/${setupId}`);
  };

  const handleViewSetup = (setupId: number) => {
    navigate(`/email/setups/${setupId}`);
  };

  // Test email functionality
  const openTestDialog = (setup: EmailSetup) => {
    setSelectedSetup(setup);
    setIsTestDialogOpen(true);
    testForm.reset({
      TestToEmail: "",
      TestSubject: "Email Configuration Test",
      TestMessage: "This is a test email to verify that your email configuration is working correctly.",
    });
  };

  const closeTestDialog = () => {
    setIsTestDialogOpen(false);
    setSelectedSetup(null);
  };

  const handleTestEmail = async (data: TestEmailFormValues) => {
    if (!selectedSetup) return;

    setTestingSetup(true);
    try {
      const result = await emailService.testEmailConfiguration({
        EmailSetupID: selectedSetup.EmailSetupID,
        TestToEmail: data.TestToEmail,
        TestSubject: data.TestSubject,
        TestMessage: data.TestMessage,
      });

      if (result.success) {
        toast.success(result.message);
        closeTestDialog();
        // Refresh the setups to update test status
        fetchEmailSetups();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error testing email:", error);
      toast.error("Failed to send test email");
    } finally {
      setTestingSetup(false);
    }
  };

  // Set as default functionality
  const handleSetAsDefault = async (setup: EmailSetup) => {
    try {
      const result = await emailService.setDefaultEmailSetup(setup.EmailSetupID);

      if (result.success) {
        toast.success(result.message);
        // Refresh the setups to update default status
        fetchEmailSetups();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error setting default setup:", error);
      toast.error("Failed to set as default");
    }
  };

  // Delete confirmation handlers
  const openDeleteDialog = (setup: EmailSetup) => {
    setSelectedSetup(setup);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedSetup(null);
  };

  const handleDeleteSetup = async () => {
    if (!selectedSetup) return;

    try {
      const result = await emailService.deleteEmailSetup(selectedSetup.EmailSetupID);

      if (result.success) {
        setEmailSetups(emailSetups.filter((s) => s.EmailSetupID !== selectedSetup.EmailSetupID));
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting email setup:", error);
      toast.error("Failed to delete email setup");
    } finally {
      closeDeleteDialog();
    }
  };

  // Render setup status
  const renderSetupStatus = (setup: EmailSetup) => {
    if (setup.IsDefault) {
      return (
        <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Star className="h-3 w-3 mr-1" />
          Default
        </Badge>
      );
    }

    if (!setup.IsActive) {
      return (
        <Badge variant="secondary" className="bg-gray-50 text-gray-600">
          <XCircle className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      );
    }

    if (setup.TestEmailSent && setup.LastTestDate) {
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Tested
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        Untested
      </Badge>
    );
  };

  // Format last test date
  const formatLastTestDate = (dateString?: string | Date) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Email Setups</h1>
        <Button onClick={handleAddSetup}>
          <Plus className="mr-2 h-4 w-4" />
          Add Email Setup
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>SMTP Configuration Management</CardTitle>
          <CardDescription>Configure and manage email server settings for each company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search email setups..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.CompanyID} value={company.CompanyID.toString()}>
                      {company.CompanyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={isActiveFilter} onValueChange={handleActiveFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="true">Active Only</SelectItem>
                  <SelectItem value="false">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Setups</span>
                </div>
                <div className="text-2xl font-bold">{emailSetups.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Active Setups</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{emailSetups.filter((s) => s.IsActive).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Tested Setups</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{emailSetups.filter((s) => s.TestEmailSent).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-muted-foreground">Default Setups</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{emailSetups.filter((s) => s.IsDefault).length}</div>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : emailSetups.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedCompanyId || isActiveFilter ? "No email setups found matching your criteria." : "No email setups configured yet."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Setup Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>SMTP Server</TableHead>
                    <TableHead>From Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Test</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailSetups.map((setup) => (
                    <TableRow key={setup.EmailSetupID}>
                      <TableCell>
                        <div className="font-medium">{setup.SetupName}</div>
                        <div className="text-sm text-muted-foreground">{setup.Description || "No description"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{setup.CompanyName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{setup.SMTPServer}</span>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>Port: {setup.SMTPPort}</span>
                            {setup.EnableSSL && (
                              <Badge variant="outline" className="text-xs">
                                SSL
                              </Badge>
                            )}
                            {setup.EnableTLS && (
                              <Badge variant="outline" className="text-xs">
                                TLS
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{setup.FromEmail}</span>
                          {setup.FromDisplayName && <span className="text-sm text-muted-foreground">{setup.FromDisplayName}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{renderSetupStatus(setup)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{formatLastTestDate(setup.LastTestDate)}</span>
                          {setup.TestResult && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{setup.TestResult}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSetup(setup.EmailSetupID)}>
                              <Settings className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openTestDialog(setup)}>
                              <TestTube className="mr-2 h-4 w-4" />
                              Test Configuration
                            </DropdownMenuItem>
                            {!setup.IsDefault && setup.IsActive && (
                              <DropdownMenuItem onClick={() => handleSetAsDefault(setup)}>
                                <Star className="mr-2 h-4 w-4" />
                                Set as Default
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(setup)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Email Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Test Email Configuration</DialogTitle>
            <DialogDescription>Send a test email to verify the SMTP configuration for "{selectedSetup?.SetupName}"</DialogDescription>
          </DialogHeader>
          <Form {...testForm}>
            <form onSubmit={testForm.handleSubmit(handleTestEmail)} className="space-y-4">
              <FormField form={testForm} name="TestToEmail" label="Test Email Address" placeholder="Enter email address to receive test" type="email" required />
              <FormField form={testForm} name="TestSubject" label="Subject" placeholder="Test email subject" />
              <FormField form={testForm} name="TestMessage" label="Message" placeholder="Test email message" type="textarea" />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeTestDialog} disabled={testingSetup}>
                  Cancel
                </Button>
                <Button type="submit" disabled={testingSetup}>
                  {testingSetup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteSetup}
        title="Delete Email Setup"
        description={
          selectedSetup
            ? `Are you sure you want to delete the email setup "${selectedSetup.SetupName}"? This action cannot be undone.`
            : "Are you sure you want to delete this email setup?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default EmailSetups;
