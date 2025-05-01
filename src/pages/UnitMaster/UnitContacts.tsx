
// src/pages/UnitMaster/UnitContacts.tsx
import { useState, useEffect } from "react";
import { UnitContactsProps, ContactRow, ContactOption } from "./types";
import { EMPTY_CONTACT } from "./constants";
import { Plus, Save, X, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { unitService } from "../../services/unitService";
import { contactTypeService } from "../../services/contactTypeService";

export const UnitContacts: React.FC<UnitContactsProps> = ({ unitId, contacts, onContactsChange, readOnly = false }) => {
  const [contactRows, setContactRows] = useState<ContactRow[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [contactTypes, setContactTypes] = useState<ContactOption[]>([]);

  // Initialize contacts state from props
  useEffect(() => {
    setContactRows(contacts.map((contact) => ({ ...contact })));
  }, [contacts]);

  // Load contact types from API
  useEffect(() => {
    const fetchContactTypes = async () => {
      try {
        const types = await contactTypeService.getAll();
        setContactTypes(types);
      } catch (error) {
        console.error("Failed to load contact types:", error);
        // Fallback to mock data if API fails
        setContactTypes([
          { ContactTypeID: 1, ContactTypeDescription: "Owner" },
          { ContactTypeID: 2, ContactTypeDescription: "Agent" },
          { ContactTypeID: 3, ContactTypeDescription: "Property Manager" },
          { ContactTypeID: 4, ContactTypeDescription: "Tenant" },
          { ContactTypeID: 5, ContactTypeDescription: "Maintenance" },
          { ContactTypeID: 6, ContactTypeDescription: "Emergency Contact" },
        ]);
      }
    };
    
    fetchContactTypes();
  }, []);

  const handleAddContact = () => {
    const newContact = {
      ...EMPTY_CONTACT,
      UnitID: unitId,
      isNew: true,
    };
    setContactRows([...contactRows, newContact]);
    setEditingRow(contactRows.length);
  };

  const handleEditRow = (index: number) => {
    setEditingRow(index);
  };

  const handleSaveRow = async (index: number) => {
    const contact = contactRows[index];
    
    try {
      if (contact.isNew) {
        // Add new contact
        await unitService.addContact(unitId, {
          ContactTypeID: contact.ContactTypeID,
          ContactName: contact.ContactName,
          Remarks: contact.Remarks || "",
        });
      } else {
        // Update existing contact
        await unitService.updateContact(contact.UnitContactID, {
          ContactTypeID: contact.ContactTypeID,
          ContactName: contact.ContactName,
          Remarks: contact.Remarks || "",
        });
      }
      
      setEditingRow(null);
      updateChanges();
    } catch (error) {
      console.error("Failed to save contact:", error);
    }
  };

  const handleCancelEdit = (index: number) => {
    // If it's a new row, remove it
    if (contactRows[index].isNew) {
      setContactRows(contactRows.filter((_, i) => i !== index));
    }
    setEditingRow(null);
  };

  const handleDeleteRow = async (index: number) => {
    const rowToDelete = contactRows[index];

    if (!rowToDelete.isNew && rowToDelete.UnitContactID) {
      try {
        // Delete from API
        await unitService.deleteContact(rowToDelete.UnitContactID);
        
        // Mark as deleted in UI
        setContactRows(contactRows.map((row, i) => (i === index ? { ...row, isDeleted: true } : row)));
      } catch (error) {
        console.error("Failed to delete contact:", error);
        return;
      }
    } else {
      // If it's a new row, just remove it from the list
      setContactRows(contactRows.filter((_, i) => i !== index));
    }

    updateChanges();
  };

  const handleInputChange = (index: number, field: keyof ContactRow, value: string | number) => {
    setContactRows(contactRows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const updateChanges = () => {
    // Filter out deleted rows and clean up temporary flags
    const updatedContacts = contactRows.filter((row) => !row.isDeleted).map(({ isNew, isDeleted, ...rest }) => rest);

    onContactsChange(updatedContacts);
  };

  const getContactTypeName = (typeId: number): string => {
    const type = contactTypes.find((t) => t.ContactTypeID === typeId);
    return type ? type.ContactTypeDescription : "";
  };

  const visibleRows = contactRows.filter((row) => !row.isDeleted);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Unit Contacts</h3>
        {!readOnly && (
          <Button onClick={handleAddContact} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        )}
      </div>

      {visibleRows.length === 0 ? (
        <div className="text-center py-8 border rounded-lg text-gray-500">No contacts associated with this unit.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Remarks</TableHead>
                {!readOnly && <TableHead className="w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((contact, index) => (
                <TableRow key={contact.UnitContactID || `new-${index}`}>
                  <TableCell>
                    {editingRow === index ? (
                      <Select value={contact.ContactTypeID.toString()} onValueChange={(value) => handleInputChange(index, "ContactTypeID", parseInt(value, 10))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {contactTypes.map((type) => (
                            <SelectItem key={type.ContactTypeID} value={type.ContactTypeID.toString()}>
                              {type.ContactTypeDescription}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      getContactTypeName(contact.ContactTypeID)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRow === index ? (
                      <Input value={contact.ContactName} onChange={(e) => handleInputChange(index, "ContactName", e.target.value)} placeholder="Contact Name" />
                    ) : (
                      contact.ContactName
                    )}
                  </TableCell>
                  <TableCell>
                    {editingRow === index ? (
                      <Input value={contact.Remarks || ""} onChange={(e) => handleInputChange(index, "Remarks", e.target.value)} placeholder="Remarks" />
                    ) : (
                      contact.Remarks || "-"
                    )}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <div className="flex space-x-1">
                        {editingRow === index ? (
                          <>
                            <Button variant="outline" size="icon" onClick={() => handleSaveRow(index)} title="Save">
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleCancelEdit(index)} title="Cancel">
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="icon" onClick={() => handleEditRow(index)} title="Edit">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRow(index)} title="Delete" className="text-red-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default UnitContacts;
