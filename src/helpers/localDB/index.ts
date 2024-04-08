// const lowdb = import('lowdb')
import { JSONFileSync, LowSync } from 'lowdb'
import config, { Message } from '../../config.js'


export type DB = {
    read: () => void
    write: () => void
    data: Data
}

export type Data = {
    messages: {
        [key in string]: Message[] | undefined
    }
}

const initLowDB = (): DB => {
    const adapter = new JSONFileSync<Data>(config.dbFilePath)
    const db = new LowSync(adapter)
    db.read()

    if (!db.data
        || typeof db.data !== 'object'
        || typeof db.data.messages !== 'object')
        db.data = { messages: {} }
    // We checked that db.data is not null
    return db as DB
}

export const clearDB = (db: DB) => {
    if (db.data)
        db.data.messages = {}
    db.write()
}


export default class LowDB {
    private static instance: LowDB
    private db: DB

    private constructor() {
        this.db = initLowDB()
    }

    // Returns valid db with .data and .messages
    public static getDB(): DB {
        if (!LowDB.instance)
            LowDB.instance = new LowDB()

        return LowDB.instance.db
    }
}