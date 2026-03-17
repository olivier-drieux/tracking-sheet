import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('annual_days_package').notNullable().defaultTo(218)
      table.text('signature_data_url').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('annual_days_package')
      table.dropColumn('signature_data_url')
    })
  }
}
