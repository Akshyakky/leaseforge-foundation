// src/pages/email/EmailSetupForm.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, TestTube, Eye, EyeOff } from "lucide-react";
import { emailSetupService } from "@/services/emailSetupService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { EmailSetup, Company } from "@/types/emailTypes";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { companyService } from "@/services";

const formSchema = z
  .object({
    CompanyID: z.string().min(1, "Company is required"),
    SetupName: z.string().min(2, "Setup name must be at least 2 characters").max(250, "Setup name cannot exceed 250 characters"),
    SMTPServer: z.string().min(1, "SMTP server is required").max(250, "SMTP server cannot exceed 250 characters"),
    SMTPPort: z.number().min(1, "Port must be greater than 0").max(65535, "Port must be less than 65536"),
    EnableSSL: z.boolean().default(true),
    EnableTLS: z.boolean().default(true),
    AuthenticationRequired: z.boolean().default(true),
    UserName: z.string().optional(),
    Password: z.string().optional(),
    FromEmail: z.string().email("Please enter a valid from email address"),
    FromDisplayName: z.string().max(250, "Display name cannot exceed 250 characters").optional(),
    ReplyToEmail: z.string().email("Please enter a valid reply-to email address").optional().or(z.string().length(0)),
    MaxRetryAttempts: z.number().min(0, "Retry attempts cannot be negative").max(10, "Retry attempts cannot exceed 10").default(3),
    TimeoutSeconds: z.number().min(1, "Timeout must be at least 1 second").max(300, "Timeout cannot exceed 300 seconds").default(30),
    IsDefault: z.boolean().default(false),
    IsActive: z.boolean().default(true),
    Description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  })
  .refine(
    (data) => {
      // If authentication is required, username and password should be provided
      if (data.AuthenticationRequired && (!data.UserName || !data.Password)) {
        return false;
      }
      return true;
    },
    {
      message: "Username and password are required when authentication is enabled",
      path: ["UserName"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

// Test email form schema
const testEmailSchema = z.object({
  TestToEmail: z.string().email("Please enter a valid email address"),
  TestSubject: z.string().min(1, "Subject is required").optional(),
  TestMessage: z.string().min(1, "Message is required").optional(),
});

type TestEmailFormValues = z.infer<typeof testEmailSchema>;

const EmailSetupForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [emailSetup, setEmailSetup] = useState<EmailSetup | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      CompanyID: "",
      SetupName: "",
      SMTPServer: "",
      SMTPPort: 587,
      EnableSSL: true,
      EnableTLS: true,
      AuthenticationRequired: true,
      UserName: "",
      Password: "",
      FromEmail: "",
      FromDisplayName: "",
      ReplyToEmail: "",
      MaxRetryAttempts: 3,
      TimeoutSeconds: 30,
      IsDefault: false,
      IsActive: true,
      Description: "",
    },
  });

  const testForm = useForm<TestEmailFormValues>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      TestToEmail: "",
      TestSubject: "Email Configuration Test",
      TestMessage: "This is a test email to verify that your email configuration is working correctly.",
    },
  });

  // Watch for authentication required changes
  const authenticationRequired = form.watch("AuthenticationRequired");

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const companiesData = await companyService.getAllCompanies();
        setCompanies(companiesData);
      } catch (error) {
        console.error("Error fetching reference data:", error);
        toast.error("Failed to load form data");
      }
    };

    fetchReferenceData();
  }, []);

  useEffect(() => {
    const fetchEmailSetup = async () => {
      if (isEdit && id) {
        try {
          const setupData = await emailSetupService.getEmailSetupById(parseInt(id));
          if (setupData) {
            setEmailSetup(setupData);
            form.reset({
              CompanyID: setupData.CompanyID.toString(),
              SetupName: setupData.SetupName,
              SMTPServer: setupData.SMTPServer,
              SMTPPort: setupData.SMTPPort,
              EnableSSL: setupData.EnableSSL,
              EnableTLS: setupData.EnableTLS,
              AuthenticationRequired: setupData.AuthenticationRequired,
              UserName: setupData.UserName || "",
              Password: setupData.Password || "",
              FromEmail: setupData.FromEmail,
              FromDisplayName: setupData.FromDisplayName || "",
              ReplyToEmail: setupData.ReplyToEmail || "",
              MaxRetryAttempts: setupData.MaxRetryAttempts,
              TimeoutSeconds: setupData.TimeoutSeconds,
              IsDefault: setupData.IsDefault,
              IsActive: setupData.IsActive,
              Description: setupData.Description || "",
            });
          } else {
            toast.error("Email setup not found");
            navigate("/email/setups");
          }
        } catch (error) {
          console.error("Error fetching email setup:", error);
          toast.error("Error loading email setup");
          navigate("/email/setups");
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    fetchEmailSetup();
  }, [id, isEdit, navigate, form]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const setupData = {
        CompanyID: parseInt(data.CompanyID),
        SetupName: data.SetupName,
        SMTPServer: data.SMTPServer,
        SMTPPort: data.SMTPPort,
        EnableSSL: data.EnableSSL,
        EnableTLS: data.EnableTLS,
        AuthenticationRequired: data.AuthenticationRequired,
        UserName: data.AuthenticationRequired ? data.UserName : undefined,
        Password: data.AuthenticationRequired ? data.Password : undefined,
        FromEmail: data.FromEmail,
        FromDisplayName: data.FromDisplayName,
        ReplyToEmail: data.ReplyToEmail,
        MaxRetryAttempts: data.MaxRetryAttempts,
        TimeoutSeconds: data.TimeoutSeconds,
        IsDefault: data.IsDefault,
        IsActive: data.IsActive,
        Description: data.Description,
      };

      let result;
      if (isEdit && emailSetup) {
        result = await emailSetupService.updateEmailSetup({
          ...setupData,
          EmailSetupID: emailSetup.EmailSetupID,
        });
      } else {
        result = await emailSetupService.createEmailSetup(setupData);
      }

      if (result.success) {
        navigate("/email/setups");
      }
    } catch (error) {
      console.error("Error saving email setup:", error);
      toast.error("Failed to save email setup");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/email/setups");
  };

  const handleTestConfiguration = () => {
    setIsTestDialogOpen(true);
    testForm.reset({
      TestToEmail: "",
      TestSubject: "Email Configuration Test",
      TestMessage: "This is a test email to verify that your email configuration is working correctly.",
    });
  };

  const handleTestEmail = async (testData: TestEmailFormValues) => {
    if (!isEdit || !emailSetup) {
      toast.error("Please save the email setup first before testing");
      return;
    }

    setTestingEmail(true);
    try {
      const result = await emailSetupService.testEmailConfiguration({
        EmailSetupID: emailSetup.EmailSetupID,
        TestToEmail: testData.TestToEmail,
        TestSubject: testData.TestSubject,
        TestMessage: testData.TestMessage,
      });

      if (result.success) {
        toast.success(result.message);
        setIsTestDialogOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error testing email:", error);
      toast.error("Failed to send test email");
    } finally {
      setTestingEmail(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/email/setups")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Email Setup" : "Create Email Setup"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Email Setup" : "Create New Email Setup"}</CardTitle>
          <CardDescription>{isEdit ? "Update the SMTP configuration details" : "Enter the SMTP server details for email configuration"}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Basic Setup Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  form={form}
                  name="CompanyID"
                  label="Company"
                  type="select"
                  options={companies.map((company) => ({
                    label: company.CompanyName,
                    value: company.CompanyID.toString(),
                  }))}
                  placeholder="Select company"
                  required
                />
                <FormField form={form} name="SetupName" label="Setup Name" placeholder="Enter setup name" required />
              </div>

              <Separator />

              {/* SMTP Server Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">SMTP Server Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <FormField form={form} name="SMTPServer" label="SMTP Server" placeholder="smtp.example.com" required />
                  </div>
                  <FormField form={form} name="SMTPPort" label="Port" type="number" placeholder="587" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="EnableSSL"
                    label="SSL Configuration"
                    render={({ field }) => (
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium">Enable SSL</label>
                          <p className="text-sm text-muted-foreground">Use SSL encryption for connection</p>
                        </div>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    )}
                  />

                  <FormField
                    form={form}
                    name="EnableTLS"
                    label="TLS Configuration"
                    render={({ field }) => (
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium">Enable TLS</label>
                          <p className="text-sm text-muted-foreground">Use TLS encryption for connection</p>
                        </div>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Authentication */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Authentication</h3>
                  <FormField
                    form={form}
                    name="AuthenticationRequired"
                    label=""
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        <label className="text-sm font-medium">Authentication Required</label>
                      </div>
                    )}
                  />
                </div>

                {authenticationRequired && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/20">
                    <FormField form={form} name="UserName" label="Username" placeholder="Enter username" required={authenticationRequired} />
                    <div className="relative">
                      <FormField
                        form={form}
                        name="Password"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        required={authenticationRequired}
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-8 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Email Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Email Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField form={form} name="FromEmail" label="From Email" type="email" placeholder="noreply@example.com" required />
                  <FormField form={form} name="FromDisplayName" label="From Display Name" placeholder="Company Name" />
                </div>

                <FormField form={form} name="ReplyToEmail" label="Reply-To Email" type="email" placeholder="support@example.com" />
              </div>

              <Separator />

              {/* Advanced Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Advanced Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="MaxRetryAttempts"
                    label="Max Retry Attempts"
                    type="number"
                    placeholder="3"
                    description="Number of times to retry sending if failed"
                  />
                  <FormField form={form} name="TimeoutSeconds" label="Timeout (Seconds)" type="number" placeholder="30" description="Connection timeout in seconds" />
                </div>
              </div>

              <Separator />

              {/* Status and Default Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Status Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    form={form}
                    name="IsActive"
                    label="Active Status"
                    render={({ field }) => (
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium">Active Status</label>
                          <p className="text-sm text-muted-foreground">Setup will {!field.value && "not"} be available for use</p>
                        </div>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    )}
                  />

                  <FormField
                    form={form}
                    name="IsDefault"
                    label="Default Setup"
                    render={({ field }) => (
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <label className="text-sm font-medium">Default Setup</label>
                          <p className="text-sm text-muted-foreground">Use as default for this company</p>
                        </div>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    )}
                  />
                </div>
              </div>

              <FormField form={form} name="Description" label="Description" placeholder="Enter description or notes about this setup" type="textarea" />

              {/* Test Status Display */}
              {isEdit && emailSetup && (
                <Alert>
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <strong>Test Status:</strong>{" "}
                        {emailSetup.TestEmailSent ? (
                          <Badge className="ml-2 bg-green-50 text-green-700">
                            Last tested: {emailSetup.LastTestDate ? new Date(emailSetup.LastTestDate).toLocaleString() : "Unknown"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 bg-orange-50 text-orange-700">
                            Not tested yet
                          </Badge>
                        )}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleTestConfiguration}>
                        <TestTube className="mr-2 h-4 w-4" />
                        Test Configuration
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t p-4">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <div className="flex space-x-2">
                {isEdit && (
                  <Button type="button" variant="outline" onClick={handleTestConfiguration} disabled={loading}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Test
                  </Button>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Setup
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Test Email Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Test Email Configuration</DialogTitle>
            <DialogDescription>Send a test email to verify the SMTP configuration works correctly</DialogDescription>
          </DialogHeader>
          <Form {...testForm}>
            <form onSubmit={testForm.handleSubmit(handleTestEmail)} className="space-y-4">
              <FormField form={testForm} name="TestToEmail" label="Test Email Address" placeholder="Enter email address to receive test" type="email" required />
              <FormField form={testForm} name="TestSubject" label="Subject" placeholder="Test email subject" />
              <FormField form={testForm} name="TestMessage" label="Message" placeholder="Test email message" type="textarea" />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTestDialogOpen(false)} disabled={testingEmail}>
                  Cancel
                </Button>
                <Button type="submit" disabled={testingEmail}>
                  {testingEmail ? (
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
    </div>
  );
};

export default EmailSetupForm;
