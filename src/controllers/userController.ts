import { Request, Response } from 'express'
import User, { IUser } from '../models/usuarios/User.model'
import { generateToken } from '../utils/jwt'
import { Types } from 'mongoose'
import { IError } from '../interface/gen'

export const register = async (req: Request, res: Response) => {
  const { username, password, role } = req.body

  try {
    const userExists = await User.findOne({ username })
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const newUser: IUser = new User({ username, password, role })
    await newUser.save()

    const token = generateToken({
      id: newUser._id as Types.ObjectId,
      username: newUser.username,
      role: newUser.role,
    })
    return res.status(201).json({ token })
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Server error', error: (err as IError).message })
  }
}

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body

  try {
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = generateToken({
      id: user._id as Types.ObjectId,
      username: user.username,
      role: user.role,
    })

    return res.json({ token })
    
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Server error', error: (err as IError).message })
  }
}

export const getUserProfile = (req: Request, res: Response) => {
  res.json({ message: 'User profile', user: req.user })
}
