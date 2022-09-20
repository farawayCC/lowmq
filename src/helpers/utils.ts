import fs from "fs";
import { join } from "path";
import config, { rootPath } from "../config.js";


export const checkDefaults = async () => {
    // default passwords
    const pathToKnownHosts = join(rootPath, 'resources', 'known_hosts');
    if (!fs.existsSync(pathToKnownHosts))
        fs.writeFileSync(pathToKnownHosts, config.defaultPassword, 'utf-8');
    else if (fs.readFileSync(pathToKnownHosts, 'utf-8').includes(config.defaultPassword))
        console.warn('Default password is still in use. Please change it in resources/known_hosts');
}
