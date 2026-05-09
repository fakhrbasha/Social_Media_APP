
import jwt, { JwtPayload, Secret, SignOptions, VerifyOptions } from 'jsonwebtoken'
const expireDate = '1h'




class TokenService {
    constructor() { }



    generateToken = ({ payload, secretKey, options = {} }: { payload: Object, secretKey: Secret, options?: SignOptions }): string => {
        return jwt.sign(payload, secretKey, { expiresIn: expireDate, ...options })
    }

    verifyToken = ({ token, secretKey, options = {} }: { token: string, secretKey: Secret, options?: VerifyOptions }): JwtPayload => {
        return jwt.verify(token, secretKey, options) as JwtPayload
    }
}

export default new TokenService()