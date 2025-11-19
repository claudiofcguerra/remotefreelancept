"use client";

import { useTaxesStore } from "@/lib/store";
import { FrequencyChoices } from "@/lib/typings";
import { asCurrency } from "@/lib/utils";
import { convertIncomeFrequency } from "@/lib/taxCalculations";
import { Euro } from "lucide-react";

import { ReactNode, useMemo, useState } from "react";

const Card = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}
  >
    {children}
  </div>
);

export default function Home() {
  const store = useTaxesStore();
  const [incomeMode, setIncomeMode] = useState<FrequencyChoices>(
    FrequencyChoices.Year
  );
  const [inputValue, setInputValue] = useState<number>(3000);
  const [monthsWorked, setMonthsWorked] = useState<number>(12);

  const convertedIncome = useMemo(
    () => convertIncomeFrequency(inputValue, incomeMode, monthsWorked, 0),
    [inputValue, incomeMode, monthsWorked]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 overflow-hidden relative">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-800">
              <Euro size={20} className="text-emerald-600" />
              Income Details
            </h2>

            <div className="bg-slate-100 p-1 rounded-lg flex mb-4">
              {Object.values(FrequencyChoices).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setIncomeMode(mode)}
                  className={`flex-1 py-1.5 text-xs font-semibold uppercase rounded-md transition-all ${
                    incomeMode === mode
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-1 capitalize">
                Gross Income / {incomeMode}
              </label>
              <div className="relative group">
                <input
                  type="number"
                  value={inputValue.toString()}
                  onChange={(e) => setInputValue(Number(e.target.value) || 0)}
                  className="w-full pl-4 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 font-bold text-xl text-slate-800 transition-all"
                />
                <span className="absolute right-4 top-3.5 text-slate-400 font-bold group-hover:text-emerald-500 transition-colors">
                  €
                </span>
              </div>
              {incomeMode !== FrequencyChoices.Year ? (
                <p className="text-xs text-slate-400 mt-2 text-right">
                  ≈ {asCurrency(convertedIncome.year)} / year
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-2 text-right">
                  ≈ {asCurrency(convertedIncome.month)} / month
                </p>
              )}
            </div>

            <div className="mb-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Months Worked / Year
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={monthsWorked}
                  onChange={(e) => setMonthsWorked(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="w-10 h-10 flex items-center justify-center bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="font-bold text-emerald-700">
                    {monthsWorked}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
