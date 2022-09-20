import fs from "fs";
import { join } from "path";
import { rootPath } from "../config.js";
import { NextFunction, Request, Response } from "express";


export const validPassword = (req: Request, res: Response, next: NextFunction) => {
    // get password from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).send('No auth header provided');
    if (authHeader.split(' ').length !== 2)
        return res.status(403).send('Invalid auth header provided');

    const password = authHeader.split(' ')[1];
    if (!password)
        return res.status(403).send('No password provided')

    // check if password is valid agains the resources/known_hosts file
    const pathToKnownHosts = join(rootPath, 'resources', 'known_hosts');
    if (!fs.existsSync(pathToKnownHosts))
        return res.status(500).send('No known_hosts file found. Contact admin')

    const knownHosts = fs.readFileSync(pathToKnownHosts, 'utf-8');
    let possibleHosts = knownHosts.split('\n');
    possibleHosts = possibleHosts.filter((h) => h !== '');
    const isValid = possibleHosts.includes(password);
    if (!isValid)
        return res.status(403).send('Invalid password provided')

    next()
}
