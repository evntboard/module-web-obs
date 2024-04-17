import { Button } from '@/components/ui/button.tsx'
import { useAppStore } from '@/store.ts'
import { useNavigate } from 'react-router-dom'

export function Listen() {
  const navigate = useNavigate()
  const stopListening = useAppStore(s => s.stopListening)

  const handleDisconnect = async () => {
    await stopListening()
    navigate('/')
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid">
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              App currently listening
            </h1>
            <p className="text-sm text-muted-foreground">
              If you have any issues check discord
            </p>
          </div>
          <div className="grid gap-6">
            <Button onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
