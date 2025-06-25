// src/hooks/useEmailIntegration.ts
import { useState, useCallback } from "react";
import { emailTemplateService } from "@/services/emailTemplateService";
import { emailSetupService } from "@/services/emailSetupService";
import { EmailSendRequest, EmailPreviewRequest, EmailTemplate, EmailSetup, EmailTriggerEvent } from "@/types/emailTypes";
import { toast } from "sonner";

interface EmailIntegrationOptions {
  entityType: "contract" | "termination";
  entityId: number;
  triggerEvent?: string;
}

interface EmailRecipient {
  email: string;
  name: string;
  type: "to" | "cc" | "bcc";
}

interface EmailSendOptions {
  templateId: number;
  recipients: EmailRecipient[];
  variables: Record<string, any>;
  customSubject?: string;
  customMessage?: string;
  scheduledDate?: Date;
}

export const useEmailIntegration = (options: EmailIntegrationOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailSetups, setEmailSetups] = useState<EmailSetup[]>([]);
  const [triggerEvents, setTriggerEvents] = useState<EmailTriggerEvent[]>([]);

  // Load email templates for the entity type
  const loadEmailTemplates = useCallback(
    async (category?: string) => {
      try {
        setIsLoading(true);
        const templates = await emailTemplateService.getAllEmailTemplates({
          templateCategory: category || (options.entityType === "contract" ? "Contract" : "Termination"),
          isActive: true,
        });
        setEmailTemplates(templates);
        return templates;
      } catch (error) {
        console.error("Error loading email templates:", error);
        toast.error("Failed to load email templates");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [options.entityType]
  );

  // Load email setups
  const loadEmailSetups = useCallback(async () => {
    try {
      const setups = await emailSetupService.getAllEmailSetups({ isActive: true });
      setEmailSetups(setups);
      return setups;
    } catch (error) {
      console.error("Error loading email setups:", error);
      toast.error("Failed to load email configurations");
      return [];
    }
  }, []);

  // Load trigger events
  const loadTriggerEvents = useCallback(async () => {
    try {
      const events = await emailTemplateService.getEmailTriggerEvents();
      setTriggerEvents(events);
      return events;
    } catch (error) {
      console.error("Error loading trigger events:", error);
      return [];
    }
  }, []);

  // Get templates by trigger event
  const getTemplatesByTrigger = useCallback(async (triggerEvent: string) => {
    try {
      const templates = await emailTemplateService.getTemplatesByTriggerEvent(triggerEvent);
      return templates.filter((t) => t.IsActive);
    } catch (error) {
      console.error("Error loading templates by trigger:", error);
      return [];
    }
  }, []);

  // Preview email with variables
  const previewEmail = useCallback(async (previewRequest: EmailPreviewRequest) => {
    try {
      setIsLoading(true);
      const preview = await emailTemplateService.previewEmailTemplate(previewRequest);
      return preview;
    } catch (error) {
      console.error("Error previewing email:", error);
      toast.error("Failed to preview email");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send email
  const sendEmail = useCallback(async (sendOptions: EmailSendOptions) => {
    try {
      setIsLoading(true);

      const toEmails = sendOptions.recipients.filter((r) => r.type === "to").map((r) => r.email);

      const ccEmails = sendOptions.recipients.filter((r) => r.type === "cc").map((r) => r.email);

      const bccEmails = sendOptions.recipients.filter((r) => r.type === "bcc").map((r) => r.email);

      const sendRequest: EmailSendRequest = {
        TemplateID: sendOptions.templateId,
        ToEmails: toEmails,
        CcEmails: ccEmails.length > 0 ? ccEmails : undefined,
        BccEmails: bccEmails.length > 0 ? bccEmails : undefined,
        Variables: sendOptions.variables,
        ScheduledDate: sendOptions.scheduledDate,
      };

      const result = await emailTemplateService.sendEmail(sendRequest);

      if (result.Success) {
        toast.success("Email sent successfully");
        return { success: true, emailId: result.EmailId };
      } else {
        toast.error(result.Message || "Failed to send email");
        return { success: false, error: result.Message };
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
      return { success: false, error: "Network error" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send automated email based on trigger event
  const sendAutomatedEmail = useCallback(
    async (triggerEvent: string, variables: Record<string, any>, recipients?: EmailRecipient[]) => {
      try {
        const templates = await getTemplatesByTrigger(triggerEvent);
        const autoSendTemplates = templates.filter((t) => t.AutoSend);

        if (autoSendTemplates.length === 0) {
          console.log(`No auto-send templates found for trigger: ${triggerEvent}`);
          return { success: true, message: "No automated emails configured" };
        }

        const results = await Promise.all(
          autoSendTemplates.map((template) => {
            const defaultRecipients = recipients || [{ email: variables.CustomerEmail, name: variables.CustomerName, type: "to" as const }];

            return sendEmail({
              templateId: template.EmailTemplateID,
              recipients: defaultRecipients,
              variables,
            });
          })
        );

        const successCount = results.filter((r) => r.success).length;
        const totalCount = results.length;

        if (successCount === totalCount) {
          toast.success(`${successCount} automated email(s) sent successfully`);
        } else {
          toast.warning(`${successCount} of ${totalCount} automated emails sent`);
        }

        return {
          success: successCount > 0,
          successCount,
          totalCount,
          results,
        };
      } catch (error) {
        console.error("Error sending automated emails:", error);
        return { success: false, error: "Failed to send automated emails" };
      }
    },
    [getTemplatesByTrigger, sendEmail]
  );

  // Generate email variables for contract
  const generateContractVariables = useCallback((contract: any, additionalData?: any) => {
    return {
      // Contract Information
      ContractNumber: contract.ContractNo,
      ContractStatus: contract.ContractStatus,
      ContractStartDate: contract.TransactionDate,
      TotalAmount: contract.GrandTotal,

      // Customer Information
      CustomerName: contract.CustomerName,
      CustomerEmail: contract.CustomerEmail || additionalData?.customerEmail,
      CustomerPhone: contract.CustomerPhone || additionalData?.customerPhone,

      // Joint Customer (if applicable)
      JointCustomerName: contract.JointCustomerName,

      // Property Information (from units)
      PropertyName: additionalData?.propertyName || "Multiple Properties",
      UnitNumbers: additionalData?.unitNumbers || "Multiple Units",

      // Approval Information
      ApprovalStatus: contract.ApprovalStatus,
      ApprovedBy: contract.ApprovedBy,
      ApprovedOn: contract.ApprovedOn,

      // System Information
      CurrentDate: new Date().toLocaleDateString(),
      CompanyName: additionalData?.companyName || "Property Management Company",
      CompanyEmail: additionalData?.companyEmail || "admin@company.com",
      CompanyPhone: additionalData?.companyPhone || "+1-555-000-0000",

      // Additional custom variables
      ...additionalData?.customVariables,
    };
  }, []);

  // Generate email variables for termination
  const generateTerminationVariables = useCallback((termination: any, additionalData?: any) => {
    return {
      // Termination Information
      TerminationNumber: termination.TerminationNo,
      TerminationStatus: termination.TerminationStatus,
      TerminationDate: termination.TerminationDate,
      EffectiveDate: termination.EffectiveDate,
      NoticeDate: termination.NoticeDate,
      TerminationReason: termination.TerminationReason,

      // Financial Information
      SecurityDepositAmount: termination.SecurityDepositAmount,
      TotalDeductions: termination.TotalDeductions,
      RefundAmount: termination.RefundAmount,
      CreditNoteAmount: termination.CreditNoteAmount,

      // Contract Information
      ContractNumber: termination.ContractNo,

      // Customer Information
      CustomerName: termination.CustomerFullName,
      CustomerEmail: additionalData?.customerEmail,
      CustomerPhone: additionalData?.customerPhone,

      // Property Information
      PropertyName: termination.PropertyName,
      UnitNumbers: termination.UnitNumbers,

      // Refund Information
      IsRefundProcessed: termination.IsRefundProcessed,
      RefundDate: termination.RefundDate,
      RefundReference: termination.RefundReference,

      // Approval Information
      ApprovalStatus: termination.ApprovalStatus,
      ApprovedBy: termination.ApprovedBy,
      ApprovedOn: termination.ApprovedOn,

      // System Information
      CurrentDate: new Date().toLocaleDateString(),
      CompanyName: additionalData?.companyName || "Property Management Company",
      CompanyEmail: additionalData?.companyEmail || "admin@company.com",
      CompanyPhone: additionalData?.companyPhone || "+1-555-000-0000",

      // Additional custom variables
      ...additionalData?.customVariables,
    };
  }, []);

  return {
    // State
    isLoading,
    emailTemplates,
    emailSetups,
    triggerEvents,

    // Methods
    loadEmailTemplates,
    loadEmailSetups,
    loadTriggerEvents,
    getTemplatesByTrigger,
    previewEmail,
    sendEmail,
    sendAutomatedEmail,
    generateContractVariables,
    generateTerminationVariables,
  };
};
