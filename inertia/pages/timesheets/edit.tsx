import { Form, Link } from '@adonisjs/inertia/react'
import { ChangeEvent, useState } from 'react'
import { DateTime } from 'luxon'
import type {
  TimesheetPageEntry,
  TimesheetPageProfile,
  TimesheetPageWarning,
} from './types'

interface TimesheetEditProps {
  profile: TimesheetPageProfile
  timesheet: {
    id: number
    weekStartDate: string | null
    year: number
    monthLabel: string
    status: string
    entries: TimesheetPageEntry[]
    totals: Record<string, number>
    warnings: TimesheetPageWarning[]
  }
}

interface EditableEntry {
  id: number
  date: string
  dayLabel: string
  workedHours: string
  workedDays: string
  weeklyRestDays: string
  legalPaidLeaveDays: string
  conventionalPaidLeaveDays: string
  publicHolidayDays: string
  rttDays: string
  sickDays: string
  otherAbsenceDays: string
  otherAbsenceReason: string
}

const numericFields = [
  'workedHours',
  'workedDays',
  'weeklyRestDays',
  'legalPaidLeaveDays',
  'conventionalPaidLeaveDays',
  'publicHolidayDays',
  'rttDays',
  'sickDays',
  'otherAbsenceDays',
] as const

const dayFields = numericFields.filter((field) => field !== 'workedHours')

const AnyForm = Form as any
const AnyLink = Link as any

