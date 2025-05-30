// src/pages/pettyCash/PettyCashForm.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, Loader2, Save, XCircle } from "lucide-react";
import { toast } from "sonner";
import { pettyCashService, PettyCashEntry, PettyCashVoucher } from "@/services/pettyCashService";
import { Company } from "@/types/customerTypes";
import { accountService, companyService, costCenterService, Currency, currencyService, fiscalYearService } from "@/services";
import { Account } from "@/types/accountTypes";
import { CostCenter1, CostCenter2, CostCenter3, CostCenter4 } from "@/types/costCenterTypes";
import { FiscalYear } from "@/types/fiscalYearTypes";

// Define the Zod schema for a single PettyCashEntry (debit/credit line)
const pettyCashEntrySchema = z.object({
  AccountID: z.number().min(1, "Account is required."),
  Amount: z.number().min(0.01, "Amount must be greater than 0."),
  Description: z.string().max(500, "Description cannot exceed 500 characters.").nullable().optional(),
  Narration: z.string().max(1000, "Narration cannot exceed 1000 characters.").nullable().optional(),
  CostCenter1ID: z.number().nullable().optional(),
  CostCenter2ID: z.number().nullable().optional(),
  CostCenter3ID: z.number().nullable().optional(),
  CostCenter4ID: z.number().nullable().optional(),
});

// Define the Zod schema for the entire Petty Cash Voucher form
const pettyCashFormSchema = z
  .object({
    VoucherNo: z.string().max(50, "Voucher No. cannot exceed 50 characters.").nullable().optional(),
    TransactionDate: z.date({ required_error: "Transaction Date is required." }),
    PostingDate: z.date({ required_error: "Posting Date is required." }),
    CompanyID: z.number().min(1, "Company is required."),
    FiscalYearID: z.number().min(1, "Fiscal Year is required."),
    CurrencyID: z.number().min(1, "Currency is required."),
    ExchangeRate: z.number().min(0.0001, "Exchange Rate must be greater than 0."),
    Description: z.string().max(500, "Description cannot exceed 500 characters.").nullable().optional(),
    Narration: z.string().max(1000, "Narration cannot exceed 1000 characters.").nullable().optional(),
    PostingStatus: z.string().max(50, "Posting Status cannot exceed 50 characters.").nullable().optional(),
    ReceiptNo: z.string().max(50, "Receipt No. cannot exceed 50 characters.").nullable().optional(),

    DebitEntries: z.array(pettyCashEntrySchema).min(1, "At least one debit entry is required."),
    CreditEntries: z.array(pettyCashEntrySchema).min(1, "At least one credit entry is required."),
  })
  .refine(
    (data) => {
      const totalDebits = data.DebitEntries.reduce((sum, entry) => sum + entry.Amount, 0);
      const totalCredits = data.CreditEntries.reduce((sum, entry) => sum + entry.Amount, 0);
      return Math.abs(totalDebits - totalCredits) < 0.0001; // Allow for floating point inaccuracies
    },
    {
      message: "Total Debit Amount must equal Total Credit Amount.",
      path: ["TotalAmountMismatch"], // This path makes the error global for the form
    }
  );

type PettyCashFormValues = z.infer<typeof pettyCashFormSchema>;

