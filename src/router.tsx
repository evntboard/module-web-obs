import { createBrowserRouter, LoaderFunctionArgs, Outlet, redirect } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Connect } from '@/components/connect'
import { Listen } from '@/components/listen'
import { useAppStore } from '@/store'
import { ThemeToggle } from '@/components/theme-toggle.tsx';

export const router = createBrowserRouter([
  {
    path: '',
    element: (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="absolute right-4 top-4 md:right-8 md:top-8">
          <ThemeToggle />
        </div>
        <Outlet />
      </ThemeProvider>
    ),
    children: [
      {
        loader: async (args: LoaderFunctionArgs) => {
          const startListening = useAppStore.getState().startListening
          const url = new URLSearchParams(new URL(args.request.url).search)
          const host = url.get('host')
          const name = url.get('name')
          const token = url.get('token')

          if (token) {
            try {
              console.log('PASSE')
              await startListening({
                host: host ?? 'wss://evntboard.io',
                name: name ?? 'media',
                token,
              })
              return redirect('/listening')
            } catch (e) {
              return redirect('/')
            }
          }
          return null
        },
        path: '/',
        element: (<Connect />),
      },
      {
        loader: () => {
          const connected = useAppStore.getState().connected
          if (!connected) {
            return redirect('/')
          }
          return null
        },
        path: '/listening',
        element: (<Listen />),
      },
    ],
  },
])
