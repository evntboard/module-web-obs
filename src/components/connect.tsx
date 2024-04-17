import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

import { useAppStore } from '@/store'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'

const loginFormSchema = z.object({
  url: z.string().url(),
  name: z.string().min(2),
  token: z.string().min(2),
})

export function Connect() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showUrl, setShowUrl] = useState<boolean>(false)
  const startListening = useAppStore(s => s.startListening)

  const resolver = zodResolver(loginFormSchema)
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver,
    defaultValues: {
      url: 'wss://evntboard.io',
      name: 'media',
      token: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof loginFormSchema>) => {
    setIsLoading(true)
    try {
      await startListening({
        host: data.url,
        token: data.token,
        name: data.name,
      })
      navigate('/listening')
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid">
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              EvntBoard
            </h1>
            <h3 className="text-lg font-semibold tracking-tight">
              Module Web Media
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter your credentials below to connect to EvntBoard
            </p>
          </div>
          <div className="grid gap-6">
            <Form {...form}>
              <form
                className="flex flex-col gap-4 px-1 w-[350px]"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                {showUrl && (
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Host</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="wss://evntboard.io" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="media" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between">
                  <Button variant="link" type="button" onClick={() => setShowUrl(a => !a)}>
                    Change host
                  </Button>

                  <Button type="submit" className="flex gap-2">
                    Connect
                    <Icons.loader className={cn('animate-spin', { hidden: !isLoading })} />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
