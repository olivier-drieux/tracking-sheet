import vine from '@vinejs/vine'

const email = () => vine.string().trim().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

export const loginValidator = vine.compile(
  vine.object({
    email: email(),
    password: password(),
  })
)

export const signupValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().maxLength(255).nullable(),
    email: email().unique({ table: 'users', column: 'email' }),
    password: password().confirmed({
      confirmationField: 'passwordConfirmation',
    }),
  })
)
