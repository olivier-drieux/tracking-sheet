import type WeeklyTimesheet from '#models/weekly_timesheet'
import type WeeklyTimesheetEntry from '#models/weekly_timesheet_entry'
import {
  buildTimesheetWarnings,
  computeTimesheetTotals,
  type TimesheetTotals,
  type TimesheetWarning,
} from '#services/timesheet_service'

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

export interface SerializedTimesheet {
  id: number
  weekStartDate: string | null
  year: number
  monthLabel: string
  status: 'draft' | 'ready'
  entries: TimesheetPageEntry[]
  totals: TimesheetTotals
  warnings: TimesheetWarning[]
}

export interface SerializedTimesheetSummary {
  id: number
  weekStartDate: string | null
  monthLabel: string
  year: number
  status: 'draft' | 'ready'
}

export function serializeTimesheetEntry(entry: WeeklyTimesheetEntry): TimesheetPageEntry {
  return {
    id: entry.id,
    date: entry.entryDate.toISODate() ?? '',
    dayLabel: entry.dayLabel,
    workedHours: entry.workedHours,
    workedDays: entry.workedDays,
    weeklyRestDays: entry.weeklyRestDays,
    legalPaidLeaveDays: entry.legalPaidLeaveDays,
    conventionalPaidLeaveDays: entry.conventionalPaidLeaveDays,
    publicHolidayDays: entry.publicHolidayDays,
    rttDays: entry.rttDays,
    sickDays: entry.sickDays,
    otherAbsenceDays: entry.otherAbsenceDays,
    otherAbsenceReason: entry.otherAbsenceReason ?? '',
  }
}

export function serializeTimesheetSummary(
  timesheet: WeeklyTimesheet
): SerializedTimesheetSummary {
  return {
    id: timesheet.id,
    weekStartDate: timesheet.weekStartDate.toISODate(),
    monthLabel: timesheet.monthLabel,
    year: timesheet.year,
    status: timesheet.status,
  }
}

export function serializeTimesheet(timesheet: WeeklyTimesheet): SerializedTimesheet {
  const entries = timesheet.entries
    .sort((left, right) => left.position - right.position)
    .map(serializeTimesheetEntry)

  return {
    id: timesheet.id,
    weekStartDate: timesheet.weekStartDate.toISODate(),
    year: timesheet.year,
    monthLabel: timesheet.monthLabel,
    status: timesheet.status,
    entries,
    totals: computeTimesheetTotals(entries),
    warnings: buildTimesheetWarnings(entries),
  }
}
