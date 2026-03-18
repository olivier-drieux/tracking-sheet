import WeeklyTimesheet from '#models/weekly_timesheet'
import { createTimesheetValidator, updateTimesheetValidator } from '#validators/timesheet'
import type { HttpContext } from '@adonisjs/core/http'
import {
  buildDefaultEntries,
  formatMonthLabel,
  normalizeTimesheetEntries,
  normalizeWeekStartDate,
} from '#services/timesheet_service'
import { buildTimesheetPdfBuffer } from '#services/timesheet_pdf_service'
import { serializeProfile } from '#transformers/profile_transformer'
import {
  serializeTimesheet,
  serializeTimesheetSummary,
} from '#transformers/timesheet_transformer'
import { DateTime } from 'luxon'

export default class TimesheetsController {
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const timesheets = await WeeklyTimesheet.query()
      .where('user_id', user.id)
      .orderBy('week_start_date', 'desc')

    return inertia.render('timesheets/index', {
      profile: serializeProfile(user),
      timesheets: timesheets.map(serializeTimesheetSummary),
    })
  }

  async store({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createTimesheetValidator)
    const weekStartDate = normalizeWeekStartDate(payload.weekStartDate)

    const existing = await WeeklyTimesheet.query()
      .where('user_id', user.id)
      .where('week_start_date', weekStartDate.toSQLDate()!)
      .first()

    if (existing) {
      session.flash('success', 'La fiche existe deja pour cette semaine')
      return response.redirect().toRoute('timesheets.edit', { id: existing.id })
    }

    const timesheet = await WeeklyTimesheet.create({
      userId: user.id,
      weekStartDate,
      year: weekStartDate.year,
      monthLabel: formatMonthLabel(weekStartDate),
      status: 'draft',
    })

    const entries = buildDefaultEntries(weekStartDate)
    await timesheet.related('entries').createMany(
      entries.map((entry, index) => ({
        position: index,
        entryDate: DateTime.fromISO(entry.date, { zone: 'utc' }),
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
        otherAbsenceReason: entry.otherAbsenceReason,
      }))
    )

    session.flash('success', 'Nouvelle fiche creee')

    return response.redirect().toRoute('timesheets.edit', { id: timesheet.id })
  }

  async edit({ inertia, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const timesheet = await this.findUserTimesheetOrFail(user.id, params.id)

    return inertia.render('timesheets/edit', {
      profile: serializeProfile(user),
      timesheet: serializeTimesheet(timesheet),
    })
  }

  async update({ request, response, auth, params, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const timesheet = await this.findUserTimesheetOrFail(user.id, params.id)
    const payload = await request.validateUsing(updateTimesheetValidator)
    const entries = normalizeTimesheetEntries(payload.entries)

    const sortedEntries = timesheet.entries.sort((left, right) => left.position - right.position)

    await Promise.all(
      sortedEntries.map((entry, index) => {
        const entryPayload = entries[index]

        entry.merge({
          entryDate: DateTime.fromISO(entryPayload.date, { zone: 'utc' }),
          dayLabel: entryPayload.dayLabel,
          workedHours: entryPayload.workedHours,
          workedDays: entryPayload.workedDays,
          weeklyRestDays: entryPayload.weeklyRestDays,
          legalPaidLeaveDays: entryPayload.legalPaidLeaveDays,
          conventionalPaidLeaveDays: entryPayload.conventionalPaidLeaveDays,
          publicHolidayDays: entryPayload.publicHolidayDays,
          rttDays: entryPayload.rttDays,
          sickDays: entryPayload.sickDays,
          otherAbsenceDays: entryPayload.otherAbsenceDays,
          otherAbsenceReason: entryPayload.otherAbsenceReason || null,
        })

        return entry.save()
      })
    )

    timesheet.status = 'ready'
    await timesheet.save()

    session.flash('success', 'Fiche enregistree')

    return response.redirect().toRoute('timesheets.edit', { id: timesheet.id })
  }

  async pdf({ response, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const timesheet = await this.findUserTimesheetOrFail(user.id, params.id)

    const serialized = serializeTimesheet(timesheet)
    const buffer = await buildTimesheetPdfBuffer(serialized, user)

    response.header('Content-Type', 'application/pdf')
    response.header(
      'Content-Disposition',
      `attachment; filename="timesheet-${serialized.weekStartDate ?? timesheet.id}.pdf"`
    )

    return response.send(buffer)
  }

  private findUserTimesheetOrFail(userId: number, timesheetId: number | string) {
    return WeeklyTimesheet.query()
      .where('id', timesheetId)
      .where('user_id', userId)
      .preload('entries')
      .firstOrFail()
  }
}
