import type User from '#models/user'

export interface ProfilePageProps {
  annualDaysPackage: number
  fullName: string
  hasSignature: boolean
  signatureDataUrl: string | null
}

export function serializeProfile(user: User): ProfilePageProps {
  return {
    annualDaysPackage: user.annualDaysPackage,
    fullName: user.fullName ?? '',
    hasSignature: Boolean(user.signatureDataUrl),
    signatureDataUrl: user.signatureDataUrl,
  }
}
