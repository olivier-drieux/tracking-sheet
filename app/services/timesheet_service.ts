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

export interface ParsedTimesheetPayload {
  entries: TimesheetEntryInput[]
  fieldErrors: Record<string, string>
}

const NUMBER_FIELDS = [
  'workedHours',
  'workedDays',
  'weeklyRestDays',
  'legalPaidLeaveDays',
  'conventionalPaidLeaveDays',
  'publicHolidayDays',
  'rttDays',
  'sickDays',
  'otherAbsenceDays',
] as const

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

function parseNullableNumber(
  value: unknown,
  fieldPath: string,
  errors: Record<string, string>,
  options: { halfStepOnly?: boolean; max?: number } = {}
): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const normalized = String(value).trim().replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    errors[fieldPath] = 'Valeur numérique invalide'
    return null
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) {
    errors[fieldPath] = 'La valeur doit être positive'
    return null
  }

  if (options.max !== undefined && parsed > options.max) {
    errors[fieldPath] = `La valeur doit être inférieure ou égale à ${options.max}`
    return null
  }

  if (options.halfStepOnly && Math.round(parsed * 2) !== parsed * 2) {
    errors[fieldPath] = 'Utilisez des pas de 0,5'
    return null
  }

  return roundValue(parsed)
}

export function parseTimesheetEntries(input: unknown): ParsedTimesheetPayload {
  const rawEntries = Array.isArray(input) ? input : []
  const fieldErrors: Record<string, string> = {}

  const entries = DAY_LABELS.map((dayLabel, index) => {
    const rawEntry = rawEntries[index]
    const rawRecord = rawEntry && typeof rawEntry === 'object' ? rawEntry : {}
    const entryDate = DateTime.fromISO(String((rawRecord as any).date ?? ''), { zone: 'utc' })

    const entry: TimesheetEntryInput = {
      date: entryDate.isValid ? (entryDate.toISODate() ?? '') : '',
      dayLabel,
      workedHours: null,
      workedDays: null,
      weeklyRestDays: null,
      legalPaidLeaveDays: null,
      conventionalPaidLeaveDays: null,
      publicHolidayDays: null,
      rttDays: null,
      sickDays: null,
      otherAbsenceDays: null,
      otherAbsenceReason: String((rawRecord as any).otherAbsenceReason ?? '').trim(),
    }

    if (!entry.date) {
      fieldErrors[`entries.${index}.date`] = 'Date invalide'
    }

    for (const field of NUMBER_FIELDS) {
      entry[field] = parseNullableNumber(
        (rawRecord as any)[field],
        `entries.${index}.${field}`,
        fieldErrors,
        {
          halfStepOnly: field !== 'workedHours',
          max: field === 'workedHours' ? 24 : 1,
        }
      )
    }

    if (entry.otherAbsenceDays && !entry.otherAbsenceReason) {
      fieldErrors[`entries.${index}.otherAbsenceReason`] = 'Précisez le motif de l’absence'
    }

    return entry
  })

  return { entries, fieldErrors }
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
