export interface TimesheetPageEntry {
  id: number
  date: string
  dayLabel: string
  workedHours: number | null
  workedDays: number | null
  weeklyRestDays: number | null
  legalPaidLeaveDays: number | null
  conventionalPaidLeaveDays: number | null
  publicHolidayDays: number | null
  rttDays: number | null
  sickDays: number | null
  otherAbsenceDays: number | null
  otherAbsenceReason: string
}

export interface TimesheetPageWarning {
  dayLabel: string
  date: string
  message: string
}

export interface TimesheetPageProfile {
  annualDaysPackage: number
  fullName: string
  hasSignature: boolean
}

export interface TimesheetPageSummary {
  id: number
  weekStartDate: string | null
  monthLabel: string
  year: number
  status: string
}
