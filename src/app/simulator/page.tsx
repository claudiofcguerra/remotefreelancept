"use client"

import { ReactNode, useLayoutEffect, useMemo } from "react"
import { useTaxesStore } from "@/lib/store"
import { calculateMonthlyTaxes, convertIncomeFrequency } from "@/lib/taxCalculations"
import { FrequencyChoices } from "@/lib/typings"
import { asCurrency } from "@/lib/utils"
import { Euro, Loader, TrendingUp } from "lucide-react"

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}>
    {children}
  </div>
)
const TableRow = ({
  label,
  val,
  total,
  color = "text-slate-700",
  showPercentage = true,
  indent = false,
  className = "",
}: {
  label: string
  val: number
  total: number
  color?: string
  showPercentage?: boolean
  indent?: boolean
  className?: string
}) => {
  return (
    <tr className={`transition-colors hover:bg-slate-50/50 ${className}`}>
      <td className={`py-2.5 ${indent ? "pl-8 text-xs" : "pl-4 text-sm"} font-medium ${color}`}>
        {label}
      </td>
      <td className={`py-2.5 text-right font-medium ${color} ${indent ? "text-xs" : "text-sm"}`}>
        {asCurrency(val, 2)}
      </td>
      <td className="py-2.5 pr-4 text-right text-xs font-medium text-slate-400">
        {showPercentage ? `${((Math.abs(val) / total) * 100).toFixed(2)}%` : ""}
      </td>
    </tr>
  )
}

