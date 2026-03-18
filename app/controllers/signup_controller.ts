import User from '#models/user'
import { signupValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'

export default class SignupController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/signup', {})
  }

  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(signupValidator)
    const user = await User.create({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
    })

    await auth.use('web').login(user)

    return response.redirect().toRoute('home')
  }
}
