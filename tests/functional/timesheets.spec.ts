import { test } from '@japa/runner'
import User from '#models/user'
import WeeklyTimesheet from '#models/weekly_timesheet'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Timesheets', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('requires authentication for timesheets pages', async ({ client, assert }) => {
    const response = await client.get('/timesheets').redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/login')
  })

  test('creates a weekly timesheet normalized to monday', async ({ client, assert }) => {
    const user = await User.create({
      email: 'olivier@example.com',
      password: 'secret123',
      fullName: 'Olivier Drieux',
      annualDaysPackage: 218,
    })

    const response = await client
      .post('/timesheets')
      .withGuard('web')
      .loginAs(user)
      .redirects(0)
      .form({
        weekStartDate: '2026-03-18',
      })

    assert.equal(response.status(), 302)

    const timesheet = await WeeklyTimesheet.query()
      .where('user_id', user.id)
      .preload('entries')
      .firstOrFail()
    const orderedEntries = timesheet.entries.sort((a, b) => a.position - b.position)

    assert.equal(timesheet.weekStartDate.toISODate(), '2026-03-16')
    assert.lengthOf(timesheet.entries, 7)
    assert.equal(orderedEntries[0].workedHours, 9)
    assert.equal(orderedEntries[1].workedHours, 9)
    assert.equal(orderedEntries[2].workedHours, 10)
    assert.equal(orderedEntries[3].workedHours, 8)
    assert.equal(orderedEntries[4].workedHours, 7)
    assert.equal(orderedEntries[0].workedDays, 1)
    assert.equal(orderedEntries[5].weeklyRestDays, 1)
  })

  test('saves weekly entries and totals can be exported', async ({ client, assert }) => {
    const user = await User.create({
      email: 'timesheet@example.com',
      password: 'secret123',
      fullName: 'Olivier Drieux',
      annualDaysPackage: 218,
    })

    await client.post('/timesheets').withGuard('web').loginAs(user).redirects(0).form({
      weekStartDate: '2026-03-16',
    })

    const timesheet = await WeeklyTimesheet.query()
      .where('user_id', user.id)
      .preload('entries')
      .firstOrFail()
    const entries = timesheet.entries.sort((a, b) => a.position - b.position)

    const payload = entries.map((entry, index) => ({
      date: entry.entryDate.toISODate(),
      workedHours: index < 5 ? '8' : '',
      workedDays: index < 5 ? '1' : '',
      weeklyRestDays: index >= 5 ? '1' : '',
      legalPaidLeaveDays: '',
      conventionalPaidLeaveDays: '',
      publicHolidayDays: '',
      rttDays: '',
      sickDays: '',
      otherAbsenceDays: '',
      otherAbsenceReason: '',
    }))

    const updateResponse = await client
      .put(`/timesheets/${timesheet.id}`)
      .withGuard('web')
      .loginAs(user)
      .redirects(0)
      .json({
        entries: payload,
      })

    assert.equal(updateResponse.status(), 302)

    const refreshed = await WeeklyTimesheet.query()
      .where('id', timesheet.id)
      .preload('entries')
      .firstOrFail()
    assert.equal(refreshed.status, 'ready')
    assert.equal(refreshed.entries[0].workedHours, 8)

    const pdfResponse = await client
      .get(`/timesheets/${timesheet.id}/pdf`)
      .withGuard('web')
      .loginAs(user)
    assert.equal(pdfResponse.status(), 200)
    assert.equal(pdfResponse.header('content-type'), 'application/pdf')
  })

  test('requires other absence reason when days are set', async ({ client, assert }) => {
    const user = await User.create({
      email: 'absence@example.com',
      password: 'secret123',
      fullName: 'Olivier Drieux',
      annualDaysPackage: 218,
    })

    await client.post('/timesheets').withGuard('web').loginAs(user).redirects(0).form({
      weekStartDate: '2026-03-16',
    })

    const timesheet = await WeeklyTimesheet.query()
      .where('user_id', user.id)
      .preload('entries')
      .firstOrFail()
    const entries = timesheet.entries.sort((a, b) => a.position - b.position)

    const payload = entries.map((entry, index) => ({
      date: entry.entryDate.toISODate(),
      workedHours: '',
      workedDays: '',
      weeklyRestDays: index >= 5 ? '1' : '',
      legalPaidLeaveDays: '',
      conventionalPaidLeaveDays: '',
      publicHolidayDays: '',
      rttDays: '',
      sickDays: '',
      otherAbsenceDays: index === 0 ? '1' : '',
      otherAbsenceReason: '',
    }))

    const response = await client
      .put(`/timesheets/${timesheet.id}`)
      .withGuard('web')
      .loginAs(user)
      .redirects(0)
      .json({
        entries: payload,
      })

    assert.equal(response.status(), 422)
    assert.deepInclude(response.body(), {
      errors: {
        'entries.0.otherAbsenceReason': 'Précisez le motif de l’absence',
      },
    })
  })

  test('prevents access to another user timesheet', async ({ client, assert }) => {
    const owner = await User.create({
      email: 'owner@example.com',
      password: 'secret123',
      fullName: 'Owner User',
      annualDaysPackage: 218,
    })
    const intruder = await User.create({
      email: 'intruder@example.com',
      password: 'secret123',
      fullName: 'Intruder User',
      annualDaysPackage: 218,
    })

    await client.post('/timesheets').withGuard('web').loginAs(owner).redirects(0).form({
      weekStartDate: '2026-03-16',
    })

    const timesheet = await WeeklyTimesheet.query().where('user_id', owner.id).firstOrFail()

    const response = await client
      .get(`/timesheets/${timesheet.id}`)
      .withGuard('web')
      .loginAs(intruder)

    assert.equal(response.status(), 404)
  })

  test('profile can be updated with signature data url', async ({ client, assert }) => {
    const user = await User.create({
      email: 'profile@example.com',
      password: 'secret123',
      fullName: 'Old Name',
      annualDaysPackage: 218,
    })

    const response = await client.put('/profile').withGuard('web').loginAs(user).redirects(0).form({
      fullName: 'New Name',
      annualDaysPackage: 214,
      signatureDataUrl: 'data:image/png;base64,ZmFrZQ==',
    })

    assert.equal(response.status(), 302)

    await user.refresh()
    assert.equal(user.fullName, 'New Name')
    assert.equal(user.annualDaysPackage, 214)
    assert.equal(user.signatureDataUrl, 'data:image/png;base64,ZmFrZQ==')
  })
})
