import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { costCenterService } from "@/services/costCenterService";
import { FormField } from "@/components/forms/FormField";
import { toast } from "sonner";
import { CostCenter1, CostCenter2, CostCenter3, CostCenter4 } from "@/types/costCenterTypes";
import { useAppSelector } from "@/lib/hooks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";

// Form schema for cost center
const formSchema = z.object({
  Description: z.string().min(2, "Description must be at least 2 characters").max(255, "Description cannot exceed 255 characters"),
  CostCenter1ID: z.string().optional(),
  CostCenter2ID: z.string().optional(),
  CostCenter3ID: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Type guard functions to narrow down cost center types
function isCostCenter2(center: CostCenter1 | CostCenter2 | CostCenter3 | CostCenter4): center is CostCenter2 {
  return "CostCenter2ID" in center;
}

function isCostCenter3(center: CostCenter1 | CostCenter2 | CostCenter3 | CostCenter4): center is CostCenter3 {
  return "CostCenter3ID" in center;
}

function isCostCenter4(center: CostCenter1 | CostCenter2 | CostCenter3 | CostCenter4): center is CostCenter4 {
  return "CostCenter4ID" in center;
}

const CostCenterForm = () => {
  const { level, id } = useParams<{ level?: string; id?: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  // Extract level from params or query params
  const costCenterLevel = level ? parseInt(level) : parseInt(searchParams.get("level") || "1");
  const isEdit = !!id;

  // Extract parent IDs from query params (for creation mode)
  const parent1Id = searchParams.get("parent1");
  const parent2Id = searchParams.get("parent2");
  const parent3Id = searchParams.get("parent3");

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [costCenter, setCostCenter] = useState<CostCenter1 | CostCenter2 | CostCenter3 | CostCenter4 | null>(null);

  // States for parent selections
  const [level1Options, setLevel1Options] = useState<CostCenter1[]>([]);
  const [level2Options, setLevel2Options] = useState<CostCenter2[]>([]);
  const [level3Options, setLevel3Options] = useState<CostCenter3[]>([]);

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Description: "",
      CostCenter1ID: parent1Id || "",
      CostCenter2ID: parent2Id || "",
      CostCenter3ID: parent3Id || "",
    },
  });

  // Load data based on level and mode (edit/create)
  useEffect(() => {
    const loadData = async () => {
      try {
        setInitialLoading(true);

        // For edit mode, fetch the current cost center
        if (isEdit && id) {
          const centerData = await costCenterService.getCostCenterById(costCenterLevel, parseInt(id));
          if (centerData) {
            setCostCenter(centerData);

            // Set form values based on level
            const formValues: Partial<FormValues> = {
              Description: centerData.Description,
            };

            if (costCenterLevel >= 2) {
              formValues.CostCenter1ID = centerData.CostCenter1ID.toString();
            }

            if (costCenterLevel >= 3 && isCostCenter3(centerData)) {
              formValues.CostCenter2ID = centerData.CostCenter2ID.toString();
            }

            if (costCenterLevel >= 4 && isCostCenter4(centerData)) {
              formValues.CostCenter3ID = centerData.CostCenter3ID.toString();
            }

            form.reset(formValues);
          } else {
            toast.error("Cost center not found");
            navigate("/cost-centers");
            return;
          }
        }

        // Load parent options based on level
        if (costCenterLevel >= 2) {
          // Level 1 options needed for level 2, 3, 4
          const level1Data = await costCenterService.getCostCentersByLevel(1);
          setLevel1Options(level1Data as CostCenter1[]);

          // If we have a parent1Id set, load level 2 options
          if ((parent1Id || form.getValues().CostCenter1ID) && costCenterLevel >= 3) {
            const selectedLevel1Id = parseInt(parent1Id || form.getValues().CostCenter1ID || "0");
            const level2Data = await costCenterService.getChildCostCenters(2, {
              CostCenter1ID: selectedLevel1Id,
            });
            setLevel2Options(level2Data as CostCenter2[]);

            // If we have a parent2Id set, load level 3 options
            if ((parent2Id || form.getValues().CostCenter2ID) && costCenterLevel >= 4) {
              const selectedLevel2Id = parseInt(parent2Id || form.getValues().CostCenter2ID || "0");
              const level3Data = await costCenterService.getChildCostCenters(3, {
                CostCenter1ID: selectedLevel1Id,
                CostCenter2ID: selectedLevel2Id,
              });
              setLevel3Options(level3Data as CostCenter3[]);
            }
          }
        }
      } catch (error) {
        console.error("Error loading cost center data:", error);
        toast.error("Failed to load cost center data");
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [costCenterLevel, id, isEdit, navigate, form]);

  // Handle Level 1 selection change
  const handleLevel1Change = async (value: string) => {
    try {
      // Reset dependent fields
      form.setValue("CostCenter2ID", "");
      form.setValue("CostCenter3ID", "");
      setLevel2Options([]);
      setLevel3Options([]);

      if (value) {
        const selectedLevel1Id = parseInt(value);
        const level2Data = await costCenterService.getChildCostCenters(2, {
          CostCenter1ID: selectedLevel1Id,
        });
        setLevel2Options(level2Data as CostCenter2[]);
      }
    } catch (error) {
      console.error("Error loading Level 2 options:", error);
      toast.error("Failed to load child cost centers");
    }
  };

  // Handle Level 2 selection change
  const handleLevel2Change = async (value: string) => {
    try {
      // Reset dependent fields
      form.setValue("CostCenter3ID", "");
      setLevel3Options([]);

      if (value) {
        const selectedLevel1Id = parseInt(form.getValues().CostCenter1ID || "0");
        const selectedLevel2Id = parseInt(value);
        const level3Data = await costCenterService.getChildCostCenters(3, {
          CostCenter1ID: selectedLevel1Id,
          CostCenter2ID: selectedLevel2Id,
        });
        setLevel3Options(level3Data as CostCenter3[]);
      }
    } catch (error) {
      console.error("Error loading Level 3 options:", error);
      toast.error("Failed to load child cost centers");
    }
  };

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        Level: costCenterLevel,
        Description: data.Description,
        CurrentUserID: user.id,
        CurrentUserName: user.name,
      } as any;

      // Add parent IDs based on level
      if (costCenterLevel >= 2 && data.CostCenter1ID) {
        requestData.CostCenter1ID = parseInt(data.CostCenter1ID);
      }

      if (costCenterLevel >= 3 && data.CostCenter2ID) {
        requestData.CostCenter2ID = parseInt(data.CostCenter2ID);
      }

      if (costCenterLevel >= 4 && data.CostCenter3ID) {
        requestData.CostCenter3ID = parseInt(data.CostCenter3ID);
      }

      // Add the ID for edit mode
      if (isEdit && id) {
        requestData[`CostCenter${costCenterLevel}ID`] = parseInt(id);
      }

      // Call API to create or update
      const response = isEdit ? await costCenterService.updateCostCenter(requestData) : await costCenterService.createCostCenter(requestData);

      if (response.Status === 1) {
        toast.success(response.Message);
        navigate("/cost-centers");
      } else {
        toast.error(response.Message || "Failed to save cost center");
      }
    } catch (error) {
      console.error("Error saving cost center:", error);
      toast.error("An error occurred while saving the cost center");
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate("/cost-centers");
  };

  // Determine form title and labels based on level
  const getLevelLabel = () => {
    switch (costCenterLevel) {
      case 1:
        return "Level 1";
      case 2:
        return "Level 2";
      case 3:
        return "Level 3";
      case 4:
        return "Level 4";
      default:
        return "Cost Center";
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Custom render function for Level 1 dropdown
  const renderLevel1Select = ({ field, fieldState }: any) => (
    <FormControl>
      <Select
        disabled={isEdit}
        onValueChange={(value) => {
          field.onChange(value);
          handleLevel1Change(value);
        }}
        defaultValue={field.value}
        value={field.value}
      >
        <SelectTrigger className={fieldState.error ? "border-destructive" : ""}>
          <SelectValue placeholder="Select Level 1 Cost Center" />
        </SelectTrigger>
        <SelectContent>
          {level1Options.map((option) => (
            <SelectItem key={option.CostCenter1ID} value={option.CostCenter1ID.toString()}>
              {option.Description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
  );

  // Custom render function for Level 2 dropdown
  const renderLevel2Select = ({ field, fieldState }: any) => (
    <FormControl>
      <Select
        disabled={isEdit || !form.getValues().CostCenter1ID}
        onValueChange={(value) => {
          field.onChange(value);
          handleLevel2Change(value);
        }}
        defaultValue={field.value}
        value={field.value}
      >
        <SelectTrigger className={fieldState.error ? "border-destructive" : ""}>
          <SelectValue placeholder="Select Level 2 Cost Center" />
        </SelectTrigger>
        <SelectContent>
          {level2Options.map((option) => (
            <SelectItem key={option.CostCenter2ID} value={option.CostCenter2ID.toString()}>
              {option.Description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/cost-centers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">{isEdit ? `Edit ${getLevelLabel()} Cost Center` : `Create ${getLevelLabel()} Cost Center`}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? `Edit ${getLevelLabel()} Cost Center` : `Create New ${getLevelLabel()} Cost Center`}</CardTitle>
          <CardDescription>{isEdit ? "Update the cost center details" : `Enter the details for the new ${getLevelLabel()} cost center`}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Level 1 Parent Selection (for levels 2, 3, 4) */}
              {costCenterLevel >= 2 && (
                <FormField
                  form={form}
                  name="CostCenter1ID"
                  label="Level 1 Cost Center"
                  type="select"
                  options={level1Options.map((option) => ({
                    label: option.Description,
                    value: option.CostCenter1ID.toString(),
                  }))}
                  placeholder="Select Level 1 Cost Center"
                  required
                  render={renderLevel1Select}
                />
              )}

              {/* Level 2 Parent Selection (for levels 3, 4) */}
              {costCenterLevel >= 3 && (
                <FormField
                  form={form}
                  name="CostCenter2ID"
                  label="Level 2 Cost Center"
                  type="select"
                  options={level2Options.map((option) => ({
                    label: option.Description,
                    value: option.CostCenter2ID.toString(),
                  }))}
                  placeholder="Select Level 2 Cost Center"
                  required
                  render={renderLevel2Select}
                />
              )}

              {/* Level 3 Parent Selection (for level 4) */}
              {costCenterLevel >= 4 && (
                <FormField
                  form={form}
                  name="CostCenter3ID"
                  label="Level 3 Cost Center"
                  type="select"
                  options={level3Options.map((option) => ({
                    label: option.Description,
                    value: option.CostCenter3ID.toString(),
                  }))}
                  placeholder="Select Level 3 Cost Center"
                  required
                  disabled={isEdit || !form.getValues().CostCenter2ID}
                />
              )}

              {/* Description Field (for all levels) */}
              <FormField form={form} name="Description" label="Description" placeholder="Enter cost center description" required />
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
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
                    Save Cost Center
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default CostCenterForm;
