import { Form, Link } from '@adonisjs/inertia/react'
import { ChangeEvent, useState } from 'react'

interface ProfilePageProps {
  profile: {
    fullName: string
    annualDaysPackage: number
    signatureDataUrl: string | null
  }
}

const AnyForm = Form as any
const AnyLink = Link as any

export default function ProfileEdit({ profile }: ProfilePageProps) {
  const [signatureDataUrl, setSignatureDataUrl] = useState(profile.signatureDataUrl ?? '')

  async function onSignatureChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      setSignatureDataUrl('')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSignatureDataUrl(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="page-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Profil</p>
          <h1>Parametres de la fiche</h1>
          <p>Ces informations sont reinjectees dans chaque feuille hebdomadaire et dans le PDF.</p>
        </div>
        <AnyLink className="button button-secondary" route="timesheets.index">
          Retour aux semaines
        </AnyLink>
      </div>

      <div className="panel">
        <AnyForm action="/profile" method="put" className="stack-lg">
          {({ errors, processing }: any) => (
            <>
              <div className="field-row">
                <div>
                  <label htmlFor="fullName">Nom et prenom</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    defaultValue={profile.fullName}
                    data-invalid={errors.fullName ? 'true' : undefined}
                  />
                  {errors.fullName && <div>{errors.fullName}</div>}
                </div>

                <div>
                  <label htmlFor="annualDaysPackage">Forfait annuel</label>
                  <input
                    type="number"
                    id="annualDaysPackage"
                    name="annualDaysPackage"
                    min="1"
                    max="366"
                    step="1"
                    defaultValue={profile.annualDaysPackage}
                    data-invalid={errors.annualDaysPackage ? 'true' : undefined}
                  />
                  {errors.annualDaysPackage && <div>{errors.annualDaysPackage}</div>}
                </div>
              </div>

              <div>
                <label htmlFor="signatureFile">Signature</label>
                <input
                  id="signatureFile"
                  type="file"
                  accept="image/*"
                  onChange={onSignatureChange}
                />
                <input type="hidden" name="signatureDataUrl" value={signatureDataUrl} />
              </div>

              <div className="signature-preview">
                {signatureDataUrl ? (
                  <img src={signatureDataUrl} alt="Signature importee" />
                ) : (
                  <p>Aucune signature importee.</p>
                )}
              </div>

              <div className="actions-row">
                <button type="submit" className="button" disabled={processing}>
                  Enregistrer le profil
                </button>
              </div>
            </>
          )}
        </AnyForm>
      </div>
    </section>
  )
}
