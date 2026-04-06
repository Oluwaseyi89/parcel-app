import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './AppRoutes'
import { ToastProvider } from './components/common/ToastProvider'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
