import fs from "fs";
import { join } from "path";
import { rootPath } from "../config.js";
import { NextFunction, Request, Response } from "express";


export const validPassword = (req: Request, res: Response, next: NextFunction) => {
    // get password from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).send('No auth header provided');

    const token = authHeader.split(' ').length === 2
        ? authHeader.split(' ')[1]
        : authHeader.split(' ')[0];

    if (!token)
        return res.status(403).send('No token provided')

    // check if password is valid agains the resources/tokens file
    const pathToTokensFile = join(rootPath, 'resources', 'tokens');
    if (!fs.existsSync(pathToTokensFile))
        return res.status(500).send('No tokens file found. Contact admin')

    const tokensFileData = fs.readFileSync(pathToTokensFile, 'utf-8');
    let approvedTokens = tokensFileData.split('\n');
    approvedTokens = approvedTokens.filter((h) => h !== '');
    const isValid = approvedTokens.includes(token);
    if (!isValid)
        return res.status(403).send('Invalid token provided')

    next()
}
