import { updateProfileValidator } from '#validators/profile'
import { serializeProfile } from '#transformers/profile_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async edit({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    return inertia.render('profile/edit', {
      profile: serializeProfile(user),
    })
  }

  async update({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateProfileValidator)

    user.merge({
      fullName: payload.fullName,
      annualDaysPackage: payload.annualDaysPackage,
      signatureDataUrl: payload.signatureDataUrl ?? null,
    })

    await user.save()

    session.flash('success', 'Profil mis a jour')

    return response.redirect().toRoute('profile.edit')
  }
}
