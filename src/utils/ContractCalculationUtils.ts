// src/utils/ContractCalculationUtils.ts
import { addDays, differenceInDays, differenceInMonths, isValid } from "date-fns";

/**
 * Contract Calculator utility class to handle various calculation needs
 * for contract creation and management
 */
export class ContractCalculator {
  /**
   * Calculate total days between two dates (inclusive)
   */
  static calculateDaysBetween(startDate?: Date | null, endDate?: Date | null): number {
    if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) return 0;
    return differenceInDays(endDate, startDate) + 1; // Include the end date
  }

  /**
   * Calculate total months between two dates
   */
  static calculateMonthsBetween(startDate?: Date | null, endDate?: Date | null): number {
    if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) return 0;
    return differenceInMonths(endDate, startDate);
  }

  /**
   * Calculate years between two dates
   */
  static calculateYearsBetween(startDate?: Date | null, endDate?: Date | null): number {
    if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) return 0;
    const months = this.calculateMonthsBetween(startDate, endDate);
    return Math.floor(months / 12);
  }

  /**
   * Calculate contract length components (years, months, days)
   */
  static calculateContractPeriod(
    fromDate?: Date | null,
    toDate?: Date | null
  ): {
    days: number;
    months: number;
    years: number;
    totalDays: number;
  } {
    if (!fromDate || !toDate || !isValid(fromDate) || !isValid(toDate)) {
      return { days: 0, months: 0, years: 0, totalDays: 0 };
    }

    const totalDays = this.calculateDaysBetween(fromDate, toDate);
    const totalMonths = this.calculateMonthsBetween(fromDate, toDate);
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    // Calculate remaining days - this is complex due to varying month lengths
    // We'll use a simplified approach for the remaining days
    const yearMonthDays = years * 365 + months * 30;
    const days = Math.max(0, totalDays - yearMonthDays);

    return {
      days,
      months,
      years,
      totalDays,
    };
  }

  /**
   * Convert monthly rent to yearly rent
   */
  static monthlyToYearlyRent(monthlyRent: number): number {
    if (!monthlyRent || monthlyRent <= 0) return 0;
    return monthlyRent * 12;
  }

  /**
   * Convert yearly rent to monthly rent
   */
  static yearlyToMonthlyRent(yearlyRent: number): number {
    if (!yearlyRent || yearlyRent <= 0) return 0;
    return yearlyRent / 12;
  }

  /**
   * Calculate daily rate based on yearly amount
   */
  static calculateDailyRate(yearlyAmount: number): number {
    if (!yearlyAmount || yearlyAmount <= 0) return 0;
    return yearlyAmount / 365;
  }

  /**
   * Calculate tax amount based on base amount and tax percentage
   */
  static calculateTaxAmount(baseAmount: number, taxPercentage?: number): number {
    if (!baseAmount || baseAmount <= 0 || !taxPercentage || taxPercentage <= 0) return 0;
    return (baseAmount * taxPercentage) / 100;
  }

  /**
   * Calculate rent-free period adjustment
   */
  static calculateRentFreePeriodAdjustment(fromDate: Date | null, toDate: Date | null, rentFreePeriodFrom: Date | null, rentFreePeriodTo: Date | null, yearlyRent: number): number {
    // If no rent-free period specified, return 0 adjustment
    if (!rentFreePeriodFrom || !rentFreePeriodTo || !isValid(rentFreePeriodFrom) || !isValid(rentFreePeriodTo) || !yearlyRent) {
      return 0;
    }

    // Get total contract days
    const totalContractDays = this.calculateDaysBetween(fromDate, toDate);
    if (totalContractDays <= 0) return 0;

    // Calculate rent-free days
    const rentFreeDays = this.calculateDaysBetween(rentFreePeriodFrom, rentFreePeriodTo);
    if (rentFreeDays <= 0) return 0;

    // Calculate daily rate
    const dailyRate = this.calculateDailyRate(yearlyRent);

    // Return the adjustment amount
    return dailyRate * rentFreeDays;
  }

  /**
   * Calculate installment amounts and schedule
   */
  static calculateInstallments(
    totalAmount: number,
    installmentCount: number
  ): {
    installmentAmount: number;
    schedule: { installmentNumber: number; amount: number; dueDate?: Date }[];
  } {
    if (!totalAmount || totalAmount <= 0 || !installmentCount || installmentCount <= 0) {
      return { installmentAmount: 0, schedule: [] };
    }

    // Calculate base installment amount (rounded to 2 decimals)
    const baseAmount = +(totalAmount / installmentCount).toFixed(2);

    // Create the installment schedule
    const schedule = [];
    let remainingAmount = totalAmount;

    for (let i = 0; i < installmentCount; i++) {
      const isLastInstallment = i === installmentCount - 1;

      // Use remaining amount for last installment to avoid rounding issues
      const amount = isLastInstallment ? +remainingAmount.toFixed(2) : baseAmount;

      schedule.push({
        installmentNumber: i + 1,
        amount: amount,
      });

      remainingAmount -= amount;
    }

    return {
      installmentAmount: baseAmount,
      schedule,
    };
  }

  /**
   * Calculate installment dates based on start date and frequency
   * @param startDate The date to start calculating from
   * @param installmentCount Number of installments
   * @param frequency 'monthly', 'quarterly', 'bi-annual', 'annual'
   */
  static calculateInstallmentDates(startDate: Date, installmentCount: number, frequency: "monthly" | "quarterly" | "bi-annual" | "annual" = "monthly"): Date[] {
    if (!startDate || !installmentCount || installmentCount <= 0) {
      return [];
    }

    const dates: Date[] = [];
    let currentDate = new Date(startDate);

    // Determine month increment based on frequency
    let monthIncrement = 1; // default for monthly

    switch (frequency) {
      case "quarterly":
        monthIncrement = 3;
        break;
      case "bi-annual":
        monthIncrement = 6;
        break;
      case "annual":
        monthIncrement = 12;
        break;
    }

    for (let i = 0; i < installmentCount; i++) {
      dates.push(new Date(currentDate));

      // Add months based on frequency
      const nextMonth = currentDate.getMonth() + monthIncrement;
      const nextYear = currentDate.getFullYear() + Math.floor(nextMonth / 12);

      currentDate = new Date(currentDate);
      currentDate.setMonth(nextMonth % 12);
      currentDate.setFullYear(nextYear);
    }

    return dates;
  }

  /**
   * Comprehensive calculation of all contract unit values
   */
  static calculateContractUnitValues(contractUnit: any): any {
    if (!contractUnit) return {};

    const { FromDate, ToDate, RentPerMonth, RentPerYear, RentFreePeriodFrom, RentFreePeriodTo, RentFreeAmount, TaxPercentage, NoOfInstallments, FitoutFromDate, FitoutToDate } =
      contractUnit;

    const result = { ...contractUnit };

    // Calculate contract period
    const period = this.calculateContractPeriod(FromDate, ToDate);
    result.ContractDays = period.days;
    result.ContractMonths = period.months;
    result.ContractYears = period.years;

    // Handle rent calculation (bidirectional)
    if (RentPerMonth && (!RentPerYear || RentPerYear === 0)) {
      // Calculate yearly from monthly
      result.RentPerYear = this.monthlyToYearlyRent(RentPerMonth);
    } else if (RentPerYear && (!RentPerMonth || RentPerMonth === 0)) {
      // Calculate monthly from yearly
      result.RentPerMonth = this.yearlyToMonthlyRent(RentPerYear);
    }

    // Ensure we have a yearly rent value for subsequent calculations
    const yearlyRent = result.RentPerYear || this.monthlyToYearlyRent(result.RentPerMonth || 0);
    result.RentPerYear = yearlyRent;

    // Calculate rent-free adjustment if applicable
    const calculatedRentFreeAmount = this.calculateRentFreePeriodAdjustment(FromDate, ToDate, RentFreePeriodFrom, RentFreePeriodTo, yearlyRent);

    // Use provided rent free amount or calculated one
    result.RentFreeAmount = RentFreeAmount || calculatedRentFreeAmount;

    // Calculate the effective rent amount after rent-free period
    const effectiveRentAmount = Math.max(0, yearlyRent - (result.RentFreeAmount || 0));

    // Calculate tax on the effective rent
    result.TaxAmount = this.calculateTaxAmount(effectiveRentAmount, TaxPercentage);

    // Calculate total amount with tax
    result.TotalAmount = effectiveRentAmount + (result.TaxAmount || 0);

    // Calculate installments if specified
    if (NoOfInstallments && NoOfInstallments > 0) {
      const installmentCalculation = this.calculateInstallments(result.TotalAmount, NoOfInstallments);

      result.InstallmentAmount = installmentCalculation.installmentAmount;
      result.InstallmentSchedule = installmentCalculation.schedule;

      // If we have a commencement date, calculate due dates
      if (result.CommencementDate) {
        const dueDates = this.calculateInstallmentDates(new Date(result.CommencementDate), NoOfInstallments);

        // Add due dates to the installment schedule
        result.InstallmentSchedule.forEach((installment, index) => {
          if (dueDates[index]) {
            installment.dueDate = dueDates[index];
          }
        });
      }
    }

    // Handle fitout period if applicable
    if (FitoutFromDate && FitoutToDate) {
      const fitoutDays = this.calculateDaysBetween(FitoutFromDate, FitoutToDate);
      if (fitoutDays > 0) {
        result.FitoutPeriodDays = fitoutDays;

        // Calculate fitout rent if applicable
        // This could be a different rate or free depending on business rules
        // For now, we'll assume it's included in the main rent calculation
      }
    }

    return result;
  }
}