export default function TimesheetEdit({ timesheet, profile }: TimesheetEditProps) {
  const [entries, setEntries] = useState<EditableEntry[]>(
    timesheet.entries.map(
      (entry: TimesheetPageEntry): EditableEntry => ({
        ...entry,
        workedHours: toFieldValue(entry.workedHours),
        workedDays: toFieldValue(entry.workedDays),
        weeklyRestDays: toFieldValue(entry.weeklyRestDays),
        legalPaidLeaveDays: toFieldValue(entry.legalPaidLeaveDays),
        conventionalPaidLeaveDays: toFieldValue(entry.conventionalPaidLeaveDays),
        publicHolidayDays: toFieldValue(entry.publicHolidayDays),
        rttDays: toFieldValue(entry.rttDays),
        sickDays: toFieldValue(entry.sickDays),
        otherAbsenceDays: toFieldValue(entry.otherAbsenceDays),
      })
    )
  )

  const warnings = buildWarnings(entries)
  const totals = buildTotals(entries)

  function updateEntry(index: number, field: string, value: string) {
    setEntries((currentEntries: EditableEntry[]) =>
      currentEntries.map((entry: EditableEntry, entryIndex: number) =>
        entryIndex === index
          ? {
              ...entry,
              [field]: value,
            }
          : entry
      )
    )
  }

  return (
    <section className="page-shell page-shell-wide">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Semaine du {formatDate(timesheet.weekStartDate)}</p>
          <h1>Edition de la fiche</h1>
          <p>
            {profile.fullName || 'Nom non renseigne'} · {profile.annualDaysPackage} jours ·{' '}
            {profile.hasSignature ? 'signature importee' : 'signature absente'}
          </p>
        </div>

        <div className="card-actions">
          <AnyLink className="button button-secondary" route="timesheets.index">
            Retour a la liste
          </AnyLink>
          <a className="button" href={`/timesheets/${timesheet.id}/pdf`}>
            Export PDF
          </a>
        </div>
      </div>

      <div className="panel">
        <div className="timesheet-meta">
          <div>
            <span className="meta-label">Mois</span>
            <strong>{timesheet.monthLabel}</strong>
          </div>
          <div>
            <span className="meta-label">Statut</span>
            <strong>{timesheet.status === 'ready' ? 'Enregistree' : 'Brouillon'}</strong>
          </div>
        </div>

        <AnyForm action={`/timesheets/${timesheet.id}`} method="put" className="stack-lg">
          {({ errors, processing }: any) => (
            <>
              <div className="table-wrap">
                <table className="tracking-table">
                  <thead>
                    <tr>
                      <th>Jour</th>
                      <th>Date</th>
                      <th>Nombre heures travaillees</th>
                      <th>Jours travailles</th>
                      <th>Repos hebdomadaire</th>
                      <th>Repos jours CP legaux</th>
                      <th>Repos jours CP conventionnel</th>
                      <th>Repos jours feries</th>
                      <th>Repos RTT</th>
                      <th>Maladie</th>
                      <th>Autres absences</th>
                      <th>Motif absence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry: EditableEntry, index: number) => (
                      <tr key={entry.id}>
                        <td>{entry.dayLabel}</td>
                        <td>
                          <input
                            type="hidden"
                            name={`entries[${index}][date]`}
                            value={entry.date}
                          />
                          {DateTime.fromISO(entry.date).toFormat('dd/MM')}
                        </td>
                        {numericFields.map((field) => (
                          <td key={field}>
                            <input
                              type="number"
                              step={field === 'workedHours' ? '0.25' : '0.5'}
                              min="0"
                              max={field === 'workedHours' ? '24' : '1'}
                              name={`entries[${index}][${field}]`}
                              value={entry[field]}
                              onChange={(event) =>
                                updateEntry(index, field, event.currentTarget.value)
                              }
                              data-invalid={
                                errors[`entries.${index}.${field}`] ? 'true' : undefined
                              }
                            />
                            {errors[`entries.${index}.${field}`] && (
                              <div>{errors[`entries.${index}.${field}`]}</div>
                            )}
                          </td>
                        ))}
                        <td>
                          {(() => {
                            const otherAbsenceReasonError =
                              errors[`entries.${index}.otherAbsenceReason`] ?? errors[`entries.${index}`]

                            return (
                              <>
                                <input
                                  type="text"
                                  name={`entries[${index}][otherAbsenceReason]`}
                                  value={entry.otherAbsenceReason}
                                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    updateEntry(
                                      index,
                                      'otherAbsenceReason',
                                      event.currentTarget.value
                                    )
                                  }
                                  data-invalid={otherAbsenceReasonError ? 'true' : undefined}
                                />
                                {otherAbsenceReasonError && <div>{otherAbsenceReasonError}</div>}
                              </>
                            )
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>Total hebdomadaire</td>
                      {numericFields.map((field) => (
                        <td key={field}>{totals[field] ? totals[field] : ''}</td>
                      ))}
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="warning-grid">
                <div className="panel panel-subtle">
                  <h2>Alertes de coherence</h2>
                  {warnings.length === 0 ? (
                    <p className="muted">Aucune alerte pour le moment.</p>
                  ) : (
                    <ul className="warning-list">
                      {warnings.map((warning, index) => (
                        <li key={`${warning.date}-${index}`}>
                          <strong>
                            {warning.dayLabel} {formatDate(warning.date)}
                          </strong>{' '}
                          {warning.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="panel panel-subtle">
                  <h2>Rappel</h2>
                  <p className="muted">
                    Respecter les durees minimales de repos quotidien (11h) et hebdomadaire (35h).
                  </p>
                  <p className="muted">
                    Pour une demi-journee, saisir 0,5. Pour une journee, saisir 1.
                  </p>
                </div>
              </div>

              <div className="actions-row">
                <button type="submit" className="button" disabled={processing}>
                  Enregistrer la fiche
                </button>
              </div>
            </>
          )}
        </AnyForm>
      </div>
    </section>
  )
}

function toFieldValue(value: number | null) {
  return value === null ? '' : String(value)
}

function parseValue(value: string) {
  if (!value) {
    return 0
  }

  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function buildTotals(entries: EditableEntry[]) {
  return numericFields.reduce(
    (totals, field) => {
      totals[field] =
        Math.round(entries.reduce((sum, entry) => sum + parseValue(entry[field]), 0) * 100) / 100
      return totals
    },
    {} as Record<(typeof numericFields)[number], number>
  )
}

function buildWarnings(entries: EditableEntry[]) {
  return entries.flatMap((entry) => {
    const warnings: Array<{ dayLabel: string; date: string; message: string }> = []
    const totalDays = dayFields.reduce((sum, field) => sum + parseValue(entry[field]), 0)
    const workedHours = parseValue(entry.workedHours)
    const workedDays = parseValue(entry.workedDays)

    if (totalDays > 1) {
      warnings.push({
        dayLabel: entry.dayLabel,
        date: entry.date,
        message: 'Le total des jours declares depasse 1.',
      })
    }

    if (workedHours > 0 && workedDays === 0) {
      warnings.push({
        dayLabel: entry.dayLabel,
        date: entry.date,
        message: 'Des heures sont saisies sans jour travaille.',
      })
    }

    if (workedDays > 0 && workedHours === 0) {
      warnings.push({
        dayLabel: entry.dayLabel,
        date: entry.date,
        message: 'Un jour travaille est saisi sans heures.',
      })
    }

    return warnings
  })
}

function formatDate(date: string | null) {
  if (!date) {
    return '-'
  }

  return DateTime.fromISO(date).toFormat('dd/MM/yyyy')
}
