import {JSONRPCClient, JSONRPCServer, JSONRPCServerAndClient} from "json-rpc-2.0"
import {v4 as uuid} from "uuid"

import {MODULE_CODE} from "./constants.ts";
import {startObs} from "./startObs.ts";

import './style.css'

if (import.meta.env.DEV) {
  const hostEl = document.getElementById("host") as HTMLInputElement | null
  const nameEl = document.getElementById("name") as HTMLInputElement | null
  const tokenEl = document.getElementById("token") as HTMLInputElement | null

  if (import.meta.env.VITE_EVNTBOARD_HOST) {
    hostEl?.setAttribute('value', import.meta.env.VITE_EVNTBOARD_HOST)
  }

  if (import.meta.env.VITE_MODULE_NAME) {
    nameEl?.setAttribute('value', import.meta.env.VITE_MODULE_NAME)
  }

  if (import.meta.env.VITE_MODULE_TOKEN) {
    tokenEl?.setAttribute('value', import.meta.env.VITE_MODULE_TOKEN)
  }
}

let ws: WebSocket | undefined = undefined

const serverAndClient = new JSONRPCServerAndClient(
  new JSONRPCServer(),
  new JSONRPCClient((request) => {
    try {
      ws?.send(JSON.stringify(request))
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }, () => uuid())
)

document.getElementById("show-host")?.addEventListener(
  'click',
  () => {
    const hostContainerEl = document.getElementById("host-container")
    if (hostContainerEl) {
      if (hostContainerEl.classList.contains("hidden")) {
        hostContainerEl.classList.remove("hidden")
      } else {
        hostContainerEl.classList.add("hidden")
      }
    }
  }
)

document.getElementById("connect")?.addEventListener(
  'click',
  () => {
    const btnEl = document.getElementById("connect") as HTMLButtonElement | null
    const btnChangeHostEl = document.getElementById("show-host") as HTMLButtonElement | null
    const hostEl = document.getElementById("host") as HTMLInputElement | null
    const nameEl = document.getElementById("name") as HTMLInputElement | null
    const tokenEl = document.getElementById("token") as HTMLInputElement | null

    if (!hostEl || !nameEl || !tokenEl || !btnEl || !btnChangeHostEl) {
      console.error('ERROR on DOM')
      return
    }

    if (ws) {
      ws?.close()
      ws = undefined
      btnEl.innerText = "Connect"
      btnEl.removeAttribute('disabled')
      hostEl.removeAttribute('disabled')
      nameEl.removeAttribute('disabled')
      tokenEl.removeAttribute('disabled')
      btnChangeHostEl.removeAttribute('disabled')
      return
    }

    btnEl.setAttribute('disabled', 'true')
    hostEl.setAttribute('disabled', 'true')
    nameEl.setAttribute('disabled', 'true')
    tokenEl.setAttribute('disabled', 'true')
    btnChangeHostEl.setAttribute('disabled', 'true')

    ws = new WebSocket(hostEl.value)

    ws.onopen = async () => {
      const result: Array<{ key: string, value: string }> = await serverAndClient.request('session.register', {
        code: MODULE_CODE,
        name: nameEl.value,
        token: tokenEl.value
      })

      let obsHost = result?.find((c) => c.key === 'host')?.value ?? '127.0.0.1'
      let obsPort = result?.find((c) => c.key === 'port')?.value ?? '4455'
      let obsPassword = result?.find((c) => c.key === 'password')?.value ?? undefined

      try {
        await startObs(serverAndClient, obsHost, obsPort, obsPassword)
        btnEl.innerText = "Disconnect"
      } catch (e) {
        hostEl.removeAttribute('disabled')
        nameEl.removeAttribute('disabled')
        tokenEl.removeAttribute('disabled')
        btnChangeHostEl.removeAttribute('disabled')
      } finally {
        btnEl.removeAttribute('disabled')
      }
    }

    ws.onmessage = (event) => {
      serverAndClient.receiveAndSend(JSON.parse(event.data.toString()))
    }

    ws.onclose = (event) => {
      serverAndClient.rejectAllPendingRequests(`Connection is closed (${event.reason}).`)
    }

    ws.onerror = (event) => {
      console.error('error a', event)
    }
  }
)