// Create a React hook to use the calculator in components
import { useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";

export function useContractCalculations(form: UseFormReturn<any>) {
  /**
   * Calculate and update a specific contract unit
   */
  const calculateAndUpdateContractUnit = (index: number) => {
    try {
      const units = form.getValues("units");
      if (!units || !units[index]) return null;

      const contractUnit = units[index];
      const calculatedUnit = ContractCalculator.calculateContractUnitValues(contractUnit);

      // Update form values with calculated results
      Object.keys(calculatedUnit).forEach((key) => {
        if (calculatedUnit[key] !== undefined && calculatedUnit[key] !== null && key !== "InstallmentSchedule") {
          // Skip complex objects
          form.setValue(`units.${index}.${key}`, calculatedUnit[key]);
        }
      });

      return calculatedUnit;
    } catch (error) {
      console.error("Error calculating contract unit values:", error);
      return null;
    }
  };

  /**
   * Calculate the grand total across all contract units
   */
  const calculateGrandTotal = () => {
    const units = form.getValues("units") || [];
    const unitsTotal = units.reduce((sum, unit) => sum + (unit.TotalAmount || 0), 0);

    // Get additional charges if present in the form
    const additionalCharges = form.getValues("additionalCharges") || [];
    const chargesTotal = additionalCharges.reduce((sum, charge) => sum + (charge.TotalAmount || 0), 0);

    return unitsTotal + chargesTotal;
  };

  /**
   * Recalculate all contract units
   */
  const recalculateAllUnits = () => {
    const units = form.getValues("units") || [];
    units.forEach((_, index) => {
      calculateAndUpdateContractUnit(index);
    });

    // Update the grand total if those fields exist in the form
    const grandTotal = calculateGrandTotal();
    form.setValue("TotalAmount", grandTotal);
  };

  /**
   * Set up watchers for key contract unit fields to trigger calculations
   */
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (!name || !name.startsWith("units.")) return;

      // Extract the unit index from the field name
      const matches = name.match(/units\.(\d+)\./);
      if (!matches || matches.length < 2) return;

      const index = parseInt(matches[1]);
      const fieldName = name.split(".").pop() || "";

      // Fields that should trigger a full recalculation
      const fullRecalcFields = [
        "FromDate",
        "ToDate",
        "RentPerMonth",
        "RentPerYear",
        "RentFreePeriodFrom",
        "RentFreePeriodTo",
        "TaxPercentage",
        "NoOfInstallments",
        "FitoutFromDate",
        "FitoutToDate",
        "CommencementDate",
      ];

      if (fullRecalcFields.includes(fieldName)) {
        calculateAndUpdateContractUnit(index);

        // If a unit's total changes, update the contract grand total
        const grandTotal = calculateGrandTotal();
        form.setValue("TotalAmount", grandTotal);
        form.setValue("GrandTotal", grandTotal);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return {
    calculateAndUpdateContractUnit,
    calculateGrandTotal,
    recalculateAllUnits,
  };
}
