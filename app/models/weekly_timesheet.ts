import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import WeeklyTimesheetEntry from '#models/weekly_timesheet_entry'

export default class WeeklyTimesheet extends BaseModel {
  static table = 'weekly_timesheets'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column.date({
    prepare: (value: DateTime | string) =>
      typeof value === 'string'
        ? DateTime.fromISO(value, { zone: 'utc' }).toSQLDate()
        : value.toSQLDate(),
  })
  declare weekStartDate: DateTime

  @column()
  declare year: number

  @column()
  declare monthLabel: string

  @column()
  declare status: 'draft' | 'ready'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => WeeklyTimesheetEntry, {
    foreignKey: 'weeklyTimesheetId',
  })
  declare entries: HasMany<typeof WeeklyTimesheetEntry>
}
