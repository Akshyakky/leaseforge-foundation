
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { unitService } from "@/services/unitService";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { unitDropdownService } from "@/services/unitDropdownService";

// Define the UnitContact interface
interface UnitContact {
  UnitContactID: number;
  UnitID: number;
  ContactTypeID: number;
  ContactName: string;
  Remarks?: string;
  ContactTypeName?: string;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

// Define the ContactType interface
interface ContactType {
  ContactTypeID: number;
  ContactTypeDescription: string;
}

// Define the empty contact state
const EMPTY_CONTACT: UnitContact = {
  UnitContactID: 0,
  UnitID: 0,
  ContactTypeID: 0,
  ContactName: "",
  Remarks: "",
};

const UnitContacts: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const unitId = parseInt(id || "0");

  const [contacts, setContacts] = useState<UnitContact[]>([]);
  const [contactTypes, setContactTypes] = useState<ContactType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<UnitContact>(EMPTY_CONTACT);
  const [isEditing, setIsEditing] = useState(false);

  // Load contacts and contact types
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load contact types
        const typesResponse = await unitDropdownService.getContactTypes();
        setContactTypes(typesResponse);

        // Load unit contacts
        if (unitId) {
          const contactsResponse = await unitService.getUnitContacts(unitId);
          setContacts(contactsResponse || []);
        }
      } catch (error) {
        console.error("Error loading contacts data:", error);
        toast.error("Failed to load contacts data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [unitId]);

  // Handle opening the add contact modal
  const handleAddContact = () => {
    setCurrentContact({ ...EMPTY_CONTACT, UnitID: unitId });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Handle opening the edit contact modal
  const handleEditContact = (contact: UnitContact) => {
    setCurrentContact(contact);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Handle opening the delete contact dialog
  const handleDeleteClick = (contact: UnitContact) => {
    setCurrentContact(contact);
    setIsDeleteDialogOpen(true);
  };

  // Handle saving a contact (add or edit)
  const handleSaveContact = async () => {
    if (!currentContact.ContactTypeID || !currentContact.ContactName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (isEditing) {
        // Update existing contact
        await unitService.updateUnitContact(
          currentContact.UnitContactID,
          currentContact.ContactTypeID,
          currentContact.ContactName,
          currentContact.Remarks || ""
        );
        toast.success("Contact updated successfully");
      } else {
        // Add new contact
        await unitService.addUnitContact(
          unitId,
          currentContact.ContactTypeID,
          currentContact.ContactName,
          currentContact.Remarks || ""
        );
        toast.success("Contact added successfully");
      }

      // Refresh contacts list
      const updatedContacts = await unitService.getUnitContacts(unitId);
      setContacts(updatedContacts || []);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("Failed to save contact");
    }
  };

  // Handle deleting a contact
  const handleDeleteContact = async () => {
    try {
      await unitService.deleteUnitContact(currentContact.UnitContactID);
      toast.success("Contact deleted successfully");

      // Refresh contacts list
      const updatedContacts = await unitService.getUnitContacts(unitId);
      setContacts(updatedContacts || []);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Unit Contacts</CardTitle>
        <Button onClick={handleAddContact}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No contacts found. Click "Add Contact" to add a new contact.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.UnitContactID}>
                  <TableCell>{contact.ContactTypeName}</TableCell>
                  <TableCell className="font-medium">{contact.ContactName}</TableCell>
                  <TableCell>{contact.Remarks || "—"}</TableCell>
                  <TableCell>
                    {contact.CreatedBy ? `${formatDate(contact.CreatedOn)} by ${contact.CreatedBy}` : "—"}
                  </TableCell>
                  <TableCell>
                    {contact.UpdatedBy ? `${formatDate(contact.UpdatedOn)} by ${contact.UpdatedBy}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditContact(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(contact)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add/Edit Contact Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditing ? "Edit Contact" : "Add New Contact"}
          footer={
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveContact}>
                {isEditing ? "Update Contact" : "Add Contact"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="contactType" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Type *
              </label>
              <select
                id="contactType"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={currentContact.ContactTypeID}
                onChange={(e) =>
                  setCurrentContact({ ...currentContact, ContactTypeID: parseInt(e.target.value) })
                }
              >
                <option value="">Select a contact type</option>
                {contactTypes.map((type) => (
                  <option key={type.ContactTypeID} value={type.ContactTypeID}>
                    {type.ContactTypeDescription}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name *
              </label>
              <Input
                id="contactName"
                value={currentContact.ContactName}
                onChange={(e) => setCurrentContact({ ...currentContact, ContactName: e.target.value })}
                placeholder="Enter contact name"
              />
            </div>
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <Textarea
                id="remarks"
                value={currentContact.Remarks || ""}
                onChange={(e) => setCurrentContact({ ...currentContact, Remarks: e.target.value })}
                placeholder="Enter any additional information"
                rows={3}
              />
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteContact}
          title="Delete Contact"
          description={`Are you sure you want to delete the contact "${currentContact.ContactName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </CardContent>
    </Card>
  );
};

export default UnitContacts;
