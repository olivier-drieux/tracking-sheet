import vine from '@vinejs/vine'
import type { FieldContext } from '@vinejs/compiler/types'

function normalizeNumericString(value: string) {
  return value.trim().replace(',', '.')
}

const numericFieldRule = vine.createRule<{ max: number; halfStepOnly?: boolean }>(
  (value, options, field) => {
    if (typeof value !== 'string') {
      return
    }

    const normalized = normalizeNumericString(value)
    if (!normalized) {
      return
    }

    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      field.report('Valeur numerique invalide', 'numericField', field)
      return
    }

    const parsed = Number(normalized)
    if (!Number.isFinite(parsed) || parsed < 0) {
      field.report('La valeur doit etre positive', 'numericField', field)
      return
    }

    if (parsed > options.max) {
      field.report(`La valeur doit etre inferieure ou egale a ${options.max}`, 'numericField', field)
      return
    }

    if (options.halfStepOnly && Math.round(parsed * 2) !== parsed * 2) {
      field.report('Utilisez des pas de 0,5', 'numericField', field)
    }
  }
)

const otherAbsenceReasonRule = vine.createRule((value, _, field: FieldContext) => {
  if (!value || typeof value !== 'object') {
    return
  }

  const entry = value as Record<string, string | undefined>
  if (entry.otherAbsenceDays?.trim() && !entry.otherAbsenceReason?.trim()) {
    field.report('Precisez le motif de l’absence', 'required', field)
  }
})

const timesheetEntryValidator = vine
  .object({
    date: vine
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/),
    workedHours: vine.string().trim().optional().use(numericFieldRule({ max: 24 })),
    workedDays: vine.string().trim().optional().use(numericFieldRule({ max: 1, halfStepOnly: true })),
    weeklyRestDays: vine
      .string()
      .trim()
      .optional()
      .use(numericFieldRule({ max: 1, halfStepOnly: true })),
    legalPaidLeaveDays: vine
      .string()
      .trim()
      .optional()
      .use(numericFieldRule({ max: 1, halfStepOnly: true })),
    conventionalPaidLeaveDays: vine
      .string()
      .trim()
      .optional()
      .use(numericFieldRule({ max: 1, halfStepOnly: true })),
    publicHolidayDays: vine
      .string()
      .trim()
      .optional()
      .use(numericFieldRule({ max: 1, halfStepOnly: true })),
    rttDays: vine.string().trim().optional().use(numericFieldRule({ max: 1, halfStepOnly: true })),
    sickDays: vine.string().trim().optional().use(numericFieldRule({ max: 1, halfStepOnly: true })),
    otherAbsenceDays: vine
      .string()
      .trim()
      .optional()
      .use(numericFieldRule({ max: 1, halfStepOnly: true })),
    otherAbsenceReason: vine.string().trim().optional(),
  })
  .use(otherAbsenceReasonRule())

export const createTimesheetValidator = vine.compile(
  vine.object({
    weekStartDate: vine
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/),
  })
)

export const updateTimesheetValidator = vine.compile(
  vine.object({
    entries: vine.array(timesheetEntryValidator).fixedLength(7),
  })
)
