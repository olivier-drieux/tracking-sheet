import { Form, Link } from '@adonisjs/inertia/react'
import { DateTime } from 'luxon'
import type { TimesheetPageProfile, TimesheetPageSummary } from './types'

interface TimesheetsIndexProps {
  profile: TimesheetPageProfile
  timesheets: TimesheetPageSummary[]
}

const AnyForm = Form as any
const AnyLink = Link as any

export default function TimesheetsIndex({ profile, timesheets }: TimesheetsIndexProps) {
  const suggestedDate = DateTime.now().startOf('week').plus({ days: 1 }).toISODate()

  return (
    <section className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Suivi hebdomadaire</p>
          <h1>Vos fiches de temps</h1>
          <p>Créez une semaine, éditez les 7 jours, puis exportez un PDF prêt à transmettre.</p>
        </div>
        <AnyLink className="button button-secondary" route="profile.edit">
          Profil
        </AnyLink>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <h2>Nouvelle semaine</h2>
          <p className="muted">
            La date est normalisée automatiquement au lundi de la semaine choisie.
          </p>
          <AnyForm action="/timesheets" method="post" className="stack-md">
            {({ errors, processing }: any) => (
              <>
                <div>
                  <label htmlFor="weekStartDate">Date de reference</label>
                  <input
                    id="weekStartDate"
                    type="date"
                    name="weekStartDate"
                    defaultValue={suggestedDate ?? undefined}
                    data-invalid={errors.weekStartDate ? 'true' : undefined}
                  />
                  {errors.weekStartDate && <div>{errors.weekStartDate}</div>}
                </div>

                <button type="submit" className="button" disabled={processing}>
                  Creer la fiche
                </button>
              </>
            )}
          </AnyForm>
        </div>

        <div className="panel panel-accent">
          <h2>Profil de sortie</h2>
          <dl className="profile-overview">
            <div>
              <dt>Nom</dt>
              <dd>{profile.fullName || 'A renseigner'}</dd>
            </div>
            <div>
              <dt>Forfait annuel</dt>
              <dd>{profile.annualDaysPackage} jours</dd>
            </div>
            <div>
              <dt>Signature</dt>
              <dd>{profile.hasSignature ? 'Importee' : 'Absente'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Historique</h2>
          <p className="muted">{timesheets.length} fiche(s) enregistree(s)</p>
        </div>

        {timesheets.length === 0 ? (
          <div className="empty-state">
            <p>Aucune fiche enregistree pour le moment.</p>
          </div>
        ) : (
          <div className="timesheet-list">
            {timesheets.map((timesheet: TimesheetPageSummary) => (
              <article key={timesheet.id} className="timesheet-card">
                <div>
                  <p className="eyebrow">Semaine du {formatDate(timesheet.weekStartDate)}</p>
                  <h3>{timesheet.monthLabel}</h3>
                  <p className="muted">
                    {timesheet.year} · {timesheet.status === 'ready' ? 'Enregistree' : 'Brouillon'}
                  </p>
                </div>

                <div className="card-actions">
                  <AnyLink
                    className="button button-secondary"
                    route="timesheets.edit"
                    routeParams={{ id: timesheet.id }}
                  >
                    Editer
                  </AnyLink>
                  <a className="button" href={`/timesheets/${timesheet.id}/pdf`}>
                    Export PDF
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function formatDate(date: string | null) {
  if (!date) {
    return '-'
  }

  return DateTime.fromISO(date).toFormat('dd/MM/yyyy')
}
