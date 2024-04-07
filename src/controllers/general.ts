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

export const controllerHtml = async (_: Request, res: Response) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'controller.html')
        let controllerHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8')
        res.send(controllerHTMLContent)
    } catch (error) {
        sendProblemDetails(res, 'file-read-error', 500, 'Error reading controller.html file', error?.message)
    }
}

export const controllerJs = async (_: Request, res: Response) => {
    try {
        const pathToHelpHTMLFile = join(rootPath, 'resources', 'controller.js')
        let helpHTMLContent = await fs.readFile(pathToHelpHTMLFile, 'utf-8')
        res.send(helpHTMLContent)
    } catch (error) {
        sendProblemDetails(res, 'file-read-error', 500, 'Error reading controller.js file', error?.message)
    }
}
