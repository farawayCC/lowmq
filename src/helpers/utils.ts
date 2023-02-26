import fs from "fs";
import { join } from "path";
import config, { rootPath } from "../config.js";


export const checkDefaults = () => {
    // default tokens
    const pathToTokensFile = join(rootPath, 'resources', 'tokens'); pathToTokensFile
    if (!fs.existsSync(pathToTokensFile))
        fs.writeFileSync(pathToTokensFile, config.defaultPassword, 'utf-8');
    else if (fs.readFileSync(pathToTokensFile, 'utf-8').includes(config.defaultPassword))
        console.warn('Default password is still in use. Please change it in resources/tokens');
}
