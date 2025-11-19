import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

import { isYearOfYouthIrsValid, SUPPORTED_TAX_RANK_YEARS } from "./taxCalculations"
import { FrequencyChoices, TaxRank, YouthIrs } from "./typings"
import { generateUUID } from "./utils"

const SIMULATIONS_LOCAL_STORE_KEY = "net_income_simulations"

interface StoredSimulation {
  id: string
  simulationName: string
  createdAt: string
  parameters: Record<string, string | number | boolean>
}

interface Actions {
  setIncome: (value: number) => void
  setSsDiscount: (value: number) => void
  setCurrentTaxRankYear: (taxRankYear: (typeof SUPPORTED_TAX_RANK_YEARS)[number]) => void
  setBenefitsOfYouthIrs: (value: boolean) => void
  setYearOfYouthIrs: (year: number) => void
  setFirstYear: (value: boolean) => void
  setSecondYear: (value: boolean) => void
  setRnh: (value: boolean) => void
  setSsFirstYear: (value: boolean) => void
  setStoredSimulations: (storedSimulations: StoredSimulation[] | null) => void
  loadSimulations: () => void
  deleteSimulation: (id: string) => void
  updateStoredSimulations: () => void
  storeSimulation: (simulationName: string) => void
  setIncomeFrequency: (frequency: FrequencyChoices) => void
  setMonthsWorked: (months: number) => void
  setIsLoading: (isLoading: boolean) => void
  reset: () => void
}

interface TaxesState {
  income: number | null
  ssDiscount: number
  currentTaxRankYear: (typeof SUPPORTED_TAX_RANK_YEARS)[number]
  firstYear: boolean
  secondYear: boolean
  rnh: boolean
  ssFirstYear: boolean
  benefitsOfYouthIrs: boolean
  yearOfYouthIrs: number
  incomeFrequency: FrequencyChoices
  monthsWorked: number
  isLoading: boolean

  ssDiscountChoices: number[]
  ssTax: number
  rnhTax: number
  maxExpensesTax: number
  taxRanks: { [K in (typeof SUPPORTED_TAX_RANK_YEARS)[number]]: TaxRank[] }
  iasPerYear: { [K in (typeof SUPPORTED_TAX_RANK_YEARS)[number]]: number }
  youthIrs: { [K in (typeof SUPPORTED_TAX_RANK_YEARS)[number]]: YouthIrs }

  storedSimulations: StoredSimulation[] | null

  actions: Actions
}

