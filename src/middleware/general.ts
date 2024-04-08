import fs from 'fs'
import { join } from 'path'
import { rootPath } from '../config.js'
import { NextFunction, Request, Response } from 'express'
import { sendProblemDetails } from '../helpers/http/problemDetails.js'


export const validPassword = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization
    if (typeof authHeader !== 'string')
        return sendProblemDetails(res, 'missing-authorization-header', 401, 'No auth header provided', 'Expected an Authorization header, got: ' + authHeader)

    const token = authHeader.split(' ').length === 2
        ? authHeader.split(' ')[1]
        : authHeader.split(' ')[0]

    if (!token)
        return sendProblemDetails(res, 'missing-token', 403, 'No token provided', 'Expected a token in the Authorization header, got: ' + authHeader)

    const pathToTokensFile = join(rootPath, 'resources', 'tokens')
    if (!fs.existsSync(pathToTokensFile))
        return sendProblemDetails(res, 'missing-tokens-file', 500, 'No tokens file found', 'Contact admin')

    const tokensFileData = fs.readFileSync(pathToTokensFile, 'utf-8')
    let approvedTokens = tokensFileData.split('\n')
    approvedTokens = approvedTokens.filter((h) => h !== '')
    const isValid = approvedTokens.includes(token)
    if (!isValid)
        return sendProblemDetails(res, 'invalid-token', 403, 'Invalid token provided', 'Token provided is not valid')

    next()
}
