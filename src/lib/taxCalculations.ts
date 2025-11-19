import { FrequencyChoices, GrossIncome, TaxRank, YouthIrs } from "./typings";

export { FrequencyChoices };
export const YEAR_BUSINESS_DAYS = 248;
export const SUPPORTED_TAX_RANK_YEARS = [2023, 2024, 2025] as const;

export const convertIncomeFrequency = (
  income: number | null,
  fromFrequency: FrequencyChoices,
  nrMonthsDisplay: number,
  nrDaysOff: number
): GrossIncome => {
  const result: GrossIncome = {
    year: 0,
    month: 0,
    day: 0,
  };

  if (!income || !nrMonthsDisplay) {
    return result;
  }

  let yearlyIncome: number;
  switch (fromFrequency) {
    case FrequencyChoices.Year:
      yearlyIncome = income;
      break;
    case FrequencyChoices.Month:
      yearlyIncome = income * nrMonthsDisplay;
      break;
    case FrequencyChoices.Day:
      yearlyIncome = income * (YEAR_BUSINESS_DAYS - nrDaysOff);
      break;
  }

  result.year = yearlyIncome;
  result.month = yearlyIncome / nrMonthsDisplay;
  result.day = yearlyIncome / (YEAR_BUSINESS_DAYS - nrDaysOff);

  return result;
};

export const calculateSsPay = (
  income: number | null,
  incomeFrequency: FrequencyChoices,
  nrMonthsDisplay: number,
  nrDaysOff: number,
  ssDiscount: number,
  ssTaxRate: number,
  iasPerYear: number,
  ssFirstYear: boolean
): GrossIncome => {
  if (ssFirstYear || !income) {
    return { year: 0, month: 0, day: 0 };
  }

  const grossIncome = convertIncomeFrequency(
    income,
    incomeFrequency,
    nrMonthsDisplay,
    nrDaysOff
  );

  const maxSsIncome = 12 * iasPerYear;
  const monthSS =
    ssTaxRate *
    Math.min(maxSsIncome, grossIncome.month * 0.7 * (1 + ssDiscount));
  const yearSSPay = Math.max(12 * monthSS, 20 * 12);

  return {
    year: yearSSPay,
    month: Math.max(monthSS, 20),
    day: yearSSPay / (YEAR_BUSINESS_DAYS - nrDaysOff),
  };
};

export const calculateExpensesAuto = (
  income: number | null,
  incomeFrequency: FrequencyChoices,
  nrMonthsDisplay: number,
  nrDaysOff: number,
  ssDiscount: number,
  ssTaxRate: number,
  iasPerYear: number,
  ssFirstYear: boolean,
  maxExpensesTaxRate: number
): number => {
  if (!income) return 0;

  const grossIncome = convertIncomeFrequency(
    income,
    incomeFrequency,
    nrMonthsDisplay,
    nrDaysOff
  );

  const ssPay = calculateSsPay(
    income,
    incomeFrequency,
    nrMonthsDisplay,
    nrDaysOff,
    ssDiscount,
    ssTaxRate,
    iasPerYear,
    ssFirstYear
  );

  const specificDeductions = Math.max(
    4104,
    Math.min(ssPay.year, 0.1 * grossIncome.year)
  );

  const maxExpenses = (maxExpensesTaxRate / 100) * grossIncome.year;
  return Math.max(0, maxExpenses - specificDeductions);
};

export const isYearOfYouthIrsValid = (
  year: number,
  taxRankYear: (typeof SUPPORTED_TAX_RANK_YEARS)[number]
): boolean => {
  const validRange = taxRankYear === 2025 ? 10 : 5;
  return year >= 1 && year <= validRange;
};

