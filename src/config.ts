import path from 'path'
import * as url from "url";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));


export const rootPath = path.join(__dirname, '../')

export type Message = {
    _id: string,
    key: string,
    value: string
    frozenTo: Date,
    freezeTimeMin: number
}

const config = {
    dbFilePath: path.join(rootPath, 'resources', 'db.json'),
    messageFreezeTimeMinutes: 5,
    defaultPassword: 'woof'
}

export default config