export default function Home() {
  const store = useTaxesStore()
  const {
    income,
    incomeFrequency,
    monthsWorked,
    ssDiscount,
    rnh,
    ssFirstYear,
    benefitsOfYouthIrs,
    yearOfYouthIrs,
    expenses,
    isLoading,
    currentTaxRankYear,
    firstYear,
    secondYear,
    ssTax,
    rnhTax,
    taxRanks,
    iasPerYear,
    youthIrs,
    actions: {
      setIncome,
      setIncomeFrequency,
      setMonthsWorked,
      setSsDiscount,
      setRnh,
      setSsFirstYear,
      setBenefitsOfYouthIrs,
      setYearOfYouthIrs,
      setExpenses,
      setIsLoading,
    },
  } = store

  useLayoutEffect(() => {
    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const convertedIncome = useMemo(
    () => convertIncomeFrequency(income || 0, incomeFrequency, monthsWorked, 0),
    [income, incomeFrequency, monthsWorked]
  )

  const taxCalculations = useMemo(() => {
    return calculateMonthlyTaxes(
      convertedIncome,
      income || 0,
      incomeFrequency,
      monthsWorked,
      ssDiscount / 100,
      ssTax,
      iasPerYear[currentTaxRankYear],
      ssFirstYear,
      benefitsOfYouthIrs,
      yearOfYouthIrs,
      youthIrs[currentTaxRankYear],
      expenses || 0,
      taxRanks[currentTaxRankYear],
      firstYear,
      secondYear,
      rnh,
      rnhTax
    )
  }, [
    convertedIncome,
    income,
    incomeFrequency,
    monthsWorked,
    ssDiscount,
    ssTax,
    iasPerYear,
    currentTaxRankYear,
    ssFirstYear,
    benefitsOfYouthIrs,
    yearOfYouthIrs,
    youthIrs,
    expenses,
    taxRanks,
    firstYear,
    secondYear,
    rnh,
    rnhTax,
  ])

  const grossAnnual = convertedIncome.year
  const monthlyGross = grossAnnual / monthsWorked
  const { monthlyNet, monthlyIRS, monthlySS, irsDetails } = taxCalculations

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800 md:p-8">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Loader />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="h-fit p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
              <Euro size={20} className="text-emerald-600" />
              Income Details
            </h2>

            <div className="mb-4 flex rounded-lg bg-slate-100 p-1">
              {Object.values(FrequencyChoices).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setIncomeFrequency(mode)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold uppercase transition-all ${
                    incomeFrequency === mode
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="mb-1 block text-sm font-bold text-slate-700 capitalize">
                Gross Income / {incomeFrequency}
              </label>
              <div className="group relative">
                <input
                  type="number"
                  value={(income || 0).toString()}
                  onChange={(e) => setIncome(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 pr-4 pl-4 text-xl font-bold text-slate-800 transition-all focus:border-emerald-500 focus:ring-0"
                />
                <span className="absolute top-3.5 right-4 font-bold text-slate-400 transition-colors group-hover:text-emerald-500">
                  €
                </span>
              </div>
              {incomeFrequency !== FrequencyChoices.Year ? (
                <p className="mt-2 text-right text-xs text-slate-400">
                  ≈ {asCurrency(convertedIncome.year, 2)} / year
                </p>
              ) : (
                <p className="mt-2 text-right text-xs text-slate-400">
                  ≈ {asCurrency(convertedIncome.month, 2)} / month
                </p>
              )}
            </div>

            <div className="mb-1">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Months Worked / Year
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={monthsWorked}
                  onChange={(e) => setMonthsWorked(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-emerald-600"
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50">
                  <span className="font-bold text-emerald-700">{monthsWorked}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="row-span-2 h-fit p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
              <TrendingUp size={20} className="text-blue-600" />
              Tax Settings
            </h2>

            <div className="mb-6">
              <div className="mb-2 flex justify-between">
                <label className="text-sm font-bold text-slate-700">Social Security Tier</label>
                <span
                  className={`rounded px-2 py-0.5 text-sm font-bold ${
                    ssDiscount > 0
                      ? "bg-red-50 text-red-600"
                      : ssDiscount < 0
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {ssDiscount > 0 ? "+" : ""}
                  {ssDiscount}%
                </span>
              </div>
              <input
                type="range"
                min="-25"
                max="25"
                step="5"
                value={ssDiscount}
                onChange={(e) => setSsDiscount(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
              />
              <div className="mt-2 flex justify-between text-xs font-medium text-slate-400">
                <span>Min (-25%)</span>
                <span>Standard</span>
                <span>Max (+25%)</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Professional Expenses
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Max €2,500
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="2500"
                  value={(expenses || 0).toString()}
                  onChange={(e) => setExpenses(Math.min(2500, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-4 font-medium transition-all focus:border-blue-500 focus:bg-white focus:ring-0"
                />
                <span className="absolute top-2.5 right-4 font-medium text-slate-400">€</span>
              </div>
            </div>

            <div className="space-y-3">
              <div
                className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${ssFirstYear ? "border-emerald-500 bg-emerald-50/50" : "border-transparent bg-slate-50 hover:bg-slate-100"}`}
                onClick={() => setSsFirstYear(!ssFirstYear)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">
                    1st Year Activity (SS Exemption)
                  </span>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${ssFirstYear ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"}`}
                  >
                    {ssFirstYear && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                </div>
              </div>

              <div
                className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${rnh ? "border-emerald-500 bg-emerald-50/50" : "border-transparent bg-slate-50 hover:bg-slate-100"}`}
                onClick={() => {
                  setRnh(!rnh)
                  if (!rnh) setBenefitsOfYouthIrs(false)
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">RNH / NHR Eligible</span>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${rnh ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"}`}
                  >
                    {rnh && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                </div>
              </div>

              <div
                className={`rounded-xl border-2 p-3 transition-all ${benefitsOfYouthIrs ? "border-purple-500 bg-purple-50/50" : "border-transparent bg-slate-50 hover:bg-slate-100"}`}
              >
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => {
                    setBenefitsOfYouthIrs(!benefitsOfYouthIrs)
                    if (!benefitsOfYouthIrs) setRnh(false)
                  }}
                >
                  <span className="text-sm font-bold text-slate-700">IRS Jovem</span>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${benefitsOfYouthIrs ? "border-purple-500 bg-purple-500" : "border-slate-300 bg-white"}`}
                  >
                    {benefitsOfYouthIrs && <div className="h-2 w-2 rounded-full bg-white"></div>}
                  </div>
                </div>

                {benefitsOfYouthIrs && (
                  <div className="animate-in fade-in slide-in-from-top-1 mt-3 border-t border-purple-100 pt-3">
                    <label className="mb-1 block text-xs font-bold text-purple-800">
                      Which year of benefit? (1-10)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={yearOfYouthIrs}
                        onChange={(e) => setYearOfYouthIrs(Number(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-purple-200 accent-purple-600"
                      />
                      <span className="w-6 text-center font-bold text-purple-700">
                        {yearOfYouthIrs}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-purple-600">
                      {yearOfYouthIrs === 1
                        ? "100% Exemption"
                        : yearOfYouthIrs <= 4
                          ? "75% Exemption"
                          : yearOfYouthIrs <= 7
                            ? "50% Exemption"
                            : "25% Exemption"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none bg-slate-900 p-8 text-white shadow-2xl shadow-slate-200">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-emerald-500 opacity-10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>

            <div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></div>
                  <p className="text-sm font-bold tracking-wider text-emerald-400 uppercase">
                    Estimated Net Monthly
                  </p>
                </div>
                <div className="font-mono text-5xl font-bold tracking-tight text-slate-900">
                  {asCurrency(taxCalculations.monthlyNet, 2)}
                </div>
                <p className="mt-3 text-sm font-medium text-slate-400">
                  Based on {monthsWorked} months worked
                </p>
              </div>

              <div className="w-full md:w-auto">
                <div className="transform rounded-xl bg-white p-5 text-slate-900 shadow-lg transition-transform">
                  <p className="mb-1 text-xs font-bold tracking-wide text-slate-500 uppercase">
                    Total Taxes / Month
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-bold text-red-500">
                      -{asCurrency(taxCalculations.monthlyIRS + taxCalculations.monthlySS, 2)}
                    </p>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-[10px] font-bold text-slate-400">
                    <span>IRS: {asCurrency(taxCalculations.monthlyIRS, 2)}</span>
                    <span>SS: {asCurrency(taxCalculations.monthlySS, 2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
              <h3 className="font-bold text-slate-800">Detailed Breakdown</h3>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
                {monthsWorked} months basis
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-100 bg-slate-50/30 text-xs font-bold tracking-wider text-slate-400 uppercase">
                  <tr>
                    <th className="py-3 pl-4">Category</th>
                    <th className="py-3 text-right">Amount</th>
                    <th className="py-3 pr-4 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <TableRow label="Gross Income" val={monthlyGross} total={monthlyGross} />

                  <tr className="bg-slate-50/50">
                    <td
                      colSpan={3}
                      className="py-2 pl-4 text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                    >
                      IRS Estimation Details
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 pl-8 text-xs font-medium text-slate-500">
                      Tax rank level {irsDetails.taxRankLevel} /{" "}
                      {taxRanks[currentTaxRankYear].length}
                    </td>
                    <td className="py-2 text-right"></td>
                    <td className="py-2 pr-4 text-right"></td>
                  </tr>

                  <TableRow
                    label="Specific deductions"
                    val={irsDetails.specificDeductions / monthsWorked}
                    total={monthlyGross}
                    showPercentage={false}
                    color="text-slate-500"
                    indent
                  />
                  <TableRow
                    label="Expenses"
                    val={irsDetails.expenses > 0 ? irsDetails.expenses / monthsWorked : 0}
                    total={monthlyGross}
                    showPercentage={false}
                    color="text-slate-500"
                    indent
                  />
                  <TableRow
                    label="Youth IRS Discount"
                    val={irsDetails.youthIrsDiscount / monthsWorked}
                    total={monthlyGross}
                    showPercentage={false}
                    color="text-slate-500"
                    indent
                  />
                  <TableRow
                    label="Taxable income"
                    val={irsDetails.taxableIncome / monthsWorked}
                    total={monthlyGross}
                    showPercentage={false}
                    color="text-slate-500"
                    indent
                  />

                  <tr className="bg-slate-50/50">
                    <td
                      colSpan={3}
                      className="py-2 pl-4 text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                    >
                      Taxes
                    </td>
                  </tr>

                  <TableRow
                    label="IRS Withholding"
                    val={-monthlyIRS}
                    total={monthlyGross}
                    color="text-red-600"
                  />
                  <TableRow
                    label="Social Security"
                    val={-monthlySS}
                    total={monthlyGross}
                    color="text-amber-600"
                  />

                  <tr className="bg-emerald-50/30">
                    <td className="py-4 pl-4 font-bold text-slate-900">Net Income</td>
                    <td className="py-4 text-right font-bold text-slate-900">
                      {asCurrency(monthlyNet, 2)}
                    </td>
                    <td className="py-4 pr-4 text-right font-bold text-emerald-600">
                      {((monthlyNet / monthlyGross) * 100).toFixed(2)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
