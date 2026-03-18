import { DateTime } from 'luxon'

export const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

export const ENTRY_DAY_FIELDS = [
  'workedDays',
  'weeklyRestDays',
  'legalPaidLeaveDays',
  'conventionalPaidLeaveDays',
  'publicHolidayDays',
  'rttDays',
  'sickDays',
  'otherAbsenceDays',
] as const

export const ENTRY_TOTAL_FIELDS = ['workedHours', ...ENTRY_DAY_FIELDS] as const

const DEFAULT_WEEKDAY_TEMPLATE = [
  { workedHours: 9, workedDays: 1 },
  { workedHours: 9, workedDays: 1 },
  { workedHours: 10, workedDays: 1 },
  { workedHours: 8, workedDays: 1 },
  { workedHours: 7, workedDays: 1 },
] as const

export interface TimesheetEntryInput {
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

export interface TimesheetEntryPayload {
  date: string
  workedHours?: string
  workedDays?: string
  weeklyRestDays?: string
  legalPaidLeaveDays?: string
  conventionalPaidLeaveDays?: string
  publicHolidayDays?: string
  rttDays?: string
  sickDays?: string
  otherAbsenceDays?: string
  otherAbsenceReason?: string
}

export interface TimesheetWarning {
  dayLabel: string
  date: string
  message: string
}

export interface TimesheetTotals {
  workedHours: number
  workedDays: number
  weeklyRestDays: number
  legalPaidLeaveDays: number
  conventionalPaidLeaveDays: number
  publicHolidayDays: number
  rttDays: number
  sickDays: number
  otherAbsenceDays: number
}

function roundValue(value: number): number {
  return Math.round(value * 100) / 100
}

export function normalizeWeekStartDate(input: string): DateTime {
  const parsed = DateTime.fromISO(input, { zone: 'utc' })
  if (!parsed.isValid) {
    throw new Error('Invalid week start date')
  }

  return parsed.startOf('day').minus({ days: parsed.weekday - 1 })
}

export function formatMonthLabel(date: DateTime): string {
  return date.setLocale('fr').toFormat('LLLL yyyy')
}

export function buildDefaultEntries(weekStartDate: DateTime): TimesheetEntryInput[] {
  return DAY_LABELS.map((dayLabel, index) => {
    const date = weekStartDate.plus({ days: index })
    const isWeekend = index >= 5
    const weekdayDefaults = DEFAULT_WEEKDAY_TEMPLATE[index]

    return {
      date: date.toISODate() ?? '',
      dayLabel,
      workedHours: weekdayDefaults?.workedHours ?? null,
      workedDays: weekdayDefaults?.workedDays ?? null,
      weeklyRestDays: isWeekend ? 1 : null,
      legalPaidLeaveDays: null,
      conventionalPaidLeaveDays: null,
      publicHolidayDays: null,
      rttDays: null,
      sickDays: null,
      otherAbsenceDays: null,
      otherAbsenceReason: '',
    }
  })
}

function parseNullableNumber(value: string | undefined, options: { max?: number } = {}): number | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().replace(',', '.')
  const parsed = Number(normalized)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  if (options.max !== undefined && parsed > options.max) {
    return null
  }

  return roundValue(parsed)
}

export function normalizeTimesheetEntries(entries: TimesheetEntryPayload[]): TimesheetEntryInput[] {
  return DAY_LABELS.map((dayLabel, index) => {
    const entry = entries[index]
    const entryDate = DateTime.fromISO(entry.date, { zone: 'utc' })

    return {
      date: entryDate.toISODate() ?? '',
      dayLabel,
      workedHours: parseNullableNumber(entry.workedHours, { max: 24 }),
      workedDays: parseNullableNumber(entry.workedDays, { max: 1 }),
      weeklyRestDays: parseNullableNumber(entry.weeklyRestDays, { max: 1 }),
      legalPaidLeaveDays: parseNullableNumber(entry.legalPaidLeaveDays, { max: 1 }),
      conventionalPaidLeaveDays: parseNullableNumber(entry.conventionalPaidLeaveDays, { max: 1 }),
      publicHolidayDays: parseNullableNumber(entry.publicHolidayDays, { max: 1 }),
      rttDays: parseNullableNumber(entry.rttDays, { max: 1 }),
      sickDays: parseNullableNumber(entry.sickDays, { max: 1 }),
      otherAbsenceDays: parseNullableNumber(entry.otherAbsenceDays, { max: 1 }),
      otherAbsenceReason: entry.otherAbsenceReason?.trim() ?? '',
    }
  })
}

export function computeTimesheetTotals(entries: TimesheetEntryInput[]): TimesheetTotals {
  return ENTRY_TOTAL_FIELDS.reduce(
    (totals, field) => {
      totals[field] = roundValue(entries.reduce((sum, entry) => sum + (entry[field] ?? 0), 0))
      return totals
    },
    {
      workedHours: 0,
      workedDays: 0,
      weeklyRestDays: 0,
      legalPaidLeaveDays: 0,
      conventionalPaidLeaveDays: 0,
      publicHolidayDays: 0,
      rttDays: 0,
      sickDays: 0,
      otherAbsenceDays: 0,
    } satisfies TimesheetTotals
  )
}

export function buildTimesheetWarnings(entries: TimesheetEntryInput[]): TimesheetWarning[] {
  const warnings: TimesheetWarning[] = []

  entries.forEach((entry) => {
    const dayValueTotal = ENTRY_DAY_FIELDS.reduce((sum, field) => sum + (entry[field] ?? 0), 0)

    if (dayValueTotal > 1) {
      warnings.push({
        dayLabel: entry.dayLabel,
        date: entry.date,
        message: 'Le total des jours déclarés dépasse 1.',
      })
    }

    if ((entry.workedHours ?? 0) > 0 && !entry.workedDays) {
      warnings.push({
        dayLabel: entry.dayLabel,
        date: entry.date,
        message: 'Des heures sont saisies sans jour travaillé.',
      })
    }

    if ((entry.workedDays ?? 0) > 0 && !(entry.workedHours && entry.workedHours > 0)) {
      warnings.push({
        dayLabel: entry.dayLabel,
        date: entry.date,
        message: 'Un jour travaillé est saisi sans nombre d’heures.',
      })
    }
  })

  return warnings
}
