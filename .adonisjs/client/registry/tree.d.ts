/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  signup: {
    create: typeof routes['signup.create']
    store: typeof routes['signup.store']
  }
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  timesheets: {
    index: typeof routes['timesheets.index']
    store: typeof routes['timesheets.store']
    edit: typeof routes['timesheets.edit']
    update: typeof routes['timesheets.update']
    pdf: typeof routes['timesheets.pdf']
  }
  profile: {
    edit: typeof routes['profile.edit']
    update: typeof routes['profile.update']
  }
}
