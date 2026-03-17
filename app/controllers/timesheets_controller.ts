import WeeklyTimesheet from '#models/weekly_timesheet'
import { createTimesheetValidator } from '#validators/timesheet'
import type { HttpContext } from '@adonisjs/core/http'
import type { TimesheetTotals, TimesheetWarning } from '#services/timesheet_service'
import {
  buildDefaultEntries,
  buildTimesheetWarnings,
  computeTimesheetTotals,
  formatMonthLabel,
  normalizeWeekStartDate,
  parseTimesheetEntries,
} from '#services/timesheet_service'
import type WeeklyTimesheetEntry from '#models/weekly_timesheet_entry'
import PDFDocument from 'pdfkit'
import { DateTime } from 'luxon'

interface TimesheetPageEntry {
  id: number
  date: string
  dayLabel: string
  workedHours: number | null
  workedDays: number | null
  weeklyRestDays: number | null
  legalPaidLeaveDays: number | null
  conventionalPaidLeaveDays: number | null
  publicHolidayDays: number | null
  rttDays: number | null
  sickDays: number | null
  otherAbsenceDays: number | null
  otherAbsenceReason: string
}

interface SerializedTimesheet {
  id: number
  weekStartDate: string | null
  year: number
  monthLabel: string
  status: 'draft' | 'ready'
  entries: TimesheetPageEntry[]
  totals: TimesheetTotals
  warnings: TimesheetWarning[]
}

function serializeEntry(entry: WeeklyTimesheetEntry): TimesheetPageEntry {
  return {
    id: entry.id,
    date: entry.entryDate.toISODate() ?? '',
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
    otherAbsenceReason: entry.otherAbsenceReason ?? '',
  }
}

function serializeTimesheet(timesheet: WeeklyTimesheet): SerializedTimesheet {
  const entries = timesheet.entries
    .sort((left, right) => left.position - right.position)
    .map(serializeEntry)
  return {
    id: timesheet.id,
    weekStartDate: timesheet.weekStartDate.toISODate(),
    year: timesheet.year,
    monthLabel: timesheet.monthLabel,
    status: timesheet.status,
    entries,
    totals: computeTimesheetTotals(entries),
    warnings: buildTimesheetWarnings(entries),
  }
}

function drawPdfTable(doc: InstanceType<typeof PDFDocument>, rows: Array<Array<string>>) {
  const startX = 35
  let currentY = 150
  const rowHeight = 26
  const columnWidths = [20, 42, 55, 40, 45, 45, 50, 38, 65, 28, 84]

  doc.fontSize(8)

  rows.forEach((row, rowIndex) => {
    let currentX = startX
    const height = rowIndex === 0 ? 42 : rowHeight

    row.forEach((value, columnIndex) => {
      const width = columnWidths[columnIndex]
      doc.rect(currentX, currentY, width, height).stroke('#1f2937')
      doc.text(value, currentX + 3, currentY + 5, {
        width: width - 6,
        height: height - 8,
        align: 'center',
      })
      currentX += width
    })

    currentY += height
  })

  return currentY
}

function buildPdfBuffer(timesheet: SerializedTimesheet, user: HttpContext['auth']['user']) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 28 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(14).font('Helvetica-Bold')
    doc.text('Document de suivi hebdomadaire du temps de travail en heures et en jours', {
      align: 'center',
    })

    doc.moveDown(1.5)
    doc.fontSize(10).font('Helvetica')
    doc.text(`Annee : ${timesheet.year}`, 40, 85)
    doc.text(`Forfait annuel : ${user?.annualDaysPackage ?? 218} jours`, 320, 85)
    doc.text(`Nom et prenom : ${user?.fullName ?? user?.email ?? ''}`, 40, 105)
    doc.text(`Mois : ${timesheet.monthLabel}`, 320, 105)

    const header = [
      'Jour',
      'Date',
      'Heures',
      'Jours\ntrav.',
      'Repos\nhebdo',
      'CP\nlegaux',
      'CP\nconv.',
      'Feries',
      'RTT',
      'Mal.',
      'Autres absences',
    ]

    const bodyRows = timesheet.entries.map((entry) => [
      entry.dayLabel,
      DateTime.fromISO(entry.date).toFormat('dd/MM'),
      entry.workedHours ? String(entry.workedHours) : '',
      entry.workedDays ? String(entry.workedDays) : '',
      entry.weeklyRestDays ? String(entry.weeklyRestDays) : '',
      entry.legalPaidLeaveDays ? String(entry.legalPaidLeaveDays) : '',
      entry.conventionalPaidLeaveDays ? String(entry.conventionalPaidLeaveDays) : '',
      entry.publicHolidayDays ? String(entry.publicHolidayDays) : '',
      entry.rttDays ? String(entry.rttDays) : '',
      entry.sickDays ? String(entry.sickDays) : '',
      entry.otherAbsenceDays
        ? `${entry.otherAbsenceDays}${entry.otherAbsenceReason ? ` (${entry.otherAbsenceReason})` : ''}`
        : '',
    ])

    const totalsRow = [
      'Total',
      '',
      String(timesheet.totals.workedHours || ''),
      String(timesheet.totals.workedDays || ''),
      String(timesheet.totals.weeklyRestDays || ''),
      String(timesheet.totals.legalPaidLeaveDays || ''),
      String(timesheet.totals.conventionalPaidLeaveDays || ''),
      String(timesheet.totals.publicHolidayDays || ''),
      String(timesheet.totals.rttDays || ''),
      String(timesheet.totals.sickDays || ''),
      String(timesheet.totals.otherAbsenceDays || ''),
    ]

    const bottomY = drawPdfTable(doc, [header, ...bodyRows, totalsRow])

    doc.fontSize(9).font('Helvetica-Bold').fillColor('red')
    doc.text(
      'Rappel : le salarie doit veiller a respecter les durees minimales de repos quotidien (11h) et hebdomadaire (35h).',
      40,
      bottomY + 22,
      { width: 360 }
    )
    doc.fillColor('black').font('Helvetica')
    doc.text(
      '* Pour une demi-journee indiquer : 0,5 - Pour une journee indiquer : 1.',
      40,
      bottomY + 52
    )
    doc.text(
      '** Preciser l’absence : conge paternite, demenagement, conge pour mariage d’un enfant...',
      40,
      bottomY + 70
    )

    doc.font('Helvetica-Bold').text('Signature du salarie', 405, bottomY + 20, { underline: true })
    if (user?.signatureDataUrl) {
      const imageBuffer = Buffer.from(user.signatureDataUrl.split(',')[1] ?? '', 'base64')
      if (imageBuffer.length > 0) {
        doc.image(imageBuffer, 400, bottomY + 45, { fit: [150, 70] })
      }
    }

    doc.font('Helvetica').fontSize(9)
    doc.text(
      'A remplir par le salarie et a remettre le lundi suivant la semaine passee a l’employeur.',
      120,
      760,
      { align: 'center', width: 350 }
    )

    doc.end()
  })
}

