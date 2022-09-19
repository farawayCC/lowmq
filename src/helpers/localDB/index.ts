// const lowdb = import('lowdb')
import lowdb, { JSONFile, Low } from 'lowdb'
import config, { Message, rootPath } from '../../config.js';


export type DB = {
    read: () => Promise<void>
    write: () => Promise<void>
    data: Data
}

// export type PossibleKeys = 'password-change' |
//     'password-change-success' |
//     'password-change-error'

export type Data = {
    messages: {
        [key in
        string
        // PossibleKeys
        ]: Message[]
    };
}

const defaultMessages = {
    'password-change': [],
    'password-change-success': [],
    'password-change-error': [],
}

const initLowDB = async () => {
    const adapter = new JSONFile<Data>(config.dbFilePath)
    const db = new Low(adapter)
    await db.read()
    db.data = db.data || { messages: defaultMessages }
    return db
}

export const clearDB = async (db: DB) => {
    db.data.messages = defaultMessages
    await db.write()
}

export default initLowDB