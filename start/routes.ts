/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const SessionController = () => import('#controllers/session_controller')
const SignupController = () => import('#controllers/signup_controller')
const TimesheetsController = () => import('#controllers/timesheets_controller')
const ProfileController = () => import('#controllers/profile_controller')

router.on('/').renderInertia('home', {}).as('home')

router
  .group(() => {
    router.get('signup', [SignupController, 'create']).as('signup.create')
    router.post('signup', [SignupController, 'store']).as('signup.store')

    router.get('login', [SessionController, 'create']).as('session.create')
    router.post('login', [SessionController, 'store']).as('session.store')
  })
  .use(middleware.guest())

router
  .group(() => {
    router.resource('timesheets', TimesheetsController).only(['index', 'store', 'edit', 'update'])
    router.get('timesheets/:id/pdf', [TimesheetsController, 'pdf']).as('timesheets.pdf')

    router.get('profile', [ProfileController, 'edit']).as('profile.edit')
    router.put('profile', [ProfileController, 'update']).as('profile.update')

    router.post('logout', [SessionController, 'destroy']).as('session.destroy')
  })
  .use(middleware.auth())
