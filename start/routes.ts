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
const NewAccountController = () => import('#controllers/new_account_controller')
const TimesheetsController = () => import('#controllers/timesheets_controller')
const ProfileController = () => import('#controllers/profile_controller')

router.on('/').renderInertia('home', {}).as('home')

router
  .group(() => {
    router.get('signup', [NewAccountController, 'create']).as('new_account.create')
    router.post('signup', [NewAccountController, 'store']).as('new_account.store')

    router.get('login', [SessionController, 'create']).as('session.create')
    router.post('login', [SessionController, 'store']).as('session.store')
  })
  .use(middleware.guest())

router
  .group(() => {
    router.get('timesheets', [TimesheetsController, 'index']).as('timesheets.index')
    router.post('timesheets', [TimesheetsController, 'store']).as('timesheets.store')
    router.get('timesheets/:id', [TimesheetsController, 'edit']).as('timesheets.edit')
    router.put('timesheets/:id', [TimesheetsController, 'update']).as('timesheets.update')
    router.get('timesheets/:id/pdf', [TimesheetsController, 'pdf']).as('timesheets.pdf')

    router.get('profile', [ProfileController, 'edit']).as('profile.edit')
    router.put('profile', [ProfileController, 'update']).as('profile.update')

    router.post('logout', [SessionController, 'destroy']).as('session.destroy')
  })
  .use(middleware.auth())
