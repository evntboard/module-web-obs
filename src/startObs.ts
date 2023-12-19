import {JSONRPCServerAndClient} from "json-rpc-2.0";
import OBSWebSocket, {OBSRequestTypes, OBSEventTypes} from "obs-websocket-js";

import {OBS_EVENTS, OBS_REQUESTS} from "./constants.ts";
import {toEventName} from "./utils.ts";

export const startObs = async (serverAndClient: JSONRPCServerAndClient, obsHost: string, obsPort: string, obsPassword: string | undefined) => {
  const obsInstance = new OBSWebSocket()

  obsInstance.on('ConnectionOpened', () => {
    console.info('Connected to OBS')
    serverAndClient.notify('event.new', {
      name: toEventName('ConnectionOpened'),
    })
  })

  obsInstance.on('ConnectionClosed', () => {
    console.info('Disconnected from OBS')
    serverAndClient.notify('event.new', {
      name: toEventName('ConnectionClosed')
    })
    setTimeout(() => startObs(serverAndClient, obsHost, obsPort, obsPassword), 5000)
  })

  obsInstance.on('ConnectionError', (err) => {
    console.error(`Error OBS\n${err}`,)
    serverAndClient.notify('event.new', {
      name: toEventName('ConnectionError'),
      payload: err
    })

    setTimeout(() => startObs(serverAndClient, obsHost, obsPort, obsPassword), 5000)
  })

  OBS_REQUESTS.forEach((item) => {
    serverAndClient.addMethod(item, async (data) => {
      return await obsInstance.call(item as keyof OBSRequestTypes, data)
    })
  })

  OBS_EVENTS.forEach((item) => {
    obsInstance.on(item as keyof OBSEventTypes, (...args: any[]) => {
      serverAndClient.notify('event.new', {
        name: toEventName(item),
        payload: args?.[0] ?? {}
      })
    })
  })

  await obsInstance.connect(`ws://${obsHost}:${obsPort}`, obsPassword)
}