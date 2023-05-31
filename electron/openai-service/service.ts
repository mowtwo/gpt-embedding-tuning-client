import { IpcMainEvent, ipcMain } from "electron"

export type ServiceOptions = Partial<{
  namespace: string
  result_name: string
}>

export type ServiceRequest<T> = {
  event: IpcMainEvent
  data: T
}

export type ServiceResponse = {
  send<T>(data: T): void
}

export type ServiceHandler<T> = (request: ServiceRequest<T>, response: ServiceResponse) => void

export default function make_service(options: ServiceOptions = {}) {
  const {
    namespace = 'gpt',
    result_name = 'result'
  } = options

  const make_route = (route: string) => `${namespace}:${route}`

  const make_result_route = (route: string) => `${make_route(route)}__${result_name}`

  const use = (route: string) => {
    const route_string = make_route(route)
    const route_result_string = make_result_route(route)
    return function <R>(handler: ServiceHandler<R>) {
      ipcMain.on(route_string, (event, data: R) => {
        handler({ event, data }, {
          send(data) {
            event.reply(
              route_result_string,
              data
            )
          },
        })
      })
    }
  }



  const use_get = (route: string) => {
    return use(
      `get_${route}`
    )
  }

  const use_set = (route: string) => {
    return use(
      `set_${route}`
    )
  }

  const use_remove = (route: string) => {
    return use(
      `remove_${route}`
    )
  }

  const use_all = (route: string) => {
    return {
      get: use_get(route),
      set: use_set(route),
      remove: use_remove(route)
    }
  }

  const get_route = <R>(route: string, handler: ServiceHandler<R>) => {
    return use_get(route)(handler)
  }

  const set_route = <R>(route: string, handler: ServiceHandler<R>) => {
    return use_set(route)(handler)
  }

  const remove_route = <R>(route: string, handler: ServiceHandler<R>) => {
    return use_remove(route)(handler)
  }

  const use_route = <R>(route: string, handler: ServiceHandler<R>) => {
    return use(route)(handler)
  }

  return {
    use, use_get, use_set, use_all, use_remove,
    get_route, set_route, use_route, remove_route
  }
}