const initialState: Omit<TaxesState, "actions"> = {
  income: null,
  ssDiscount: 0,
  currentTaxRankYear: SUPPORTED_TAX_RANK_YEARS[0],
  firstYear: false,
  secondYear: false,
  rnh: false,
  ssFirstYear: false,
  benefitsOfYouthIrs: false,
  yearOfYouthIrs: 1,
  incomeFrequency: FrequencyChoices.Month,
  monthsWorked: 12,
  isLoading: true,

  ssDiscountChoices: [-0.25, -0.2, -0.15, -0.1, -0.05, 0, +0.05, +0.1, +0.15, +0.2, +0.25],
  ssTax: 0.214,
  rnhTax: 0.2,
  maxExpensesTax: 15,
  taxRanks: {
    2023: [
      { id: 1, min: 0, max: 7479, normalTax: 0.145, averageTax: 0.145 },
      { id: 2, min: 7479, max: 11284, normalTax: 0.21, averageTax: 0.1669 },
      { id: 3, min: 11284, max: 15992, normalTax: 0.265, averageTax: 0.1958 },
      { id: 4, min: 15992, max: 20700, normalTax: 0.285, averageTax: 0.2161 },
      { id: 5, min: 20700, max: 26355, normalTax: 0.35, averageTax: 0.2448 },
      { id: 6, min: 26355, max: 38632, normalTax: 0.37, averageTax: 0.2846 },
      { id: 7, min: 38632, max: 50483, normalTax: 0.435, averageTax: 0.3199 },
      { id: 8, min: 50483, max: 78834, normalTax: 0.45, averageTax: 0.3667 },
      { id: 9, min: 78834, normalTax: 0.48, max: null, averageTax: null },
    ],
    2024: [
      { id: 1, min: 0, max: 7703, normalTax: 0.13, averageTax: 0.13 },
      { id: 2, min: 7703, max: 11623, normalTax: 0.165, averageTax: 0.1418 },
      { id: 3, min: 11623, max: 16472, normalTax: 0.22, averageTax: 0.16482 },
      { id: 4, min: 16472, max: 21321, normalTax: 0.25, averageTax: 0.18419 },
      { id: 5, min: 21321, max: 27146, normalTax: 0.32, averageTax: 0.21334 },
      { id: 6, min: 27146, max: 39791, normalTax: 0.35, averageTax: 0.25835 },
      { id: 7, min: 39791, max: 43000, normalTax: 0.435, averageTax: 0.27154 },
      { id: 8, min: 43000, max: 80000, normalTax: 0.45, averageTax: 0.35408 },
      { id: 9, min: 80000, normalTax: 0.48, max: null, averageTax: null },
    ],
    2025: [
      { id: 1, min: 0, max: 8059, normalTax: 0.13, averageTax: 0.13 },
      { id: 2, min: 8059, max: 12160, normalTax: 0.165, averageTax: 0.1418 },
      { id: 3, min: 12160, max: 17233, normalTax: 0.22, averageTax: 0.16482 },
      { id: 4, min: 17233, max: 22306, normalTax: 0.25, averageTax: 0.18419 },
      { id: 5, min: 22306, max: 28400, normalTax: 0.32, averageTax: 0.21334 },
      { id: 6, min: 28400, max: 41629, normalTax: 0.355, averageTax: 0.25835 },
      { id: 7, min: 41629, max: 44987, normalTax: 0.435, averageTax: 0.27154 },
      { id: 8, min: 44987, max: 83696, normalTax: 0.45, averageTax: 0.35408 },
      { id: 9, min: 83696, normalTax: 0.48, max: null, averageTax: null },
    ],
  },
  iasPerYear: {
    2023: 480.43,
    2024: 509.26,
    2025: 522.5,
  },
  youthIrs: {
    2023: {
      1: { maxDiscountPercentage: 0.5, maxDiscountIasMultiplier: 12.5 },
      2: { maxDiscountPercentage: 0.4, maxDiscountIasMultiplier: 10 },
      3: { maxDiscountPercentage: 0.3, maxDiscountIasMultiplier: 7.5 },
      4: { maxDiscountPercentage: 0.3, maxDiscountIasMultiplier: 7.5 },
      5: { maxDiscountPercentage: 0.2, maxDiscountIasMultiplier: 5 },
    },
    2024: {
      1: { maxDiscountPercentage: 1, maxDiscountIasMultiplier: 40 },
      2: { maxDiscountPercentage: 0.75, maxDiscountIasMultiplier: 30 },
      3: { maxDiscountPercentage: 0.5, maxDiscountIasMultiplier: 20 },
      4: { maxDiscountPercentage: 0.5, maxDiscountIasMultiplier: 20 },
      5: { maxDiscountPercentage: 0.25, maxDiscountIasMultiplier: 10 },
    },
    2025: {
      1: { maxDiscountPercentage: 1, maxDiscountIasMultiplier: 55 },
      2: { maxDiscountPercentage: 0.75, maxDiscountIasMultiplier: 55 },
      3: { maxDiscountPercentage: 0.75, maxDiscountIasMultiplier: 55 },
      4: { maxDiscountPercentage: 0.75, maxDiscountIasMultiplier: 55 },
      5: { maxDiscountPercentage: 0.5, maxDiscountIasMultiplier: 55 },
      6: { maxDiscountPercentage: 0.5, maxDiscountIasMultiplier: 55 },
      7: { maxDiscountPercentage: 0.5, maxDiscountIasMultiplier: 55 },
      8: { maxDiscountPercentage: 0.25, maxDiscountIasMultiplier: 55 },
      9: { maxDiscountPercentage: 0.25, maxDiscountIasMultiplier: 55 },
      10: { maxDiscountPercentage: 0.25, maxDiscountIasMultiplier: 55 },
    },
  },

  storedSimulations: null,
}

