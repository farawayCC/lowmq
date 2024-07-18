import { Request, Response } from 'express'
import config, { rootPath } from '../config.js'
import { join } from 'path'
import fs from 'fs/promises'
import { sendProblemDetails } from '../helpers/http/problemDetails.js'

export const helpInfo = async (_: Request, res: Response) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'help.html')
        let helpHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8')
        helpHTMLContent = helpHTMLContent.replace(/'Authorization: token woof'/g,
            `Authorization: token ${config.defaultPassword}`)
        res.send(helpHTMLContent)
    } catch (error) {
        sendProblemDetails(res, 'file-read-error', 500, 'Error reading help.html file', error?.message)
    }
}

export const version = async (_: Request, res: Response) => {
    try {
        const packageFile = await fs.readFile(join(rootPath, 'package.json'), 'utf-8')
        const packageJson = JSON.parse(packageFile)
        res.json(packageJson.version)
    } catch (error) {
        sendProblemDetails(res, 'file-read-error', 500, 'Error reading package.json file', error?.message)
    }
}

export const controllerHtml = async (_: Request, res: Response) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'controller.html')
        const controllerHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8')
        res.send(controllerHTMLContent)
    } catch (error) {
        sendProblemDetails(res, 'file-read-error', 500, 'Error reading controller.html file', error?.message)
    }
}

export const controllerJs = async (_: Request, res: Response) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'controller.js')
        const helpHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8')
        res.send(helpHTMLContent)
    } catch (error) {
        sendProblemDetails(res, 'file-read-error', 500, 'Error reading controller.js file', error?.message)
    }
}
