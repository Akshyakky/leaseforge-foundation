// src/pages/email/EmailTemplateForm.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save, Eye, Send, Copy, Code, Palette, Settings } from "lucide-react";
import { emailTemplateService } from "@/services/emailTemplateService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { EmailTemplate, Company, EmailTemplateCategory, EmailTemplateType, EmailPriority, EmailTriggerEvent, EmailVariable, EmailVariableCategory } from "@/types/emailTypes";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { companyService } from "@/services";

const formSchema = z
  .object({
    CompanyID: z.string().min(1, "Company is required"),
    TemplateCode: z.string().min(2, "Template code must be at least 2 characters").max(50, "Template code cannot exceed 50 characters"),
    TemplateName: z.string().min(2, "Template name must be at least 2 characters").max(250, "Template name cannot exceed 250 characters"),
    TemplateCategory: z.enum(["Contract", "Invoice", "Payment", "Proposal", "Termination", "Reminder", "Welcome", "General"]),
    TemplateType: z.enum(["System", "Custom", "Notification", "Marketing", "Transactional"]),
    SubjectLine: z.string().min(1, "Subject line is required").max(500, "Subject line cannot exceed 500 characters"),
    EmailBody: z.string().min(1, "Email body is required"),
    IsHTMLFormat: z.boolean().default(true),
    BccEmails: z.string().optional(),
    CcEmails: z.string().optional(),
    AttachmentRequired: z.boolean().default(false),
    DefaultAttachmentPath: z.string().optional(),
    VariablesUsed: z.string().optional(),
    TriggerEvent: z.string().optional(),
    AutoSend: z.boolean().default(false),
    RequiresApproval: z.boolean().default(false),
    ApprovalLevel: z.number().min(1).max(5).optional(),
    Priority: z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
    LanguageCode: z.string().max(10).optional(),
    IsActive: z.boolean().default(true),
    EffectiveFromDate: z.date().optional().nullable(),
    ExpiryDate: z.date().optional().nullable(),
    Description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  })
  .refine(
    (data) => {
      // If requires approval, approval level should be provided
      if (data.RequiresApproval && !data.ApprovalLevel) {
        return false;
      }
      return true;
    },
    {
      message: "Approval level is required when approval is enabled",
      path: ["ApprovalLevel"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

const EmailTemplateForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [triggerEvents, setTriggerEvents] = useState<EmailTriggerEvent[]>([]);
  const [emailVariables, setEmailVariables] = useState<EmailVariableCategory[]>([]);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: "", body: "" });
  const [isVariablesDialogOpen, setIsVariablesDialogOpen] = useState(false);

  // Template categories, types, and priorities
  const templateCategories: { value: EmailTemplateCategory; label: string }[] = [
    { value: "Contract", label: "Contract Management" },
    { value: "Invoice", label: "Invoice & Billing" },
    { value: "Payment", label: "Payment Processing" },
    { value: "Proposal", label: "Lease Proposals" },
    { value: "Termination", label: "Contract Termination" },
    { value: "Reminder", label: "Reminders & Notifications" },
    { value: "Welcome", label: "Welcome Messages" },
    { value: "General", label: "General Communications" },
  ];

  const templateTypes: { value: EmailTemplateType; label: string }[] = [
    { value: "System", label: "System Generated" },
    { value: "Custom", label: "Custom Template" },
    { value: "Notification", label: "Notification" },
    { value: "Marketing", label: "Marketing" },
    { value: "Transactional", label: "Transactional" },
  ];

  const priorityLevels: { value: EmailPriority; label: string }[] = [
    { value: "Low", label: "Low Priority" },
    { value: "Normal", label: "Normal Priority" },
    { value: "High", label: "High Priority" },
    { value: "Urgent", label: "Urgent" },
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      CompanyID: "",
      TemplateCode: "",
      TemplateName: "",
      TemplateCategory: "General",
      TemplateType: "Custom",
      SubjectLine: "",
      EmailBody: "",
      IsHTMLFormat: true,
      BccEmails: "",
      CcEmails: "",
      AttachmentRequired: false,
      DefaultAttachmentPath: "",
      VariablesUsed: "",
      TriggerEvent: "",
      AutoSend: false,
      RequiresApproval: false,
      ApprovalLevel: undefined,
      Priority: "Normal",
      LanguageCode: "",
      IsActive: true,
      EffectiveFromDate: null,
      ExpiryDate: null,
      Description: "",
    },
  });

  // Watch for values that affect other fields
  const requiresApproval = form.watch("RequiresApproval");
  const autoSend = form.watch("AutoSend");
  const isHTMLFormat = form.watch("IsHTMLFormat");

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [companiesData, triggerEventsData, variablesData] = await Promise.all([
          companyService.getAllCompanies(),
          emailTemplateService.getEmailTriggerEvents(),
          emailTemplateService.getEmailVariables(),
        ]);

        setCompanies(companiesData);
        setTriggerEvents(triggerEventsData);
        setEmailVariables(variablesData);
      } catch (error) {
        console.error("Error fetching reference data:", error);
        toast.error("Failed to load form data");
      }
    };

    fetchReferenceData();
  }, []);

  useEffect(() => {
    const fetchEmailTemplate = async () => {
      if (isEdit && id) {
        try {
          const templateData = await emailTemplateService.getEmailTemplateById(parseInt(id));
          if (templateData) {
            setEmailTemplate(templateData);
            form.reset({
              CompanyID: templateData.CompanyID.toString(),
              TemplateCode: templateData.TemplateCode,
              TemplateName: templateData.TemplateName,
              TemplateCategory: templateData.TemplateCategory,
              TemplateType: templateData.TemplateType,
              SubjectLine: templateData.SubjectLine,
              EmailBody: templateData.EmailBody,
              IsHTMLFormat: templateData.IsHTMLFormat,
              BccEmails: templateData.BccEmails || "",
              CcEmails: templateData.CcEmails || "",
              AttachmentRequired: templateData.AttachmentRequired,
              DefaultAttachmentPath: templateData.DefaultAttachmentPath || "",
              VariablesUsed: templateData.VariablesUsed || "",
              TriggerEvent: templateData.TriggerEvent || "",
              AutoSend: templateData.AutoSend,
              RequiresApproval: templateData.RequiresApproval,
              ApprovalLevel: templateData.ApprovalLevel,
              Priority: templateData.Priority,
              LanguageCode: templateData.LanguageCode || "",
              IsActive: templateData.IsActive,
              EffectiveFromDate: templateData.EffectiveFromDate ? new Date(templateData.EffectiveFromDate) : null,
              ExpiryDate: templateData.ExpiryDate ? new Date(templateData.ExpiryDate) : null,
              Description: templateData.Description || "",
            });
          } else {
            toast.error("Email template not found");
            navigate("/email/templates");
          }
        } catch (error) {
          console.error("Error fetching email template:", error);
          toast.error("Error loading email template");
          navigate("/email/templates");
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };

    fetchEmailTemplate();
  }, [id, isEdit, navigate, form]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const templateData = {
        CompanyID: parseInt(data.CompanyID),
        TemplateCode: data.TemplateCode,
        TemplateName: data.TemplateName,
        TemplateCategory: data.TemplateCategory,
        TemplateType: data.TemplateType,
        SubjectLine: data.SubjectLine,
        EmailBody: data.EmailBody,
        IsHTMLFormat: data.IsHTMLFormat,
        BccEmails: data.BccEmails,
        CcEmails: data.CcEmails,
        AttachmentRequired: data.AttachmentRequired,
        DefaultAttachmentPath: data.DefaultAttachmentPath,
        VariablesUsed: data.VariablesUsed,
        TriggerEvent: data.TriggerEvent,
        AutoSend: data.AutoSend,
        RequiresApproval: data.RequiresApproval,
        ApprovalLevel: data.RequiresApproval ? data.ApprovalLevel : undefined,
        Priority: data.Priority,
        LanguageCode: data.LanguageCode,
        IsActive: data.IsActive,
        EffectiveFromDate: data.EffectiveFromDate,
        ExpiryDate: data.ExpiryDate,
        Description: data.Description,
      };

      let result;
      if (isEdit && emailTemplate) {
        result = await emailTemplateService.updateEmailTemplate({
          ...templateData,
          EmailTemplateID: emailTemplate.EmailTemplateID,
        });
      } else {
        result = await emailTemplateService.createEmailTemplate(templateData);
      }

      if (result.success) {
        navigate("/email/templates");
      }
    } catch (error) {
      console.error("Error saving email template:", error);
      toast.error("Failed to save email template");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/email/templates");
  };

  const handlePreview = () => {
    const formData = form.getValues();
    setPreviewContent({
      subject: formData.SubjectLine,
      body: formData.EmailBody,
    });
    setIsPreviewDialogOpen(true);
  };

  const handleInsertVariable = (variable: string) => {
    const currentBody = form.getValues("EmailBody");
    const newBody = currentBody + variable;
    form.setValue("EmailBody", newBody);

    // Update variables used
    const currentVariables = form.getValues("VariablesUsed");
    const variablesList = currentVariables ? currentVariables.split(", ") : [];
    if (!variablesList.includes(variable)) {
      variablesList.push(variable);
      form.setValue("VariablesUsed", variablesList.join(", "));
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
        <Button variant="outline" size="icon" onClick={() => navigate("/email/templates")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? "Edit Email Template" : "Create Email Template"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Edit Email Template" : "Create New Email Template"}</CardTitle>
                <CardDescription>{isEdit ? "Update the email template details" : "Design and configure a new email template"}</CardDescription>
              </CardHeader>

              <Tabs defaultValue="basic" className="pt-2">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Details</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="automation">Automation</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="basic" className="p-6 pt-4 space-y-6">
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
                    <FormField form={form} name="TemplateCode" label="Template Code" placeholder="TEMPLATE_CODE" required description="Unique identifier for this template" />
                  </div>

                  <FormField form={form} name="TemplateName" label="Template Name" placeholder="Enter template name" required />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      form={form}
                      name="TemplateCategory"
                      label="Category"
                      type="select"
                      options={templateCategories.map((cat) => ({
                        label: cat.label,
                        value: cat.value,
                      }))}
                      placeholder="Select category"
                      required
                    />
                    <FormField
                      form={form}
                      name="TemplateType"
                      label="Type"
                      type="select"
                      options={templateTypes.map((type) => ({
                        label: type.label,
                        value: type.value,
                      }))}
                      placeholder="Select type"
                      required
                    />
                  </div>

                  <FormField form={form} name="Description" label="Description" placeholder="Enter template description" type="textarea" />
                </TabsContent>

                <TabsContent value="content" className="p-6 pt-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Email Content</h3>
                    <div className="flex space-x-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsVariablesDialogOpen(true)}>
                        <Code className="mr-2 h-4 w-4" />
                        Variables
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handlePreview}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                  </div>

                  <FormField form={form} name="SubjectLine" label="Subject Line" placeholder="Enter email subject" required />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Email Body</Label>
                      <FormField
                        form={form}
                        name="IsHTMLFormat"
                        label=""
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                            <label className="text-sm font-medium">HTML Format</label>
                          </div>
                        )}
                      />
                    </div>

                    <FormField
                      form={form}
                      name="EmailBody"
                      label=""
                      type="textarea"
                      placeholder={isHTMLFormat ? "Enter email body in HTML format..." : "Enter plain text email body..."}
                      className="min-h-[300px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField form={form} name="CcEmails" label="CC Emails" placeholder="cc1@example.com, cc2@example.com" description="Comma-separated email addresses" />
                    <FormField form={form} name="BccEmails" label="BCC Emails" placeholder="bcc1@example.com, bcc2@example.com" description="Comma-separated email addresses" />
                  </div>

                  <FormField
                    form={form}
                    name="VariablesUsed"
                    label="Variables Used"
                    placeholder="{{CustomerName}}, {{ContractNumber}}"
                    description="Comma-separated list of variables used in this template"
                  />
                </TabsContent>

                <TabsContent value="settings" className="p-6 pt-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Template Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        form={form}
                        name="Priority"
                        label="Priority Level"
                        type="select"
                        options={priorityLevels.map((priority) => ({
                          label: priority.label,
                          value: priority.value,
                        }))}
                        placeholder="Select priority"
                      />
                      <FormField form={form} name="LanguageCode" label="Language Code" placeholder="en, es, fr, etc." description="ISO language code" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField form={form} name="EffectiveFromDate" label="Effective From" type="date" description="Template will be available from this date" />
                      <FormField form={form} name="ExpiryDate" label="Expiry Date" type="date" description="Template will expire on this date" />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Attachment Settings</h4>
                      <FormField
                        form={form}
                        name="AttachmentRequired"
                        label="Attachment Required"
                        render={({ field }) => (
                          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium">Require Attachments</label>
                              <p className="text-sm text-muted-foreground">Email must include attachments when sent</p>
                            </div>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </div>
                        )}
                      />

                      {form.watch("AttachmentRequired") && (
                        <FormField
                          form={form}
                          name="DefaultAttachmentPath"
                          label="Default Attachment Path"
                          placeholder="/documents/templates/"
                          description="Default path for template attachments"
                        />
                      )}
                    </div>

                    <FormField
                      form={form}
                      name="IsActive"
                      label="Active Status"
                      render={({ field }) => (
                        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Active Status</label>
                            <p className="text-sm text-muted-foreground">Template will {!field.value && "not"} be available for use</p>
                          </div>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="automation" className="p-6 pt-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Automation Settings</h3>

                    <FormField
                      form={form}
                      name="TriggerEvent"
                      label="Trigger Event"
                      type="select"
                      options={triggerEvents.map((event) => ({
                        label: event.EventName,
                        value: event.EventCode,
                      }))}
                      placeholder="Select trigger event (optional)"
                      description="Event that will automatically trigger this template"
                    />

                    <FormField
                      form={form}
                      name="AutoSend"
                      label="Auto Send"
                      render={({ field }) => (
                        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Auto Send</label>
                            <p className="text-sm text-muted-foreground">Automatically send when triggered</p>
                          </div>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />

                    {autoSend && (
                      <Alert>
                        <AlertDescription>
                          <strong>Warning:</strong> Auto-send templates will be sent automatically when triggered. Ensure the template content is thoroughly tested before enabling
                          this feature.
                        </AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      form={form}
                      name="RequiresApproval"
                      label="Requires Approval"
                      render={({ field }) => (
                        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium">Requires Approval</label>
                            <p className="text-sm text-muted-foreground">Template must be approved before sending</p>
                          </div>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </div>
                      )}
                    />

                    {requiresApproval && (
                      <FormField
                        form={form}
                        name="ApprovalLevel"
                        label="Approval Level"
                        type="number"
                        placeholder="1"
                        description="Number of approval levels required (1-5)"
                        required={requiresApproval}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <CardFooter className="flex justify-between border-t p-6">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                  Cancel
                </Button>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={handlePreview} disabled={loading}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Template
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>Preview of how the email will appear to recipients</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Subject:</h4>
                <div className="p-3 bg-muted rounded-md text-sm">{previewContent.subject}</div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Body:</h4>
                <div className="p-3 bg-muted rounded-md text-sm max-h-[400px] overflow-y-auto">
                  {isHTMLFormat ? (
                    <div dangerouslySetInnerHTML={{ __html: previewContent.body }} className="prose prose-sm max-w-none" />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans">{previewContent.body}</pre>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variables Dialog */}
      <Dialog open={isVariablesDialogOpen} onOpenChange={setIsVariablesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Available Variables</DialogTitle>
            <DialogDescription>Click on any variable to insert it into your template</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {emailVariables.map((category) => (
                <div key={category.CategoryName}>
                  <h4 className="font-medium mb-3">{category.CategoryName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.Variables.map((variable) => (
                      <Card key={variable.VariableName} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleInsertVariable(variable.VariableName)}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{variable.VariableName}</code>
                              <p className="text-sm text-muted-foreground mt-1">{variable.Description}</p>
                              {variable.SampleValue && <p className="text-xs text-muted-foreground mt-1">Example: {variable.SampleValue}</p>}
                            </div>
                            <Button variant="ghost" size="sm">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVariablesDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplateForm;