export const useTaxesStore = create<TaxesState>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,
        actions: {
          setIncome: (value: number) => {
            set((state) => {
              state.income = value <= 0 ? null : value
            })
          },
          setSsDiscount: (value: number) => {
            set((state) => {
              state.ssDiscount = value
            })
          },
          setCurrentTaxRankYear: (taxRankYear: (typeof SUPPORTED_TAX_RANK_YEARS)[number]) => {
            set((state) => {
              state.currentTaxRankYear = taxRankYear
            })
          },
          setBenefitsOfYouthIrs: (value: boolean) => {
            set((state) => {
              state.benefitsOfYouthIrs = value
            })
          },
          setYearOfYouthIrs: (year: number) => {
            set((state) => {
              if (isYearOfYouthIrsValid(year, state.currentTaxRankYear)) {
                state.yearOfYouthIrs = year
              }
            })
          },
          setFirstYear: (value: boolean) => {
            set((state) => {
              state.firstYear = value
              if (value && state.secondYear) {
                state.secondYear = false
              }
            })
          },
          setSecondYear: (value: boolean) => {
            set((state) => {
              state.secondYear = value
              if (value) {
                state.firstYear = false
              }
            })
          },
          setRnh: (value: boolean) => {
            set((state) => {
              state.rnh = value
            })
          },
          setSsFirstYear: (value: boolean) => {
            set((state) => {
              state.ssFirstYear = value
            })
          },
          setStoredSimulations: (storedSimulations: StoredSimulation[] | null) => {
            set((state) => {
              state.storedSimulations = storedSimulations
            })
          },
          loadSimulations: () => {
            set((state) => {
              if (!state.storedSimulations) {
                const simulations =
                  typeof window !== "undefined"
                    ? localStorage.getItem(SIMULATIONS_LOCAL_STORE_KEY)
                    : null
                state.storedSimulations = simulations ? JSON.parse(simulations) : []
              }
            })
          },
          deleteSimulation: (id: string) => {
            set((state) => {
              const index = state.storedSimulations?.findIndex((s: StoredSimulation) => s.id === id)
              if (index !== undefined && index !== -1 && state.storedSimulations) {
                state.storedSimulations.splice(index, 1)
                set((s) => {
                  s.actions.updateStoredSimulations()
                })
              }
            })
          },
          updateStoredSimulations: () => {
            set((state) => {
              if (typeof window !== "undefined") {
                localStorage.setItem(
                  SIMULATIONS_LOCAL_STORE_KEY,
                  JSON.stringify(state.storedSimulations)
                )
              }
            })
          },
          storeSimulation: (simulationName: string) => {
            set((state) => {
              if (!state.storedSimulations) {
                set((s) => {
                  s.actions.loadSimulations()
                })
              }
              if (!Array.isArray(state.storedSimulations)) {
                state.storedSimulations = []
              }
              state.storedSimulations.push({
                id: generateUUID(),
                simulationName,
                createdAt: new Date().toISOString(),
                parameters: {
                  income: state.income || 0,
                  ssDiscount: state.ssDiscount,
                },
              })
              set((s) => {
                s.actions.updateStoredSimulations()
              })
            })
          },
          setIncomeFrequency: (frequency: FrequencyChoices) => {
            set((state) => {
              state.incomeFrequency = frequency
            })
          },
          setMonthsWorked: (months: number) => {
            set((state) => {
              state.monthsWorked = months
            })
          },
          setIsLoading: (isLoading: boolean) => {
            set((state) => {
              state.isLoading = isLoading
            })
          },
          reset: () => {
            set((state) => {
              state.income = null
              state.ssDiscount = 0
              state.currentTaxRankYear = SUPPORTED_TAX_RANK_YEARS[0]
              state.firstYear = false
              state.secondYear = false
              state.rnh = false
              state.ssFirstYear = false
              state.benefitsOfYouthIrs = false
              state.yearOfYouthIrs = 1
              state.incomeFrequency = FrequencyChoices.Month
              state.monthsWorked = 12
              state.isLoading = true
            })
          },
        },
      })),
      {
        name: "taxes_store",
        partialize: (state) => ({
          income: state.income,
          ssDiscount: state.ssDiscount,
          currentTaxRankYear: state.currentTaxRankYear,
          firstYear: state.firstYear,
          secondYear: state.secondYear,
          rnh: state.rnh,
          ssFirstYear: state.ssFirstYear,
          benefitsOfYouthIrs: state.benefitsOfYouthIrs,
          yearOfYouthIrs: state.yearOfYouthIrs,
          incomeFrequency: state.incomeFrequency,
          monthsWorked: state.monthsWorked,
        }),
      }
    ),
    {
      name: "Taxes Store",
      enabled: process.env.NODE_ENV === "development",
    }
  )
)
