import type User from '#models/user'
import type { SerializedTimesheet } from '#transformers/timesheet_transformer'
import PDFDocument from 'pdfkit'
import { DateTime } from 'luxon'

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

export function buildTimesheetPdfBuffer(timesheet: SerializedTimesheet, user: User) {
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
    doc.text(`Forfait annuel : ${user.annualDaysPackage} jours`, 320, 85)
    doc.text(`Nom et prenom : ${user.fullName ?? user.email}`, 40, 105)
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
    if (user.signatureDataUrl) {
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
