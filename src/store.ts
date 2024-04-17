import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import { JSONRPCClient, JSONRPCErrorException, JSONRPCServer, JSONRPCServerAndClient } from 'json-rpc-2.0'
import * as z from 'zod'

let ws: WebSocket | null

const serverAndClient = new JSONRPCServerAndClient(
  new JSONRPCServer(),
  new JSONRPCClient((request) => {
    try {
      ws?.send(JSON.stringify(request))
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }, () => uuid()),
)

interface AppState {
  connected: boolean
  startListening: (props: { host: string, token: string, name: string }) => Promise<void>
  stopListening: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  connected: false,
  stopListening: async () => {
    ws?.close()
    set({ connected: false })
  },
  startListening: ({ host, token, name }): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      ws = new window.WebSocket(host)

      ws.onopen = async () => {
        serverAndClient.addMethod('play', async (data: string) => {
          const schema = z.object({
            volume: z.number().gte(0).lte(100),
            url: z.string(),
          })

          const params = schema.safeParse(data)

          if (!params.success) {
            return new JSONRPCErrorException(
              'Invalid params',
              213,
              params.error.issues,
            )
          }

          try {
            const audio = new Audio(params.data.url);
            audio.autoplay = true
            audio.volume = params.data.volume / 100
            await audio.play();
          } catch (e) {
            console.log(e)
          }
        })

        try {
          await serverAndClient.request('session.register', {
            code: 'media',
            name,
            token,
            subs: [],
          })

          set({ connected: true })
          resolve()
        } catch (e) {
          reject(e)
          set({
            connected: false,
          })
        }
      }

      ws.onmessage = (event) => {
        serverAndClient.receiveAndSend(JSON.parse(event.data.toString()))
      }

      ws.onclose = (event) => {
        serverAndClient.rejectAllPendingRequests(`Connection is closed (${event.reason}).`)
        set({ connected: false })
      }

      ws.onerror = (event) => {
        console.error('error a', event)
        reject()
        set({ connected: false })
      }
    })
  },
}))