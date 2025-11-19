"use client";

import { useState } from "react";
import { useTaxesStore } from "../lib/store";
import {
  convertIncomeFrequency,
  calculateSsPay,
  calculateExpensesAuto,
  calculateIrsDetails,
  calculateYouthIrsDiscount,
  FrequencyChoices,
  SUPPORTED_TAX_RANK_YEARS,
  YEAR_BUSINESS_DAYS,
} from "../lib/taxCalculations";

export default function Home() {
  const store = useTaxesStore();

  const [incomeFrequency, setIncomeFrequency] = useState<FrequencyChoices>(
    FrequencyChoices.Year
  );
  const [displayFrequency, setDisplayFrequency] = useState<FrequencyChoices>(
    FrequencyChoices.Month
  );
  const [nrMonthsDisplay, setNrMonthsDisplay] = useState(12);
  const [nrDaysOff, setNrDaysOff] = useState(0);
  const [expenses, setExpenses] = useState(0);

  const grossIncome = convertIncomeFrequency(
    store.income,
    incomeFrequency,
    nrMonthsDisplay,
    nrDaysOff
  );

  const ssPay = calculateSsPay(
    store.income,
    incomeFrequency,
    nrMonthsDisplay,
    nrDaysOff,
    store.ssDiscount,
    store.ssTax,
    store.iasPerYear[store.currentTaxRankYear],
    store.ssFirstYear
  );

  const youthIrsDiscount = calculateYouthIrsDiscount(
    grossIncome,
    store.benefitsOfYouthIrs,
    store.yearOfYouthIrs,
    store.youthIrs[store.currentTaxRankYear],
    store.iasPerYear[store.currentTaxRankYear]
  );

  const irsDetails = calculateIrsDetails(
    grossIncome,
    store.taxRanks[store.currentTaxRankYear],
    expenses,
    ssPay,
    youthIrsDiscount,
    store.firstYear,
    store.secondYear,
    store.rnh,
    store.rnhTax
  );

  const netIncome = grossIncome.year - ssPay.year - irsDetails.irs;

  const displayGrossIncome = convertIncomeFrequency(
    grossIncome.year,
    FrequencyChoices.Year,
    nrMonthsDisplay,
    nrDaysOff
  );

  const displaySsPay = convertIncomeFrequency(
    ssPay.year,
    FrequencyChoices.Year,
    nrMonthsDisplay,
    nrDaysOff
  );

  const displayNetIncome = convertIncomeFrequency(
    netIncome,
    FrequencyChoices.Year,
    nrMonthsDisplay,
    nrDaysOff
  );

  const displayIrsTax = convertIncomeFrequency(
    irsDetails.irs,
    displayFrequency,
    nrMonthsDisplay,
    nrDaysOff
  );

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Remote Freelancer Portugal Tax Calculator</h1>

      <div>
        <label>Income: </label>
        <input
          type="number"
          value={store.income || ""}
          onChange={(e) => store.actions.setIncome(Number(e.target.value))}
        />
        <select
          value={incomeFrequency}
          onChange={(e) =>
            setIncomeFrequency(e.target.value as FrequencyChoices)
          }
        >
          <option value={FrequencyChoices.Year}>Year</option>
          <option value={FrequencyChoices.Month}>Month</option>
          <option value={FrequencyChoices.Day}>Day</option>
        </select>
      </div>

      <div>
        <label>Show income per: </label>
        <select
          value={displayFrequency}
          onChange={(e) =>
            setDisplayFrequency(e.target.value as FrequencyChoices)
          }
        >
          <option value={FrequencyChoices.Year}>Year</option>
          <option value={FrequencyChoices.Month}>Month</option>
          <option value={FrequencyChoices.Day}>Day</option>
        </select>
      </div>

      <div>
        <label>Nr. of months to simulate: </label>
        <input
          type="number"
          value={nrMonthsDisplay}
          onChange={(e) => setNrMonthsDisplay(Number(e.target.value))}
          min="1"
        />
      </div>

      <div>
        <label>Number of days off: </label>
        <input
          type="number"
          value={nrDaysOff}
          onChange={(e) => setNrDaysOff(Number(e.target.value))}
          min="0"
          max={YEAR_BUSINESS_DAYS - 1}
        />
      </div>

      <div>
        <label>Professional expenses: </label>
        <input
          type="number"
          value={expenses}
          onChange={(e) => setExpenses(Number(e.target.value))}
          min="0"
        />
        <span style={{ fontSize: "12px", color: "#666" }}>
          (max needed:{" "}
          {calculateExpensesAuto(
            store.income,
            incomeFrequency,
            nrMonthsDisplay,
            nrDaysOff,
            store.ssDiscount,
            store.ssTax,
            store.iasPerYear[store.currentTaxRankYear],
            store.ssFirstYear,
            store.maxExpensesTax
          ).toFixed(2)}
          €)
        </span>
      </div>

      <div>
        <label>SS Discount: </label>
        <select
          value={store.ssDiscount}
          onChange={(e) => store.actions.setSsDiscount(Number(e.target.value))}
        >
          {store.ssDiscountChoices.map((choice) => (
            <option key={choice} value={choice}>
              {choice > 0 ? "+" : ""}
              {(choice * 100).toFixed(0)}%
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Tax Year: </label>
        <select
          value={store.currentTaxRankYear}
          onChange={(e) =>
            store.actions.setCurrentTaxRankYear(
              Number(
                e.target.value
              ) as (typeof SUPPORTED_TAX_RANK_YEARS)[number]
            )
          }
        >
          {SUPPORTED_TAX_RANK_YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={store.benefitsOfYouthIrs}
            onChange={(e) =>
              store.actions.setBenefitsOfYouthIrs(e.target.checked)
            }
          />
          Benefits of Youth IRS
        </label>
        {store.benefitsOfYouthIrs && (
          <select
            value={store.yearOfYouthIrs}
            onChange={(e) =>
              store.actions.setYearOfYouthIrs(Number(e.target.value))
            }
          >
            {Array.from(
              { length: store.currentTaxRankYear === 2025 ? 10 : 5 },
              (_, i) => i + 1
            ).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={store.ssFirstYear}
            onChange={(e) => store.actions.setSsFirstYear(e.target.checked)}
          />
          SS First Year (exempt)
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={store.firstYear}
            onChange={(e) => store.actions.setFirstYear(e.target.checked)}
          />
          First Fiscal Year
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={store.secondYear}
            onChange={(e) => store.actions.setSecondYear(e.target.checked)}
          />
          Second Fiscal Year
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={store.rnh}
            onChange={(e) => store.actions.setRnh(e.target.checked)}
          />
          RNH (Non-Habitual Resident)
        </label>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>Results</h2>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            fontFamily: "monospace",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                TITLE
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                YEAR
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                MONTH
              </th>
              <th
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                DAY
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Gross income
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {displayGrossIncome.year?.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {displayGrossIncome.month?.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {displayGrossIncome.day?.toFixed(2)}€
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  fontWeight: "bold",
                }}
                colSpan={4}
              >
                IRS estimation
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  paddingLeft: "20px",
                }}
              >
                tax rank level {irsDetails.taxRankLevel} (out of{" "}
                {store.taxRanks[store.currentTaxRankYear].length})
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
                colSpan={3}
              ></td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  paddingLeft: "20px",
                }}
              >
                Specific deductions
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {irsDetails.specificDeductions.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
                colSpan={2}
              ></td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  paddingLeft: "20px",
                }}
              >
                Expenses
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {irsDetails.expenses > 0
                  ? irsDetails.expenses.toFixed(2) + "€"
                  : "-"}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
                colSpan={2}
              ></td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  paddingLeft: "20px",
                }}
              >
                Youth IRS Discount
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {irsDetails.youthIrsDiscount.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
                colSpan={2}
              ></td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  paddingLeft: "20px",
                }}
              >
                Taxable income
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {irsDetails.taxableIncome.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
                colSpan={2}
              ></td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  paddingLeft: "20px",
                }}
              >
                Taxable income for average tax
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {irsDetails.taxableIncomeForAverageTax.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
                colSpan={2}
              ></td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  paddingLeft: "20px",
                }}
              >
                Taxable income for normal tax
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {irsDetails.taxableIncomeForNormalTax.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
                colSpan={2}
              ></td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  paddingLeft: "20px",
                }}
              >
                IRS
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {displayIrsTax.year?.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {displayIrsTax.month?.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {displayIrsTax.day?.toFixed(2)}€
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  paddingLeft: "20px",
                }}
              >
                Social security
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {displaySsPay.year?.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {displaySsPay.month?.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                }}
              >
                {displaySsPay.day?.toFixed(2)}€
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  fontWeight: "bold",
                }}
              >
                Net income
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                  fontWeight: "bold",
                }}
              >
                {displayNetIncome.year?.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                  fontWeight: "bold",
                }}
              >
                {displayNetIncome.month?.toFixed(2)}€
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "8px",
                  textAlign: "right",
                  fontWeight: "bold",
                }}
              >
                {displayNetIncome.day?.toFixed(2)}€
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
