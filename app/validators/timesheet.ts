import vine from '@vinejs/vine'

export const createTimesheetValidator = vine.compile(
  vine.object({
    weekStartDate: vine
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/),
  })
)
