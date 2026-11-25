import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import * as User from '../models/User.js'
import { env } from '../config/env.js'
import HttpError from '../utils/HttpError.js'

const bcryptRounds = 12

function createToken(user) {
  return jwt.sign(
    { role: user.role },
    env.jwtSecret,
    { subject: String(user.id), expiresIn: env.jwtExpiresIn },
  )
}

export async function register(request, response) {
  const { name, email, password } = request.body
  const passwordHash = await bcrypt.hash(password, bcryptRounds)
  const user = await User.createUser({ name, email, passwordHash })
  if (!user) throw new HttpError(500, 'Unable to create user')

  return response.status(201).json({ user, token: createToken(user) })
}

export async function login(request, response) {
  const { email, password } = request.body
  const userRecord = await User.findByEmail(email)
  const passwordMatches = userRecord && await bcrypt.compare(password, userRecord.passwordHash)
  if (!passwordMatches) throw new HttpError(401, 'Email or password is incorrect')

  const { passwordHash, ...user } = userRecord
  return response.json({ user, token: createToken(user) })
}

export async function getProfile(request, response) {
  const user = await User.findPublicById(request.user.id)
  if (!user) throw new HttpError(404, 'User not found')
  return response.json({ user })
}

export async function updateProfile(request, response) {
  const user = await User.updateProfile(request.user.id, request.body)
  if (!user) throw new HttpError(404, 'User not found')
  return response.json({ user })
}
