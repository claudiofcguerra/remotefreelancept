"use client"

import { ReactNode, useLayoutEffect, useMemo } from "react"
import { useTaxesStore } from "@/lib/store"
import { convertIncomeFrequency } from "@/lib/taxCalculations"
import { FrequencyChoices } from "@/lib/typings"
import { asCurrency } from "@/lib/utils"
import { Euro, Loader } from "lucide-react"

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}>
    {children}
  </div>
)

export default function Home() {
  const store = useTaxesStore()
  const {
    income,
    incomeFrequency,
    monthsWorked,
    isLoading,
    actions: { setIncome, setIncomeFrequency, setMonthsWorked, setIsLoading },
  } = store

  useLayoutEffect(() => {
    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const convertedIncome = useMemo(
    () => convertIncomeFrequency(income || 0, incomeFrequency, monthsWorked, 0),
    [income, incomeFrequency, monthsWorked]
  )

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
          <Card className="relative overflow-hidden p-6">
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
                  ≈ {asCurrency(convertedIncome.year)} / year
                </p>
              ) : (
                <p className="mt-2 text-right text-xs text-slate-400">
                  ≈ {asCurrency(convertedIncome.month)} / month
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
        </div>
      </div>
    </div>
  )
}
