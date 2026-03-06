import { Types } from 'mongoose'
import { IUser, IPayloadToken } from '../@types/models.type'
import { IAuthRepository } from '@repositories/interfaces/auth.repository.interface'
import { IUserRepository } from '@repositories/interfaces/user.repository.interface'
import { BaseService, ValidationError, UnauthorizedError, ConflictError } from './base.service'
import { hashValue, compareValue } from '@utils/crypt'
import { signToken } from '@utils/jwt'
import { config } from '@constants/config'
import { ROLE } from '@constants/role.enum'
import { omit } from 'lodash'

export interface RegisterDTO {
  email: string
  password: string
}

export interface LoginDTO {
  email: string
  password: string
}

export interface TokenConfig {
  expireAccessToken: number
  expireRefreshToken: number
}

export interface AuthResult {
  access_token: string
  expires: number
  refresh_token: string
  expires_refresh_token: number
  user: Omit<IUser, 'password'>
}

export class AuthService extends BaseService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly userRepository: IUserRepository
  ) {
    super()
  }

  private async generateTokens(
    payload: IPayloadToken,
    tokenConfig: TokenConfig
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      signToken(payload, config.SECRET_KEY, tokenConfig.expireAccessToken),
      signToken(payload, config.SECRET_KEY, tokenConfig.expireRefreshToken),
    ])
    return { accessToken: accessToken as string, refreshToken: refreshToken as string }
  }

  async register(data: RegisterDTO, tokenConfig: TokenConfig): Promise<AuthResult> {
    const emailExists = await this.userRepository.emailExists(data.email)
    if (emailExists) {
      throw new ConflictError('Email đã tồn tại')
    }

    const hashedPassword = hashValue(data.password)
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      roles: [ROLE.USER],
    })

    const payload: IPayloadToken = {
      id: user._id!.toString(),
      email: user.email,
      roles: user.roles || [ROLE.USER],
      created_at: new Date().toISOString(),
    }

    const { accessToken, refreshToken } = await this.generateTokens(payload, tokenConfig)

    await Promise.all([
      this.authRepository.createAccessToken(user._id!, accessToken),
      this.authRepository.createRefreshToken(user._id!, refreshToken),
    ])

    return {
      access_token: 'Bearer ' + accessToken,
      expires: tokenConfig.expireAccessToken,
      refresh_token: refreshToken,
      expires_refresh_token: tokenConfig.expireRefreshToken,
      user: omit(user, ['password']) as Omit<IUser, 'password'>,
    }
  }

  async login(data: LoginDTO, tokenConfig: TokenConfig): Promise<AuthResult> {
    const user = await this.userRepository.findByEmailWithPassword(data.email)
    if (!user) {
      throw new ValidationError('Email hoặc password không đúng', 'password')
    }

    const isPasswordValid = compareValue(data.password, user.password)
    if (!isPasswordValid) {
      throw new ValidationError('Email hoặc password không đúng', 'password')
    }

    const payload: IPayloadToken = {
      id: user._id!.toString(),
      email: user.email,
      roles: user.roles || [ROLE.USER],
      created_at: new Date().toISOString(),
    }

    const { accessToken, refreshToken } = await this.generateTokens(payload, tokenConfig)

    await Promise.all([
      this.authRepository.createAccessToken(user._id!, accessToken),
      this.authRepository.createRefreshToken(user._id!, refreshToken),
    ])

    return {
      access_token: 'Bearer ' + accessToken,
      expires: tokenConfig.expireAccessToken,
      refresh_token: refreshToken,
      expires_refresh_token: tokenConfig.expireRefreshToken,
      user: omit(user, ['password']) as Omit<IUser, 'password'>,
    }
  }

  async refreshToken(userId: string, expireAccessToken: number): Promise<{ access_token: string }> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new UnauthorizedError('Refresh token không tồn tại')
    }

    const payload: IPayloadToken = {
      id: user._id!.toString(),
      email: user.email,
      roles: user.roles || [ROLE.USER],
      created_at: new Date().toISOString(),
    }

    const accessToken = await signToken(payload, config.SECRET_KEY, expireAccessToken) as string
    await this.authRepository.createAccessToken(user._id!, accessToken)

    return { access_token: 'Bearer ' + accessToken }
  }

  async logout(accessToken: string): Promise<void> {
    await this.authRepository.deleteAccessToken(accessToken)
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepository.deleteAllUserTokens(userId)
  }

  async validateAccessToken(token: string): Promise<boolean> {
    return this.authRepository.isAccessTokenValid(token)
  }

  async validateRefreshToken(token: string): Promise<boolean> {
    return this.authRepository.isRefreshTokenValid(token)
  }
}

