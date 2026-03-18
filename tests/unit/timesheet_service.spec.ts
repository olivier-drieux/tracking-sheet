import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import {
  buildDefaultEntries,
  buildTimesheetWarnings,
  computeTimesheetTotals,
  normalizeTimesheetEntries,
  normalizeWeekStartDate,
} from '#services/timesheet_service'

test.group('Timesheet service', () => {
  test('normalizes a week start date to monday', ({ assert }) => {
    const monday = normalizeWeekStartDate('2026-03-18')

    assert.equal(monday.toISODate(), '2026-03-16')
  })

  test('normalizes validated entry payloads to domain entries', ({ assert }) => {
    const entries = normalizeTimesheetEntries([
      {
        date: '2026-03-16',
        workedHours: '8',
        workedDays: '1',
        otherAbsenceReason: ' ',
      },
      {
        date: '2026-03-17',
        workedHours: '7,5',
        workedDays: '1',
      },
      ...buildDefaultEntries(DateTime.fromISO('2026-03-18', { zone: 'utc' })).slice(2).map((entry) => ({
        date: entry.date,
        workedHours: entry.workedHours ? String(entry.workedHours) : '',
        workedDays: entry.workedDays ? String(entry.workedDays) : '',
        weeklyRestDays: entry.weeklyRestDays ? String(entry.weeklyRestDays) : '',
        legalPaidLeaveDays: '',
        conventionalPaidLeaveDays: '',
        publicHolidayDays: '',
        rttDays: '',
        sickDays: '',
        otherAbsenceDays: '',
        otherAbsenceReason: '',
      })),
    ])

    assert.equal(entries[0].dayLabel, 'L')
    assert.equal(entries[0].workedHours, 8)
    assert.equal(entries[1].workedHours, 7.5)
    assert.equal(entries[0].otherAbsenceReason, '')
  })

  test('computes totals and warnings from domain entries', ({ assert }) => {
    const entries = buildDefaultEntries(DateTime.fromISO('2026-03-16', { zone: 'utc' }))
    entries[0].workedDays = 0.5
    entries[0].legalPaidLeaveDays = 1
    entries[0].workedHours = 4

    const totals = computeTimesheetTotals(entries)
    const warnings = buildTimesheetWarnings(entries)

    assert.equal(totals.workedHours, 40)
    assert.equal(totals.legalPaidLeaveDays, 1)
    assert.equal(warnings[0]?.message, 'Le total des jours déclarés dépasse 1.')
  })
})
