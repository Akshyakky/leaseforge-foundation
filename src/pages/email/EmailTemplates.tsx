// src/pages/email/EmailTemplates.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, Search, Plus, Mail, Eye, Copy, PlayCircle, BarChart3, CheckCircle, XCircle, Calendar, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { emailTemplateService } from "@/services/emailTemplateService";
import { EmailTemplate, Company, EmailTemplateCategory, EmailTemplateType } from "@/types/emailTypes";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { debounce } from "lodash";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { companyService } from "@/services";

const EmailTemplates = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedTriggerEvent, setSelectedTriggerEvent] = useState<string>("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("");

  // Template categories and types
  const templateCategories: EmailTemplateCategory[] = ["Contract", "Invoice", "Payment", "Proposal", "Termination", "Reminder", "Welcome", "General"];

  const templateTypes: EmailTemplateType[] = ["System", "Custom", "Notification", "Marketing", "Transactional"];

  // Fetch email templates and companies on component mount
  useEffect(() => {
    fetchEmailTemplates();
    fetchCompanies();
  }, []);

  // Fetch all email templates
  const fetchEmailTemplates = async (search?: string, companyId?: number, category?: string, type?: string, triggerEvent?: string, isActive?: boolean) => {
    try {
      setLoading(true);
      let templatesData: EmailTemplate[];

      if (search || companyId || category || type || triggerEvent || isActive !== undefined) {
        templatesData = await emailTemplateService.searchEmailTemplates({
          searchText: search,
          companyId: companyId,
          templateCategory: category as EmailTemplateCategory,
          templateType: type as EmailTemplateType,
          triggerEvent: triggerEvent,
          isActive: isActive,
        });
      } else {
        templatesData = await emailTemplateService.getAllEmailTemplates();
      }

      setEmailTemplates(templatesData);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      toast.error("Failed to load email templates");
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies for filtering
  const fetchCompanies = async () => {
    try {
      const companiesData = await companyService.getAllCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (value.length >= 2 || value === "") {
      fetchEmailTemplates(
        value,
        selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
        selectedCategory || undefined,
        selectedType || undefined,
        selectedTriggerEvent || undefined,
        isActiveFilter ? isActiveFilter === "true" : undefined
      );
    }
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleFilterChange = () => {
    fetchEmailTemplates(
      searchTerm,
      selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
      selectedCategory || undefined,
      selectedType || undefined,
      selectedTriggerEvent || undefined,
      isActiveFilter ? isActiveFilter === "true" : undefined
    );
  };

  // Navigation handlers
  const handleAddTemplate = () => {
    navigate("/email/templates/new");
  };

  const handleEditTemplate = (templateId: number) => {
    navigate(`/email/templates/edit/${templateId}`);
  };

  const handleViewTemplate = (templateId: number) => {
    navigate(`/email/templates/${templateId}`);
  };

  // Preview template functionality
  const openPreviewDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const closePreviewDialog = () => {
    setIsPreviewDialogOpen(false);
    setSelectedTemplate(null);
  };

  // Clone template functionality
  const handleCloneTemplate = async (template: EmailTemplate) => {
    try {
      const result = await emailTemplateService.cloneEmailTemplate({
        SourceTemplateID: template.EmailTemplateID,
        NewTemplateCode: `${template.TemplateCode}_COPY`,
        NewTemplateName: `${template.TemplateName} (Copy)`,
      });

      if (result.success) {
        toast.success(result.message);
        fetchEmailTemplates(); // Refresh the list
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error cloning template:", error);
      toast.error("Failed to clone template");
    }
  };

  // Update usage statistics
  const handleUpdateUsage = async (templateId: number) => {
    try {
      await emailTemplateService.updateTemplateUsage(templateId);
      fetchEmailTemplates(); // Refresh to show updated usage
    } catch (error) {
      console.error("Error updating usage:", error);
    }
  };

  // Delete confirmation handlers
  const openDeleteDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedTemplate(null);
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const result = await emailTemplateService.deleteEmailTemplate(selectedTemplate.EmailTemplateID);

      if (result.success) {
        setEmailTemplates(emailTemplates.filter((t) => t.EmailTemplateID !== selectedTemplate.EmailTemplateID));
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting email template:", error);
      toast.error("Failed to delete email template");
    } finally {
      closeDeleteDialog();
    }
  };

  // Render template category badge
  const renderCategoryBadge = (category: EmailTemplateCategory) => {
    const categoryColors = {
      Contract: "bg-blue-50 text-blue-700 border-blue-200",
      Invoice: "bg-green-50 text-green-700 border-green-200",
      Payment: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Proposal: "bg-purple-50 text-purple-700 border-purple-200",
      Termination: "bg-red-50 text-red-700 border-red-200",
      Reminder: "bg-orange-50 text-orange-700 border-orange-200",
      Welcome: "bg-pink-50 text-pink-700 border-pink-200",
      General: "bg-gray-50 text-gray-700 border-gray-200",
    };

    return (
      <Badge variant="outline" className={categoryColors[category] || categoryColors.General}>
        {category}
      </Badge>
    );
  };

  // Render template type badge
  const renderTypeBadge = (type: EmailTemplateType) => {
    const typeColors = {
      System: "bg-slate-50 text-slate-700 border-slate-200",
      Custom: "bg-indigo-50 text-indigo-700 border-indigo-200",
      Notification: "bg-yellow-50 text-yellow-700 border-yellow-200",
      Marketing: "bg-cyan-50 text-cyan-700 border-cyan-200",
      Transactional: "bg-violet-50 text-violet-700 border-violet-200",
    };

    return (
      <Badge variant="outline" className={typeColors[type] || typeColors.Custom}>
        {type}
      </Badge>
    );
  };

  // Render template status
  const renderTemplateStatus = (template: EmailTemplate) => {
    if (!template.IsActive) {
      return (
        <Badge variant="secondary" className="bg-gray-50 text-gray-600">
          <XCircle className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      );
    }

    if (template.AutoSend) {
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200">
          <PlayCircle className="h-3 w-3 mr-1" />
          Auto-Send
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  // Format usage information
  const formatUsage = (template: EmailTemplate) => {
    if (template.UsageCount === 0) {
      return "Never used";
    }

    const lastUsed = template.LastUsedDate ? format(new Date(template.LastUsedDate), "MMM d, yyyy") : "Unknown";

    return `Used ${template.UsageCount} times (Last: ${lastUsed})`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Email Templates</h1>
        <Button onClick={handleAddTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Template Management</CardTitle>
          <CardDescription>Create and manage email templates for automated communications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {/* Search */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search templates..." className="pl-9" value={searchTerm} onChange={handleSearchChange} />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={selectedCompanyId}
                onValueChange={(value) => {
                  setSelectedCompanyId(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.CompanyID} value={company.CompanyID.toString()}>
                      {company.CompanyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Categories</SelectItem>
                  {templateCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedType}
                onValueChange={(value) => {
                  setSelectedType(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Types</SelectItem>
                  {templateTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={isActiveFilter}
                onValueChange={(value) => {
                  setIsActiveFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Status</SelectItem>
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
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Templates</span>
                </div>
                <div className="text-2xl font-bold">{emailTemplates.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Active Templates</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{emailTemplates.filter((t) => t.IsActive).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Auto-Send Templates</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{emailTemplates.filter((t) => t.AutoSend).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">System Templates</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{emailTemplates.filter((t) => t.IsSystemTemplate).length}</div>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : emailTemplates.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedCompanyId || selectedCategory || selectedType || isActiveFilter
                ? "No email templates found matching your criteria."
                : "No email templates created yet."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Template Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Trigger Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailTemplates.map((template) => (
                    <TableRow key={template.EmailTemplateID}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{template.TemplateName}</div>
                          <div className="text-sm text-muted-foreground">Code: {template.TemplateCode}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{template.SubjectLine}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{template.CompanyName}</div>
                      </TableCell>
                      <TableCell>{renderCategoryBadge(template.TemplateCategory)}</TableCell>
                      <TableCell>{renderTypeBadge(template.TemplateType)}</TableCell>
                      <TableCell>
                        {template.TriggerEvent ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            {template.TriggerEvent}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Manual</span>
                        )}
                      </TableCell>
                      <TableCell>{renderTemplateStatus(template)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{template.UsageCount} times</div>
                          <div className="text-muted-foreground">{template.LastUsedDate ? format(new Date(template.LastUsedDate), "MMM d, yyyy") : "Never used"}</div>
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
                            <DropdownMenuItem onClick={() => openPreviewDialog(template)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTemplate(template.EmailTemplateID)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCloneTemplate(template)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Clone
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!template.IsSystemTemplate && (
                              <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(template)}>
                                Delete
                              </DropdownMenuItem>
                            )}
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

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.TemplateName}</DialogTitle>
            <DialogDescription>Preview of email template content</DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Category:</span> {renderCategoryBadge(selectedTemplate.TemplateCategory)}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {renderTypeBadge(selectedTemplate.TemplateType)}
                  </div>
                  <div>
                    <span className="font-medium">Priority:</span>
                    <Badge variant="outline" className="ml-2">
                      {selectedTemplate.Priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Auto Send:</span> {selectedTemplate.AutoSend ? "Yes" : "No"}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Subject Line:</h4>
                  <div className="p-3 bg-muted rounded-md text-sm">{selectedTemplate.SubjectLine}</div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Email Body:</h4>
                  <div className="p-3 bg-muted rounded-md text-sm max-h-[300px] overflow-y-auto">
                    {selectedTemplate.IsHTMLFormat ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedTemplate.EmailBody }} className="prose prose-sm max-w-none" />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">{selectedTemplate.EmailBody}</pre>
                    )}
                  </div>
                </div>

                {selectedTemplate.VariablesUsed && (
                  <div>
                    <h4 className="font-medium mb-2">Variables Used:</h4>
                    <div className="p-3 bg-muted rounded-md text-sm">{selectedTemplate.VariablesUsed}</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closePreviewDialog}>
              Close
            </Button>
            {selectedTemplate && <Button onClick={() => handleEditTemplate(selectedTemplate.EmailTemplateID)}>Edit Template</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteTemplate}
        title="Delete Email Template"
        description={
          selectedTemplate
            ? `Are you sure you want to delete the email template "${selectedTemplate.TemplateName}"? This action cannot be undone.`
            : "Are you sure you want to delete this email template?"
        }
        cancelText="Cancel"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default EmailTemplates;