export default class TimesheetsController {
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const timesheets = await WeeklyTimesheet.query()
      .where('user_id', user.id)
      .orderBy('week_start_date', 'desc')

    return (inertia as any).render('timesheets/index', {
      profile: {
        annualDaysPackage: user.annualDaysPackage,
        fullName: user.fullName ?? '',
        hasSignature: Boolean(user.signatureDataUrl),
      },
      timesheets: timesheets.map((timesheet) => ({
        id: timesheet.id,
        weekStartDate: timesheet.weekStartDate.toISODate(),
        monthLabel: timesheet.monthLabel,
        year: timesheet.year,
        status: timesheet.status,
      })),
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
      return response.redirect(`/timesheets/${existing.id}`)
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

    return response.redirect(`/timesheets/${timesheet.id}`)
  }

  async edit({ inertia, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const timesheet = await WeeklyTimesheet.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .preload('entries')
      .firstOrFail()

    return (inertia as any).render('timesheets/edit', {
      profile: {
        annualDaysPackage: user.annualDaysPackage,
        fullName: user.fullName ?? '',
        hasSignature: Boolean(user.signatureDataUrl),
      },
      timesheet: serializeTimesheet(timesheet),
    })
  }

  async update({ request, response, auth, params, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const timesheet = await WeeklyTimesheet.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .preload('entries')
      .firstOrFail()

    const parsed = parseTimesheetEntries(request.input('entries'))

    if (Object.keys(parsed.fieldErrors).length > 0) {
      return response.status(422).send({
        errors: parsed.fieldErrors,
      })
    }

    const sortedEntries = timesheet.entries.sort((left, right) => left.position - right.position)

    await Promise.all(
      sortedEntries.map((entry, index) => {
        const payload = parsed.entries[index]

        entry.merge({
          entryDate: DateTime.fromISO(payload.date, { zone: 'utc' }),
          dayLabel: payload.dayLabel,
          workedHours: payload.workedHours,
          workedDays: payload.workedDays,
          weeklyRestDays: payload.weeklyRestDays,
          legalPaidLeaveDays: payload.legalPaidLeaveDays,
          conventionalPaidLeaveDays: payload.conventionalPaidLeaveDays,
          publicHolidayDays: payload.publicHolidayDays,
          rttDays: payload.rttDays,
          sickDays: payload.sickDays,
          otherAbsenceDays: payload.otherAbsenceDays,
          otherAbsenceReason: payload.otherAbsenceReason || null,
        })

        return entry.save()
      })
    )

    timesheet.status = 'ready'
    await timesheet.save()

    session.flash('success', 'Fiche enregistree')

    return response.redirect(`/timesheets/${timesheet.id}`)
  }

  async pdf({ response, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const timesheet = await WeeklyTimesheet.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .preload('entries')
      .firstOrFail()

    const serialized = serializeTimesheet(timesheet)
    const buffer = await buildPdfBuffer(serialized, user)

    response.header('Content-Type', 'application/pdf')
    response.header(
      'Content-Disposition',
      `attachment; filename="timesheet-${serialized.weekStartDate ?? timesheet.id}.pdf"`
    )

    return response.send(buffer)
  }
}
