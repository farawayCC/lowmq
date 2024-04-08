import path from 'path'
import * as url from "url"
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))


// Note: for tests we build the project using tsc, so the root path is different (./dist/), while for the app itself it's the same as __dirname (./lowmq.js)
const isForTest = path.join(__dirname).includes('dist')
export const rootPath = isForTest
    ? path.join(__dirname, '..')
    : path.join(__dirname)

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
    defaultPassword: 'woof',
}

export default config
