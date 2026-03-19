import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'signup.create': { paramsTuple?: []; params?: {} }
    'signup.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'timesheets.index': { paramsTuple?: []; params?: {} }
    'timesheets.store': { paramsTuple?: []; params?: {} }
    'timesheets.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'timesheets.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'timesheets.pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile.edit': { paramsTuple?: []; params?: {} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'signup.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'timesheets.index': { paramsTuple?: []; params?: {} }
    'timesheets.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'timesheets.pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile.edit': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'signup.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'timesheets.index': { paramsTuple?: []; params?: {} }
    'timesheets.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'timesheets.pdf': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile.edit': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'signup.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'timesheets.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'timesheets.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'profile.update': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'timesheets.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}