/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'signup.create': {
    methods: ["GET","HEAD"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['signup.create']['types'],
  },
  'signup.store': {
    methods: ["POST"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['signup.store']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.store']['types'],
  },
  'timesheets.index': {
    methods: ["GET","HEAD"],
    pattern: '/timesheets',
    tokens: [{"old":"/timesheets","type":0,"val":"timesheets","end":""}],
    types: placeholder as Registry['timesheets.index']['types'],
  },
  'timesheets.store': {
    methods: ["POST"],
    pattern: '/timesheets',
    tokens: [{"old":"/timesheets","type":0,"val":"timesheets","end":""}],
    types: placeholder as Registry['timesheets.store']['types'],
  },
  'timesheets.edit': {
    methods: ["GET","HEAD"],
    pattern: '/timesheets/:id/edit',
    tokens: [{"old":"/timesheets/:id/edit","type":0,"val":"timesheets","end":""},{"old":"/timesheets/:id/edit","type":1,"val":"id","end":""},{"old":"/timesheets/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['timesheets.edit']['types'],
  },
  'timesheets.update': {
    methods: ["PUT","PATCH"],
    pattern: '/timesheets/:id',
    tokens: [{"old":"/timesheets/:id","type":0,"val":"timesheets","end":""},{"old":"/timesheets/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['timesheets.update']['types'],
  },
  'timesheets.pdf': {
    methods: ["GET","HEAD"],
    pattern: '/timesheets/:id/pdf',
    tokens: [{"old":"/timesheets/:id/pdf","type":0,"val":"timesheets","end":""},{"old":"/timesheets/:id/pdf","type":1,"val":"id","end":""},{"old":"/timesheets/:id/pdf","type":0,"val":"pdf","end":""}],
    types: placeholder as Registry['timesheets.pdf']['types'],
  },
  'profile.edit': {
    methods: ["GET","HEAD"],
    pattern: '/profile',
    tokens: [{"old":"/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.edit']['types'],
  },
  'profile.update': {
    methods: ["PUT"],
    pattern: '/profile',
    tokens: [{"old":"/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.update']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
