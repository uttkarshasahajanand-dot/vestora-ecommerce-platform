import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [errorMessage, setErrorMessage] = useState('')
  const { login, isAuthenticating, clearAuthError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    clearAuthError()
    const formData = new FormData(event.currentTarget)

    try {
      await login({
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || ''),
      })
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'We could not sign you in. Please try again.')
    }
  }

  return (
    <section className="mx-auto max-w-[520px] px-6 py-16 sm:py-24">
      <div className="text-center">
        <p className="eyebrow">Welcome back</p>
        <h1 className="section-title text-4xl">Sign in</h1>
        <p className="mt-3 text-sm text-muted">Your wardrobe, thoughtfully gathered.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-9 space-y-5">
        <div>
          <label htmlFor="login-email" className="form-label">Email address</label>
          <input id="login-email" name="email" className="form-input" type="email" autoComplete="email" required onChange={() => setErrorMessage('')} />
        </div>
        <div>
          <label htmlFor="login-password" className="form-label">Password</label>
          <input id="login-password" name="password" className="form-input" type="password" autoComplete="current-password" required onChange={() => setErrorMessage('')} />
        </div>
        <div className="text-right"><button type="button" className="text-xs text-muted underline underline-offset-4 hover:text-ink">Forgot password?</button></div>
        <button type="submit" disabled={isAuthenticating} className="w-full bg-ink px-5 py-4 text-[10px] uppercase tracking-[0.16em] text-ivory transition hover:bg-gold disabled:cursor-wait disabled:opacity-70">
          {isAuthenticating ? 'Signing in…' : 'Sign in'}
        </button>
        {errorMessage && <p className="border border-red-900/15 bg-white/70 p-3 text-left text-xs leading-5 text-red-900" role="alert">{errorMessage}</p>}
      </form>
      <p className="mt-8 text-center text-sm text-muted">New to VESTORA? <Link to="/register" className="text-ink underline underline-offset-4">Create an account</Link></p>
    </section>
  )
}
