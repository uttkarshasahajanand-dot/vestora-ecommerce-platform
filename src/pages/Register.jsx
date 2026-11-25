import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const [errorMessage, setErrorMessage] = useState('')
  const { register, isAuthenticating, clearAuthError } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    clearAuthError()
    const formData = new FormData(event.currentTarget)

    try {
      await register({
        name: String(formData.get('name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || ''),
      })
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'We could not create your account. Please try again.')
    }
  }

  return (
    <section className="mx-auto max-w-[520px] px-6 py-16 sm:py-24">
      <div className="text-center">
        <p className="eyebrow">A considered beginning</p>
        <h1 className="section-title text-4xl">Create an account</h1>
        <p className="mt-3 text-sm text-muted">Save your details for a more thoughtful checkout.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-9 space-y-5">
        <div>
          <label htmlFor="register-name" className="form-label">Full name</label>
          <input id="register-name" name="name" className="form-input" type="text" autoComplete="name" required onChange={() => setErrorMessage('')} />
        </div>
        <div>
          <label htmlFor="register-email" className="form-label">Email address</label>
          <input id="register-email" name="email" className="form-input" type="email" autoComplete="email" required onChange={() => setErrorMessage('')} />
        </div>
        <div>
          <label htmlFor="register-password" className="form-label">Create a password</label>
          <input id="register-password" name="password" className="form-input" type="password" autoComplete="new-password" minLength="8" required onChange={() => setErrorMessage('')} />
          <p className="mt-2 text-xs text-muted">Use at least 8 characters.</p>
        </div>
        <button type="submit" disabled={isAuthenticating} className="w-full bg-ink px-5 py-4 text-[10px] uppercase tracking-[0.16em] text-ivory transition hover:bg-gold disabled:cursor-wait disabled:opacity-70">
          {isAuthenticating ? 'Creating account…' : 'Create account'}
        </button>
        {errorMessage && <p className="border border-red-900/15 bg-white/70 p-3 text-left text-xs leading-5 text-red-900" role="alert">{errorMessage}</p>}
      </form>
      <p className="mt-8 text-center text-sm text-muted">Already have an account? <Link to="/login" className="text-ink underline underline-offset-4">Sign in</Link></p>
    </section>
  )
}
