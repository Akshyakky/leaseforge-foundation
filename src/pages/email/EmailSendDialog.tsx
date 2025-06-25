// src/components/email/EmailSendDialog.tsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Send, Eye, Plus, Trash2, Users, Calendar, Clock, Info, Variable, Loader2, X, Copy, CheckCircle } from "lucide-react";
import { useEmailIntegration } from "@/hooks/useEmailIntegration";
import { EmailTemplate, EmailPreviewResult } from "@/types/emailTypes";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

interface EmailSendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "contract" | "termination";
  entityId: number;
  entityData: any;
  defaultRecipients?: Array<{
    email: string;
    name: string;
    type: "to" | "cc" | "bcc";
  }>;
  triggerEvent?: string;
  onEmailSent?: (result: any) => void;
}

interface Recipient {
  email: string;
  name: string;
  type: "to" | "cc" | "bcc";
}

export const EmailSendDialog: React.FC<EmailSendDialogProps> = ({ isOpen, onClose, entityType, entityId, entityData, defaultRecipients = [], triggerEvent, onEmailSent }) => {
  const [activeTab, setActiveTab] = useState("compose");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>(defaultRecipients);
  const [newRecipient, setNewRecipient] = useState<Recipient>({ email: "", name: "", type: "to" });
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [emailPreview, setEmailPreview] = useState<EmailPreviewResult | null>(null);
  const [showVariables, setShowVariables] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { isLoading, emailTemplates, loadEmailTemplates, previewEmail, sendEmail, generateContractVariables, generateTerminationVariables } = useEmailIntegration({
    entityType,
    entityId,
    triggerEvent,
  });

  // Load templates when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadEmailTemplates();
    }
  }, [isOpen, loadEmailTemplates]);

  // Auto-select template if triggerEvent is provided
  useEffect(() => {
    if (triggerEvent && emailTemplates.length > 0) {
      const matchingTemplate = emailTemplates.find((t) => t.TriggerEvent === triggerEvent);
      if (matchingTemplate) {
        setSelectedTemplateId(matchingTemplate.EmailTemplateID);
        setSelectedTemplate(matchingTemplate);
      }
    }
  }, [triggerEvent, emailTemplates]);

  // Generate variables based on entity type
  const generateVariables = () => {
    if (entityType === "contract") {
      return generateContractVariables(entityData);
    } else {
      return generateTerminationVariables(entityData);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find((t) => t.EmailTemplateID === parseInt(templateId));
    setSelectedTemplateId(parseInt(templateId));
    setSelectedTemplate(template || null);
    setEmailPreview(null);
  };

  // Add recipient
  const addRecipient = () => {
    if (!newRecipient.email || !newRecipient.name) {
      toast.error("Please enter both email and name");
      return;
    }

    if (recipients.some((r) => r.email === newRecipient.email)) {
      toast.error("Email already added");
      return;
    }

    setRecipients([...recipients, { ...newRecipient }]);
    setNewRecipient({ email: "", name: "", type: "to" });
  };

  // Remove recipient
  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  // Update recipient type
  const updateRecipientType = (index: number, type: "to" | "cc" | "bcc") => {
    const updated = [...recipients];
    updated[index].type = type;
    setRecipients(updated);
  };

  // Preview email
  const handlePreviewEmail = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template");
      return;
    }

    const variables = generateVariables();
    const preview = await previewEmail({
      TemplateID: selectedTemplateId,
      Variables: variables,
    });

    if (preview) {
      setEmailPreview(preview);
      setActiveTab("preview");
    }
  };

  // Send email
  const handleSendEmail = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template");
      return;
    }

    if (recipients.filter((r) => r.type === "to").length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    setIsSending(true);

    try {
      const variables = generateVariables();

      // Add custom subject and message to variables if provided
      if (customSubject) {
        variables.CustomSubject = customSubject;
      }
      if (customMessage) {
        variables.CustomMessage = customMessage;
      }

      const result = await sendEmail({
        templateId: selectedTemplateId,
        recipients,
        variables,
        scheduledDate: scheduledDate || undefined,
      });

      if (result.success) {
        onEmailSent?.(result);
        onClose();
        // Reset form
        setSelectedTemplateId(null);
        setSelectedTemplate(null);
        setRecipients(defaultRecipients);
        setCustomSubject("");
        setCustomMessage("");
        setScheduledDate(null);
        setEmailPreview(null);
        setActiveTab("compose");
      }
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setIsSending(false);
    }
  };

  const getRecipientTypeColor = (type: string) => {
    switch (type) {
      case "to":
        return "bg-blue-100 text-blue-800";
      case "cc":
        return "bg-green-100 text-green-800";
      case "bcc":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const variables = generateVariables();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email - {entityType === "contract" ? "Contract" : "Termination"} {entityType === "contract" ? entityData.ContractNo : entityData.TerminationNo}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="preview" disabled={!emailPreview}>
                Preview
              </TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-6 mt-4">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Email Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Template</Label>
                      <Select value={selectedTemplateId?.toString() || ""} onValueChange={handleTemplateSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an email template" />
                        </SelectTrigger>
                        <SelectContent>
                          {emailTemplates.map((template) => (
                            <SelectItem key={template.EmailTemplateID} value={template.EmailTemplateID.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <span>{template.TemplateName}</span>
                                <div className="flex gap-2">
                                  <Badge variant="outline">{template.TemplateCategory}</Badge>
                                  {template.TriggerEvent && (
                                    <Badge variant="secondary" className="text-xs">
                                      {template.TriggerEvent}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTemplate && (
                      <div className="p-3 bg-muted rounded-md">
                        <div className="font-medium">{selectedTemplate.TemplateName}</div>
                        <div className="text-sm text-muted-foreground mt-1">{selectedTemplate.Description}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{selectedTemplate.TemplateCategory}</Badge>
                          <Badge variant="outline">{selectedTemplate.TemplateType}</Badge>
                          {selectedTemplate.IsHTMLFormat && <Badge variant="outline">HTML</Badge>}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recipients */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Add Recipient Form */}
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="recipient@example.com"
                          value={newRecipient.email}
                          onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label>Name</Label>
                        <Input placeholder="Recipient Name" value={newRecipient.name} onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })} />
                      </div>
                      <div className="col-span-3">
                        <Label>Type</Label>
                        <Select value={newRecipient.type} onValueChange={(value: "to" | "cc" | "bcc") => setNewRecipient({ ...newRecipient, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="to">To</SelectItem>
                            <SelectItem value="cc">CC</SelectItem>
                            <SelectItem value="bcc">BCC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Button onClick={addRecipient} className="w-full">
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Recipients List */}
                    {recipients.length > 0 && (
                      <div className="space-y-2">
                        <Label>Email Recipients</Label>
                        <div className="border rounded-md divide-y">
                          {recipients.map((recipient, index) => (
                            <div key={index} className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                <Badge className={getRecipientTypeColor(recipient.type)}>{recipient.type.toUpperCase()}</Badge>
                                <div>
                                  <div className="font-medium">{recipient.name}</div>
                                  <div className="text-sm text-muted-foreground">{recipient.email}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Select value={recipient.type} onValueChange={(value: "to" | "cc" | "bcc") => updateRecipientType(index, value)}>
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="to">To</SelectItem>
                                    <SelectItem value="cc">CC</SelectItem>
                                    <SelectItem value="bcc">BCC</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button variant="ghost" size="sm" onClick={() => removeRecipient(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Optional Customizations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Optional Customizations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Custom Subject (Optional)</Label>
                      <Input placeholder="Override template subject line" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} />
                    </div>

                    <div>
                      <Label>Additional Message (Optional)</Label>
                      <Textarea placeholder="Add a custom message to include with the template" value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} rows={3} />
                    </div>

                    <div>
                      <Label>Schedule Send (Optional)</Label>
                      <DatePicker value={scheduledDate} onChange={setScheduledDate} placeholder="Send immediately" disabled={(date) => date < new Date()} />
                      {scheduledDate && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Scheduled for {scheduledDate.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4 mt-4">
              {emailPreview ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Email Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Subject</Label>
                        <div className="p-3 bg-muted rounded-md font-medium">{customSubject || emailPreview.Subject}</div>
                      </div>

                      <Separator />

                      <div>
                        <Label>Message Body</Label>
                        <div className="border rounded-md p-4 bg-white min-h-[200px]">
                          {customMessage && (
                            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400">
                              <div className="font-medium text-blue-800 mb-1">Custom Message:</div>
                              <div className="text-blue-700">{customMessage}</div>
                            </div>
                          )}
                          {emailPreview.IsHTML ? (
                            <div dangerouslySetInnerHTML={{ __html: emailPreview.Body }} />
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans">{emailPreview.Body}</pre>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>Select a template and click "Preview Email" to see how the email will look.</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="variables" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Available Variables</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <Variable className="h-4 w-4" />
                    <AlertDescription>These variables will be automatically replaced with actual values when the email is sent.</AlertDescription>
                  </Alert>

                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="entity-info">
                      <AccordionTrigger>{entityType === "contract" ? "Contract Information" : "Termination Information"}</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(variables)
                            .filter(([key]) =>
                              entityType === "contract"
                                ? key.includes("Contract") || key.includes("Total") || key.includes("Approval")
                                : key.includes("Termination") || key.includes("Refund") || key.includes("Deposit")
                            )
                            .map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-mono text-sm">{`{${key}}`}</div>
                                  <div className="text-xs text-muted-foreground">{String(value) || "N/A"}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`{{${key}}}`);
                                    toast.success("Variable copied to clipboard");
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="customer-info">
                      <AccordionTrigger>Customer Information</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(variables)
                            .filter(([key]) => key.includes("Customer"))
                            .map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-mono text-sm">{`{${key}}`}</div>
                                  <div className="text-xs text-muted-foreground">{String(value) || "N/A"}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`{{${key}}}`);
                                    toast.success("Variable copied to clipboard");
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="property-info">
                      <AccordionTrigger>Property Information</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(variables)
                            .filter(([key]) => key.includes("Property") || key.includes("Unit"))
                            .map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-mono text-sm">{`{${key}}`}</div>
                                  <div className="text-xs text-muted-foreground">{String(value) || "N/A"}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`{{${key}}}`);
                                    toast.success("Variable copied to clipboard");
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="system-info">
                      <AccordionTrigger>System Information</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(variables)
                            .filter(([key]) => key.includes("Company") || key.includes("Current"))
                            .map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-mono text-sm">{`{${key}}`}</div>

                                  <div className="text-xs text-muted-foreground">{String(value) || "N/A"}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`{{${key}}}`);
                                    toast.success("Variable copied to clipboard");
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {selectedTemplateId && (
                <Button variant="outline" onClick={handlePreviewEmail} disabled={isLoading}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Email
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail} disabled={!selectedTemplateId || recipients.length === 0 || isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : scheduledDate ? (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Email
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
