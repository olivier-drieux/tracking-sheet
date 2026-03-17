import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'weekly_timesheets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.date('week_start_date').notNullable()
      table.integer('year').notNullable()
      table.string('month_label').notNullable()
      table.string('status').notNullable().defaultTo('draft')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['user_id', 'week_start_date'])
    })

    this.schema.createTable('weekly_timesheet_entries', (table) => {
      table.increments('id').notNullable()
      table
        .integer('weekly_timesheet_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('weekly_timesheets')
        .onDelete('CASCADE')
      table.integer('position').notNullable()
      table.date('entry_date').notNullable()
      table.string('day_label').notNullable()
      table.decimal('worked_hours', 5, 2).nullable()
      table.decimal('worked_days', 4, 2).nullable()
      table.decimal('weekly_rest_days', 4, 2).nullable()
      table.decimal('legal_paid_leave_days', 4, 2).nullable()
      table.decimal('conventional_paid_leave_days', 4, 2).nullable()
      table.decimal('public_holiday_days', 4, 2).nullable()
      table.decimal('rtt_days', 4, 2).nullable()
      table.decimal('sick_days', 4, 2).nullable()
      table.decimal('other_absence_days', 4, 2).nullable()
      table.text('other_absence_reason').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['weekly_timesheet_id', 'position'])
    })
  }

  async down() {
    this.schema.dropTable('weekly_timesheet_entries')
    this.schema.dropTable(this.tableName)
  }
}
