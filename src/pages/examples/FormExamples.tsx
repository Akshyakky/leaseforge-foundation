import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { MultiStepForm, FormStep } from "@/components/forms/MultiStepForm";
import { AutosaveForm } from "@/components/forms/AutosaveForm";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { notifySuccess, notifyError, notifyInfo, notifyWarning } from "@/lib/notification";
import { FieldValues } from "react-hook-form";

// Basic form schema
const basicFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

// Multi-step form schemas
const personalInfoSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const addressSchema = z.object({
  street: z.string().min(5, { message: "Street address must be at least 5 characters." }),
  city: z.string().min(2, { message: "City must be at least 2 characters." }),
  state: z.string().min(2, { message: "State must be at least 2 characters." }),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, { message: "Please enter a valid ZIP code." }),
});

const preferencesSchema = z.object({
  acceptTerms: z.boolean().refine((val) => val === true, { message: "You must accept the terms." }),
  newsletter: z.boolean().optional(),
  contactPreference: z.enum(["email", "phone", "mail"]),
});

const FormExamples = () => {
  // Sample field definitions for basic form
  const basicFormFields = [
    {
      name: "name",
      label: "Name",
      placeholder: "Enter your name",
    },
    {
      name: "email",
      label: "Email",
      placeholder: "Enter your email",
      type: "email",
    },
    {
      name: "message",
      label: "Message",
      placeholder: "Enter your message",
      render: ({ field }) => <textarea {...field} className="w-full p-2 border rounded-md" rows={4} />,
    },
  ];

  // Sample multi-step form steps
  const multiStepFormSteps: FormStep<FieldValues>[] = [
    {
      id: "personal-info",
      title: "Personal Info",
      description: "Please enter your personal information",
      fields: [
        {
          name: "firstName",
          label: "First Name",
          placeholder: "Enter your first name",
        },
        {
          name: "lastName",
          label: "Last Name",
          placeholder: "Enter your last name",
        },
        {
          name: "email",
          label: "Email",
          placeholder: "Enter your email",
          type: "email",
        },
      ],
      validationSchema: personalInfoSchema,
    },
    {
      id: "address",
      title: "Address",
      description: "Please enter your address",
      fields: [
        {
          name: "street",
          label: "Street Address",
          placeholder: "Enter your street address",
        },
        {
          name: "city",
          label: "City",
          placeholder: "Enter your city",
        },
        {
          name: "state",
          label: "State",
          placeholder: "Enter your state",
        },
        {
          name: "zipCode",
          label: "ZIP Code",
          placeholder: "Enter your ZIP code",
        },
      ],
      validationSchema: addressSchema,
    },
    {
      id: "preferences",
      title: "Preferences",
      description: "Choose your preferences",
      fields: [
        {
          name: "contactPreference",
          label: "Contact Preference",
          render: ({ field }) => (
            <select {...field} className="w-full p-2 border rounded-md">
              <option value="">Select an option</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="mail">Mail</option>
            </select>
          ),
        },
        {
          name: "newsletter",
          label: "Subscribe to newsletter",
          render: ({ field }) => <input type="checkbox" {...field} checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />,
        },
        {
          name: "acceptTerms",
          label: "I accept the terms and conditions",
          render: ({ field }) => <input type="checkbox" {...field} checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />,
        },
      ],
      validationSchema: preferencesSchema,
    },
  ];

  // Sample autosave form fields
  const autosaveFormFields = [
    {
      name: "title",
      label: "Document Title",
      placeholder: "Enter document title",
    },
    {
      name: "content",
      label: "Content",
      render: ({ field }) => <textarea {...field} className="w-full p-2 border rounded-md" rows={6} placeholder="Start typing your content..." />,
    },
  ];

  // Sample form submission handlers
  const handleBasicFormSubmit = (data: FieldValues) => {
    console.log("Basic form submitted:", data);
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleMultiStepFormSubmit = (data: FieldValues) => {
    console.log("Multi-step form submitted:", data);
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleAutosaveFormSubmit = (data: FieldValues) => {
    console.log("Autosave form saved:", data);
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Form Examples</h1>
        <p className="text-muted-foreground">Explore different form components and functionalities</p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="basic">Basic Form</TabsTrigger>
          <TabsTrigger value="multi-step">Multi-Step Form</TabsTrigger>
          <TabsTrigger value="autosave">Autosave Form</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Form</CardTitle>
              <CardDescription>A standard form with validation and error handling</CardDescription>
            </CardHeader>
            <CardContent>
              <FormBuilder
                fields={basicFormFields}
                schema={basicFormSchema}
                onSubmit={handleBasicFormSubmit}
                defaultValues={{
                  name: "",
                  email: "",
                  message: "",
                }}
                successMessage="Form submitted successfully!"
                errorMessage="Failed to submit form. Please try again."
              />

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Test Notifications</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => notifySuccess("This is a success notification")}>
                    Success
                  </Button>
                  <Button variant="outline" onClick={() => notifyError("This is an error notification")}>
                    Error
                  </Button>
                  <Button variant="outline" onClick={() => notifyInfo("This is an info notification")}>
                    Info
                  </Button>
                  <Button variant="outline" onClick={() => notifyWarning("This is a warning notification")}>
                    Warning
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multi-step" className="pt-6">
          <MultiStepForm
            steps={multiStepFormSteps}
            onSubmit={handleMultiStepFormSubmit}
            defaultValues={{
              firstName: "",
              lastName: "",
              email: "",
              street: "",
              city: "",
              state: "",
              zipCode: "",
              contactPreference: "",
              newsletter: false,
              acceptTerms: false,
            }}
            successMessage="Multi-step form submitted successfully!"
            errorMessage="Failed to submit form. Please try again."
          />
        </TabsContent>

        <TabsContent value="autosave" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Autosave Form</CardTitle>
              <CardDescription>Form with automatic saving as you type</CardDescription>
            </CardHeader>
            <CardContent>
              <AutosaveForm
                fields={autosaveFormFields}
                onSubmit={handleAutosaveFormSubmit}
                defaultValues={{
                  title: "Untitled Document",
                  content: "",
                }}
                autosaveDelay={2000}
                localStorageKey="autosave-form-example"
                successMessage="Document saved successfully!"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormExamples;
