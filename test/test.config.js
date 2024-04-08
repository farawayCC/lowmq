import fs from 'fs'
import path from 'path'
import * as url from "url"

const __dirname = url.fileURLToPath(new url.URL('.', import.meta.url))
const rootPath = path.join(__dirname, '..')


export const defaultAuthValue = 'Basic woof'

export const pathToDB = path.join(rootPath, 'resources', 'db.json')

export const clearDB = () => {
    const defaultDbContent = { messages: {} }
    fs.unlinkSync(pathToDB)
    fs.writeFileSync(pathToDB, JSON.stringify(defaultDbContent))
}