export const PettyCashForm: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // id is VoucherNo in edit mode
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isEditMode = !!id; // True if 'id' (VoucherNo) is present
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lookup data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [costCenters1, setCostCenters1] = useState<CostCenter1[]>([]);
  const [costCenters2, setCostCenters2] = useState<CostCenter2[]>([]);
  const [costCenters3, setCostCenters3] = useState<CostCenter3[]>([]);
  const [costCenters4, setCostCenters4] = useState<CostCenter4[]>([]);

  const form = useForm<PettyCashFormValues>({
    resolver: zodResolver(pettyCashFormSchema),
    defaultValues: {
      TransactionDate: new Date(),
      PostingDate: new Date(),
      ExchangeRate: 1.0,
      PostingStatus: "Draft",
      DebitEntries: [],
      CreditEntries: [],
    },
  });

  const {
    fields: debitFields,
    append: appendDebit,
    remove: removeDebit,
  } = useFieldArray({
    control: form.control,
    name: "DebitEntries",
  });

  const {
    fields: creditFields,
    append: appendCredit,
    remove: removeCredit,
  } = useFieldArray({
    control: form.control,
    name: "CreditEntries",
  });

  // Fetch initial data (lookups and existing voucher in edit mode)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Fetch lookup data in parallel
        const [companiesData, fiscalYearsData, currenciesData, accountsData, cc1Data, cc2Data, cc3Data, cc4Data] = await Promise.all([
          companyService.getAllCompanies(),
          fiscalYearService.getFiscalYearsForDropdown(),
          currencyService.getAllCurrencies(),
          accountService.getAllAccounts(),
          costCenterService.getCostCentersByLevel(1),
          costCenterService.getCostCentersByLevel(2),
          costCenterService.getCostCentersByLevel(3),
          costCenterService.getCostCentersByLevel(4),
        ]);

        setCompanies(companiesData);
        setFiscalYears(fiscalYearsData);
        setCurrencies(currenciesData);
        setAccounts(accountsData);
        setCostCenters1(cc1Data);
        setCostCenters2(cc2Data as CostCenter2[]);
        setCostCenters3(cc3Data as CostCenter3[]);
        setCostCenters4(cc4Data as CostCenter4[]);

        // Set default currency if not in edit mode or if currency isn't set
        const defaultCurrency = currenciesData.find((c) => c.IsDefault);
        if (!isEditMode && defaultCurrency) {
          form.setValue("CurrencyID", defaultCurrency.CurrencyID);
        }

        if (isEditMode) {
          // Fetch existing voucher data
          const voucherDetails = await pettyCashService.getPettyCashVoucherByVoucherNo(id!);
          if (voucherDetails.voucher) {
            const voucher = voucherDetails.voucher;
            const lines = voucherDetails.postingLines;

            form.reset({
              VoucherNo: voucher.VoucherNo,
              TransactionDate: voucher.TransactionDate ? new Date(voucher.TransactionDate) : new Date(),
              PostingDate: voucher.PostingDate ? new Date(voucher.PostingDate) : new Date(),
              CompanyID: voucher.CompanyID,
              FiscalYearID: voucher.FiscalYearID,
              CurrencyID: voucher.CurrencyID,
              ExchangeRate: voucher.ExchangeRate,
              Description: voucher.Description,
              Narration: voucher.Narration,
              PostingStatus: voucher.PostingStatus,
              ReceiptNo: voucher.ReceiptNo,
              DebitEntries: lines
                .filter((line) => line.TransactionType === "Debit")
                .map((line) => ({
                  AccountID: line.AccountID,
                  Amount: line.DebitAmount,
                  Description: line.LineDescription,
                  Narration: line.LineNarration,
                  CostCenter1ID: line.CostCenter1ID,
                  CostCenter2ID: line.CostCenter2ID,
                  CostCenter3ID: line.CostCenter3ID,
                  CostCenter4ID: line.CostCenter4ID,
                })),
              CreditEntries: lines
                .filter((line) => line.TransactionType === "Credit")
                .map((line) => ({
                  AccountID: line.AccountID,
                  Amount: line.CreditAmount,
                  Description: line.LineDescription,
                  Narration: line.LineNarration,
                  CostCenter1ID: line.CostCenter1ID,
                  CostCenter2ID: line.CostCenter2ID,
                  CostCenter3ID: line.CostCenter3ID,
                  CostCenter4ID: line.CostCenter4ID,
                })),
            });
            // Disable form if not in Draft status
            if (voucher.PostingStatus !== "Draft") {
              form.setError("PostingStatus", {
                type: "manual",
                message: "This voucher is not in Draft status and cannot be edited.",
              });
              form.setFocus("VoucherNo");
            }
          } else {
            toast.error(t("pettyCash.voucherNotFound"));
            navigate("/petty-cash");
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error(t("common.errorLoadingData"));
        navigate("/petty-cash");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditMode, form, navigate, t]);

  // Calculate total debits and credits for display
  const totalDebits = useMemo(() => {
    return form.watch("DebitEntries")?.reduce((sum, entry) => sum + (entry.Amount || 0), 0) || 0;
  }, [form.watch("DebitEntries")]);

  const totalCredits = useMemo(() => {
    return form.watch("CreditEntries")?.reduce((sum, entry) => sum + (entry.Amount || 0), 0) || 0;
  }, [form.watch("CreditEntries")]);

  const onSubmit = async (values: PettyCashFormValues) => {
    setIsSubmitting(true);
    try {
      const voucherData: Omit<PettyCashVoucher, "PostingID" | "TotalAmount"> = {
        VoucherNo: values.VoucherNo,
        TransactionDate: values.TransactionDate,
        PostingDate: values.PostingDate,
        CompanyID: values.CompanyID,
        FiscalYearID: values.FiscalYearID,
        CurrencyID: values.CurrencyID,
        ExchangeRate: values.ExchangeRate,
        Description: values.Description,
        Narration: values.Narration,
        PostingStatus: values.PostingStatus,
        ReceiptNo: values.ReceiptNo,
      };

      const mappedDebitEntries: PettyCashEntry[] = values.DebitEntries.map((entry) => ({
        AccountID: entry.AccountID,
        Amount: entry.Amount,
        Description: entry.Description,
        Narration: entry.Narration,
        CostCenter1ID: entry.CostCenter1ID,
        CostCenter2ID: entry.CostCenter2ID,
        CostCenter3ID: entry.CostCenter3ID,
        CostCenter4ID: entry.CostCenter4ID,
      }));

      const mappedCreditEntries: PettyCashEntry[] = values.CreditEntries.map((entry) => ({
        AccountID: entry.AccountID,
        Amount: entry.Amount,
        Description: entry.Description,
        Narration: entry.Narration,
        CostCenter1ID: entry.CostCenter1ID,
        CostCenter2ID: entry.CostCenter2ID,
        CostCenter3ID: entry.CostCenter3ID,
        CostCenter4ID: entry.CostCenter4ID,
      }));

      if (isEditMode) {
        const updateRequest = {
          voucher: voucherData,
          debitEntries: mappedDebitEntries,
          creditEntries: mappedCreditEntries,
        };
        const response = await pettyCashService.updatePettyCashVoucher(updateRequest);
        if (response.Status === 1) {
          toast.success(t("pettyCash.updateSuccess"));
          navigate(`/petty-cash/${values.VoucherNo}`);
        } else {
          toast.error(response.Message || t("pettyCash.updateError"));
        }
      } else {
        const createRequest = {
          voucher: voucherData,
          debitEntries: mappedDebitEntries,
          creditEntries: mappedCreditEntries,
        };
        const response = await pettyCashService.createPettyCashVoucher(createRequest);
        if (response.Status === 1) {
          toast.success(t("pettyCash.createSuccess"));
          navigate(`/petty-cash/${response.VoucherNo}`);
        } else {
          toast.error(response.Message || t("pettyCash.createError"));
        }
      }
    } catch (error) {
      console.error("Error submitting petty cash voucher:", error);
      toast.error(t("common.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const totalAmountMismatchError = form.formState.errors.root?.TotalAmountMismatch;
  const isFormDisabled = form.formState.errors.PostingStatus?.type === "manual";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{isEditMode ? t("pettyCash.editVoucher") : t("pettyCash.newVoucher")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Header Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="VoucherNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pettyCash.voucherNo")}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isEditMode || isFormDisabled} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="TransactionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pettyCash.transactionDate")}</FormLabel>
                      <div>
                        <DatePicker value={field.value} onChange={field.onChange} disabled={isFormDisabled} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="PostingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pettyCash.postingDate")}</FormLabel>
                      <div>
                        <DatePicker value={field.value} onChange={field.onChange} disabled={isFormDisabled} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="CompanyID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pettyCash.company")}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={isFormDisabled}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("pettyCash.selectCompany")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.CompanyID} value={company.CompanyID.toString()}>
                              {company.CompanyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="FiscalYearID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pettyCash.fiscalYear")}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={isFormDisabled}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("pettyCash.selectFiscalYear")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fiscalYears.map((fy) => (
                            <SelectItem key={fy.FiscalYearID} value={fy.FiscalYearID.toString()}>
                              {fy.FYDescription}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="CurrencyID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pettyCash.currency")}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()} disabled={isFormDisabled}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("pettyCash.selectCurrency")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.CurrencyID} value={currency.CurrencyID.toString()}>
                              {currency.CurrencyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ExchangeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pettyCash.exchangeRate")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.0001" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ReceiptNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pettyCash.receiptNo")}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} disabled={isFormDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="PostingStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pettyCash.postingStatus")}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} disabled readOnly />
                      </FormControl>
                      {form.formState.errors.PostingStatus && <FormMessage>{form.formState.errors.PostingStatus.message}</FormMessage>}
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="Description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pettyCash.description")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} disabled={isFormDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Narration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pettyCash.narration")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} disabled={isFormDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Debit Entries Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("pettyCash.debitEntries")}</h3>
                {debitFields.map((field, index) => (
                  <Card key={field.id} className="p-4 relative">
                    <div className="absolute top-2 right-2">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeDebit(index)} disabled={isFormDisabled}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`DebitEntries.${index}.AccountID`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.account")}</FormLabel>
                            <Select onValueChange={(value) => entryField.onChange(parseInt(value))} value={entryField.value?.toString()} disabled={isFormDisabled}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("pettyCash.selectAccount")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.map((account) => (
                                  <SelectItem key={account.AccountID} value={account.AccountID.toString()}>
                                    {account.AccountCode} - {account.AccountName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`DebitEntries.${index}.Amount`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.amount")}</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...entryField} onChange={(e) => entryField.onChange(parseFloat(e.target.value))} disabled={isFormDisabled} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`DebitEntries.${index}.Description`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.lineDescription")}</FormLabel>
                            <FormControl>
                              <Input {...entryField} value={entryField.value || ""} disabled={isFormDisabled} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Cost Center Fields for Debit Entries */}
                      <FormField
                        control={form.control}
                        name={`DebitEntries.${index}.CostCenter1ID`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.costCenter1")}</FormLabel>
                            <Select onValueChange={(value) => entryField.onChange(parseInt(value))} value={entryField.value?.toString()} disabled={isFormDisabled}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("pettyCash.selectCostCenter")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {costCenters1.map((cc) => (
                                  <SelectItem key={cc.CostCenter1ID} value={cc.CostCenter1ID.toString()}>
                                    {cc.Description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`DebitEntries.${index}.CostCenter2ID`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.costCenter2")}</FormLabel>
                            <Select onValueChange={(value) => entryField.onChange(parseInt(value))} value={entryField.value?.toString()} disabled={isFormDisabled}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("pettyCash.selectCostCenter")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {costCenters2.map((cc) => (
                                  <SelectItem key={cc.CostCenter2ID} value={cc.CostCenter2ID.toString()}>
                                    {cc.Description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`DebitEntries.${index}.CostCenter3ID`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.costCenter3")}</FormLabel>
                            <Select onValueChange={(value) => entryField.onChange(parseInt(value))} value={entryField.value?.toString()} disabled={isFormDisabled}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("pettyCash.selectCostCenter")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {costCenters3.map((cc) => (
                                  <SelectItem key={cc.CostCenter3ID} value={cc.CostCenter3ID.toString()}>
                                    {cc.Description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`DebitEntries.${index}.CostCenter4ID`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.costCenter4")}</FormLabel>
                            <Select onValueChange={(value) => entryField.onChange(parseInt(value))} value={entryField.value?.toString()} disabled={isFormDisabled}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("pettyCash.selectCostCenter")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {costCenters4.map((cc) => (
                                  <SelectItem key={cc.CostCenter4ID} value={cc.CostCenter4ID.toString()}>
                                    {cc.Description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={() => appendDebit({ AccountID: 0, Amount: 0, Description: "", Narration: "" })} disabled={isFormDisabled}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Debit Entry
                </Button>
              </div>

              <Separator />

              {/* Credit Entries Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("pettyCash.creditEntries")}</h3>
                {creditFields.map((field, index) => (
                  <Card key={field.id} className="p-4 relative">
                    <div className="absolute top-2 right-2">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeCredit(index)} disabled={isFormDisabled}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`CreditEntries.${index}.AccountID`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.account")}</FormLabel>
                            <Select onValueChange={(value) => entryField.onChange(parseInt(value))} value={entryField.value?.toString()} disabled={isFormDisabled}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("pettyCash.selectAccount")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.map((account) => (
                                  <SelectItem key={account.AccountID} value={account.AccountID.toString()}>
                                    {account.AccountCode} - {account.AccountName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`CreditEntries.${index}.Amount`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.amount")}</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...entryField} onChange={(e) => entryField.onChange(parseFloat(e.target.value))} disabled={isFormDisabled} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`CreditEntries.${index}.Description`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.lineDescription")}</FormLabel>
                            <FormControl>
                              <Input {...entryField} value={entryField.value || ""} disabled={isFormDisabled} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Cost Center Fields for Credit Entries */}
                      <FormField
                        control={form.control}
                        name={`CreditEntries.${index}.CostCenter1ID`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.costCenter1")}</FormLabel>
                            <Select onValueChange={(value) => entryField.onChange(parseInt(value))} value={entryField.value?.toString()} disabled={isFormDisabled}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("pettyCash.selectCostCenter")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {costCenters1.map((cc) => (
                                  <SelectItem key={cc.CostCenter1ID} value={cc.CostCenter1ID.toString()}>
                                    {cc.Description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`CreditEntries.${index}.CostCenter2ID`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.costCenter2")}</FormLabel>
                            <Select onValueChange={(value) => entryField.onChange(parseInt(value))} value={entryField.value?.toString()} disabled={isFormDisabled}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("pettyCash.selectCostCenter")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {costCenters2.map((cc) => (
                                  <SelectItem key={cc.CostCenter2ID} value={cc.CostCenter2ID.toString()}>
                                    {cc.Description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`CreditEntries.${index}.CostCenter3ID`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.costCenter3")}</FormLabel>
                            <Select onValueChange={(value) => entryField.onChange(parseInt(value))} value={entryField.value?.toString()} disabled={isFormDisabled}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("pettyCash.selectCostCenter")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {costCenters3.map((cc) => (
                                  <SelectItem key={cc.CostCenter3ID} value={cc.CostCenter3ID.toString()}>
                                    {cc.Description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`CreditEntries.${index}.CostCenter4ID`}
                        render={({ field: entryField }) => (
                          <FormItem>
                            <FormLabel>{t("pettyCash.costCenter4")}</FormLabel>
                            <Select onValueChange={(value) => entryField.onChange(parseInt(value))} value={entryField.value?.toString()} disabled={isFormDisabled}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("pettyCash.selectCostCenter")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {costCenters4.map((cc) => (
                                  <SelectItem key={cc.CostCenter4ID} value={cc.CostCenter4ID.toString()}>
                                    {cc.Description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={() => appendCredit({ AccountID: 0, Amount: 0, Description: "", Narration: "" })} disabled={isFormDisabled}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Credit Entry
                </Button>
              </div>

              <Separator />

              {/* Totals and Error */}
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>
                  {t("pettyCash.totalDebits")}: {totalDebits.toFixed(2)}
                </span>
                <span>
                  {t("pettyCash.totalCredits")}: {totalCredits.toFixed(2)}
                </span>
                {totalDebits !== totalCredits && <span className="text-red-500">{t("pettyCash.balanceMismatch")}</span>}
              </div>
              {totalAmountMismatchError && <p className="text-sm font-medium text-destructive mt-2">{totalAmountMismatchError.message}</p>}

              {/* Form Actions */}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => navigate("/petty-cash")} disabled={isSubmitting}>
                  <XCircle className="mr-2 h-4 w-4" /> {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting || isFormDisabled}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" /> {isEditMode ? t("common.update") : t("common.create")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PettyCashForm;
