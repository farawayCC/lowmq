// const lowdb = import('lowdb')
import lowdb, { JSONFile, Low } from 'lowdb'
import config, { rootPath } from '../../config.js';


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
        ]: Object[]
    };
}

const defaultMessages = {
    'password-change': [],
    'password-change-success': [],
    'password-change-error': [],
}

const initLowDB = async (): Promise<DB> => {
    const adapter = new JSONFile<Data>(config.dbFilePath)
    //TODO: This is nonsense: assigning to any should not be allowed. Rewrite for prod
    const db: any = new Low(adapter)
    await db.read()

    console.log('LowDB initialized and read')
    if (!db)
        throw new Error('LowDB not initialized')
    if (JSON.stringify(db.data) === '{}')
        db.data = { messages: defaultMessages }
    return db
}

export const clearDB = async (db: DB) => {
    db.data.messages = defaultMessages
    await db.write()
}

export default initLowDB