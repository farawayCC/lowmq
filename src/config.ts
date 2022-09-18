import * as url from "url";
import path from 'path'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));


export const rootPath = path.join(__dirname, '../')
// export const


const config = {
    dbFilePath: path.join(rootPath, 'resources', 'db.json')
}

export default config