export const calculateIrsTax = (
  grossIncome: GrossIncome,
  taxRanks: TaxRank[],
  expenses: number,
  firstYear: boolean,
  secondYear: boolean,
  rnh: boolean,
  rnhTaxRate: number,
  benefitsOfYouthIrs: boolean,
  yearOfYouthIrs: number,
  youthIrsData: YouthIrs
): number => {
  let taxableIncome = Math.max(0, grossIncome.year - expenses);

  if (firstYear) {
    taxableIncome = 0;
  } else if (secondYear) {
    taxableIncome *= 0.5;
  }

  let tax = 0;
  for (const rank of taxRanks) {
    if (
      grossIncome.year >= rank.min &&
      (rank.max === null || grossIncome.year < rank.max)
    ) {
      tax = taxableIncome * rank.normalTax;
      break;
    }
  }

  if (rnh) {
    tax = Math.max(tax, taxableIncome * rnhTaxRate);
  }

  if (benefitsOfYouthIrs && youthIrsData[yearOfYouthIrs]) {
    const youthBenefit = youthIrsData[yearOfYouthIrs];
    const maxDiscount = taxableIncome * youthBenefit.maxDiscountPercentage;
    tax = Math.max(0, tax - maxDiscount);
  }

  return tax;
};

export const calculateYouthIrsDiscount = (
  grossIncome: GrossIncome,
  benefitsOfYouthIrs: boolean,
  yearOfYouthIrs: number,
  youthIrsData: YouthIrs,
  currentIas: number
): number => {
  if (!benefitsOfYouthIrs || !youthIrsData[yearOfYouthIrs]) {
    return 0;
  }

  const youthIrsRank = youthIrsData[yearOfYouthIrs];
  const maxDiscount = youthIrsRank.maxDiscountPercentage * grossIncome.year;
  const maxDiscountIas = youthIrsRank.maxDiscountIasMultiplier * currentIas;
  return Math.min(maxDiscount, maxDiscountIas);
};
export const calculateIrsDetails = (
  grossIncome: GrossIncome,
  taxRanks: TaxRank[],
  expenses: number,
  ssPay: GrossIncome,
  youthIrsDiscount: number,
  firstYear: boolean,
  secondYear: boolean,
  rnh: boolean,
  rnhTaxRate: number
) => {
  const specificDeductions = Math.max(
    4104,
    Math.min(ssPay.year, 0.1 * grossIncome.year)
  );

  const maxExpenses = 0.15 * grossIncome.year;
  const expensesNeeded = Math.max(0, maxExpenses - specificDeductions);

  const expensesMissing =
    expensesNeeded > expenses ? expensesNeeded - expenses : 0;
  const multiplier = firstYear ? 0.375 : secondYear ? 0.5625 : 0.75;
  const taxableIncome =
    (grossIncome.year - youthIrsDiscount) * multiplier + expensesMissing;

  let taxRankLevel = 1;
  let normalTax = 0;
  let averageTax = 0;
  for (let i = 0; i < taxRanks.length; i++) {
    const rank = taxRanks[i];
    const isLastRank = i === taxRanks.length - 1;
    const isBiggerThanMin = rank.min <= taxableIncome;
    const isSmallerThanMax = rank.max === null || rank.max >= taxableIncome;

    if (
      (isLastRank && isBiggerThanMin) ||
      (isBiggerThanMin && isSmallerThanMax)
    ) {
      taxRankLevel = rank.id;
      normalTax = rank.normalTax;
      averageTax = rank.averageTax || 0;
      break;
    }
  }

  let taxIncomeAvg = 0;
  let taxIncomeNormal = 0;

  if (!rnh) {
    if (taxRankLevel <= 1) {
      taxIncomeAvg = taxableIncome;
      taxIncomeNormal = 0;
    } else {
      const avgRank = taxRanks.find((rank) => rank.id === taxRankLevel - 1);
      if (avgRank) {
        taxIncomeAvg = avgRank.max || 0;
        taxIncomeNormal = taxableIncome - taxIncomeAvg;
        averageTax = avgRank.averageTax || 0;
      }
    }
  }

  let irs = 0;
  if (rnh) {
    irs = taxableIncome * rnhTaxRate;
  } else {
    irs = taxIncomeAvg * averageTax + taxIncomeNormal * normalTax;
  }

  return {
    taxRankLevel,
    specificDeductions,
    expenses: expenses > 0 ? expenses : 0,
    youthIrsDiscount,
    taxableIncome,
    taxableIncomeForAverageTax: taxIncomeAvg,
    taxableIncomeForNormalTax: taxIncomeNormal,
    irs,
  };
};
