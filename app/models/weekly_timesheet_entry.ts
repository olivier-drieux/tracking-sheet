import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import WeeklyTimesheet from '#models/weekly_timesheet'

export default class WeeklyTimesheetEntry extends BaseModel {
  static table = 'weekly_timesheet_entries'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare weeklyTimesheetId: number

  @column()
  declare position: number

  @column.date({
    columnName: 'entry_date',
    prepare: (value: DateTime | string) =>
      typeof value === 'string'
        ? DateTime.fromISO(value, { zone: 'utc' }).toSQLDate()
        : value.toSQLDate(),
  })
  declare entryDate: DateTime

  @column()
  declare dayLabel: string

  @column({
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare workedHours: number | null

  @column({
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare workedDays: number | null

  @column({
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare weeklyRestDays: number | null

  @column({
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare legalPaidLeaveDays: number | null

  @column({
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare conventionalPaidLeaveDays: number | null

  @column({
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare publicHolidayDays: number | null

  @column({
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare rttDays: number | null

  @column({
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare sickDays: number | null

  @column({
    consume: (value) => (value === null || value === undefined ? null : Number(value)),
  })
  declare otherAbsenceDays: number | null

  @column()
  declare otherAbsenceReason: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => WeeklyTimesheet)
  declare timesheet: BelongsTo<typeof WeeklyTimesheet>
}
