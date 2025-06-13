import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/auth-context"
import Login from "./components/login"
import Home from "./components/home"
import { Layout } from "./components/layout"
import { ProtectedRoute } from "./components/protected-route"
import ManagementPage from "./components/admin/management-page"
import { Toaster } from "sonner"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
          </Route>
          <Route
            path="/management"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ManagementPage />} />
          </Route>
        </Routes>
      </Router>
      <Toaster position="bottom-right" richColors />
    </AuthProvider>
  )
}

export default App
