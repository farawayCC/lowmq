import fs from "fs"
import { join } from "path"
import config, { rootPath } from "../config.js"


export const checkDefaults = () => {
    // Check if tokens file exists
    const pathToTokensFile = join(rootPath, 'resources', 'tokens')
    if (!fs.existsSync(pathToTokensFile))
        fs.writeFileSync(pathToTokensFile, config.defaultPassword, 'utf-8')
    // Warn if default password is still in use
    else if (fs.readFileSync(pathToTokensFile, 'utf-8').includes(config.defaultPassword))
        console.warn('Default password is still in use. Please change it in resources/tokens')

    // Check if db file exists
    const emptyDB = '{}'
    if (!fs.existsSync(config.dbFilePath))
        fs.writeFileSync(config.dbFilePath, emptyDB, 'utf-8')
}
