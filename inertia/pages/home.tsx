import { Link } from '@adonisjs/inertia/react'
import { InertiaProps } from '../types'

const AnyLink = Link as any

export default function Home({ user }: InertiaProps) {
  return (
    <>
      <div className="hero">
        <h1>Suivez vos heures hebdomadaires et sortez une fiche PDF exploitable.</h1>
        <p>
          Cette application centralise la saisie hebdomadaire, le calcul des totaux et la generation
          d’une fiche conforme a votre modele de suivi.
        </p>
        {user ? (
          <AnyLink className="button" route="timesheets.index">
            Ouvrir mes semaines
          </AnyLink>
        ) : (
          <AnyLink className="button" route="signup.create">
            Creer un compte
          </AnyLink>
        )}
      </div>

      <div className="cards">
        <div>
          <h3>Une fiche par semaine</h3>
          <p>
            Chaque semaine contient 7 lignes, les categories du modele papier et les totaux auto.
          </p>
        </div>

        <div>
          <h3>Profil reutilisable</h3>
          <p>Nom, forfait annuel et signature imagee sont reinjectes dans tous les exports.</p>
        </div>

        <div>
          <h3>Export PDF</h3>
          <p>Le document genere est pret a etre transmis sans ressaisie dans un autre outil.</p>
        </div>
      </div>
    </>
  )
}
