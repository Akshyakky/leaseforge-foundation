// src/pages/UnitMaster/Settings/BaseSettingsComponent.tsx
import { useState, useEffect } from "react";
import { unitRelatedService } from "../../../services/unitRelatedService";
import { toast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

export interface BaseEntity {
  [key: string]: any;
  CreatedBy?: string;
  CreatedOn?: string;
  UpdatedBy?: string;
  UpdatedOn?: string;
}

export interface BaseSettingsProps {
  entityType: string;
  entityName: string;
  schema: z.ZodObject<any>;
  tableColumns: { key: string; header: string }[];
  defaultValues: any;
  idKey: string;
  nameKey: string;
  codeKey?: string;
  renderAdditionalFields?: (form: any) => React.ReactNode;
  formatEntityForSubmit?: (data: any) => any;
  additionalFilters?: Record<string, any>;
}

export const BaseSettingsComponent = <T extends BaseEntity>({
  entityType,
  entityName,
  schema,
  tableColumns,
  defaultValues,
  idKey,
  nameKey,
  codeKey,
  renderAdditionalFields,
  formatEntityForSubmit,
  additionalFilters,
}: BaseSettingsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [entities, setEntities] = useState<T[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    loadEntities();
  }, [additionalFilters]);

  const loadEntities = async () => {
    setIsLoading(true);
    try {
      const data = await unitRelatedService.getAllEntities<T>(entityType, additionalFilters);
      setEntities(data);
    } catch (error) {
      console.error(`Failed to load ${entityName}:`, error);
      toast({
        title: "Error",
        description: `Failed to load ${entityName}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setSelectedEntity(null);
    form.reset(defaultValues);
    setIsDialogOpen(true);
  };

  const openEditDialog = (entity: T) => {
    setSelectedEntity(entity);
    const formValues: any = {};

    if (nameKey) formValues[nameKey] = entity[nameKey];
    if (codeKey) formValues[codeKey] = entity[codeKey];
    if (entity.Description) formValues.Description = entity.Description;

    // Handle specific entity fields
    Object.keys(defaultValues).forEach((key) => {
      if (entity[key] !== undefined) {
        formValues[key] = entity[key];
      }
    });

    form.reset(formValues);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      let entityData = { ...data };

      if (formatEntityForSubmit) {
        entityData = formatEntityForSubmit(data);
      }

      if (selectedEntity) {
        // Update existing entity
        const idValue = selectedEntity[idKey];
        const success = await unitRelatedService.updateEntity(entityType, {
          ...entityData,
          [idKey]: idValue,
        });

        if (success) {
          toast({
            title: "Success",
            description: `${entityName} updated successfully.`,
          });
          loadEntities();
          setIsDialogOpen(false);
        }
      } else {
        // Create new entity
        const newId = await unitRelatedService.createEntity(entityType, entityData);
        if (newId) {
          toast({
            title: "Success",
            description: `New ${entityName} created successfully.`,
          });
          loadEntities();
          setIsDialogOpen(false);
        }
      }
    } catch (error) {
      console.error(`Error saving ${entityName}:`, error);
      toast({
        title: "Error",
        description: `Failed to save ${entityName}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (entity: T) => {
    if (window.confirm(`Are you sure you want to delete this ${entityName}?`)) {
      try {
        const success = await unitRelatedService.deleteEntity(entityType, entity[idKey]);
        if (success) {
          toast({
            title: "Success",
            description: `${entityName} deleted successfully.`,
          });
          loadEntities();
        }
      } catch (error) {
        console.error(`Error deleting ${entityName}:`, error);
        toast({
          title: "Error",
          description: `Failed to delete ${entityName}. Please try again.`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{entityName} Management</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add {entityName}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEntity ? `Edit ${entityName}` : `Add New ${entityName}`}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {nameKey && (
                <FormField
                  control={form.control}
                  name={nameKey}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder={`Enter ${entityName} name`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {codeKey && (
                <FormField
                  control={form.control}
                  name={codeKey}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input placeholder={`Enter ${entityName} code`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {renderAdditionalFields && renderAdditionalFields(form)}

              <FormField
                control={form.control}
                name="Description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter description (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{selectedEntity ? "Update" : "Create"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      ) : entities.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-gray-500">No {entityName.toLowerCase()} found.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.map((column) => (
                  <TableHead key={column.key}>{column.header}</TableHead>
                ))}
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => (
                <TableRow key={entity[idKey]}>
                  {tableColumns.map((column) => (
                    <TableCell key={`${entity[idKey]}-${column.key}`}>{entity[column.key]}</TableCell>
                  ))}
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(entity)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(entity)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
