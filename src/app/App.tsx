import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AppProviders } from '@/app/auth-context'
import { appRoutes } from '@/app/router'

const router = createBrowserRouter(appRoutes)

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
