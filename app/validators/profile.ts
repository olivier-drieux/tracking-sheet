import vine from '@vinejs/vine'

export const updateProfileValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().maxLength(255),
    annualDaysPackage: vine.number().min(1).max(366),
    signatureDataUrl: vine.string().trim().nullable().optional(),
  })
)
