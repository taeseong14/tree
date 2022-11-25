const sqlite = require('sqlite3').verbose();

/**
 * @typedef user
 * @property {string} id
 * @property {string} hash sha256 - hex `${id}-${pw}`
 * @property {string} name
 * @property {letter[]} sent
 * @property {letter[]} got
 */
/**
 * @typedef letter
 * @property {string} id user id; sent
 * @property {string} title
 * @property {string} content
 * @property {string} img bell-red, ... -> `/tree/img/${img}.png`
 * @property {number} createdAt Date.now() / 1000 |0
 */

class DB extends sqlite.Database {

    /**
     * @param {string} path db path
     */
    constructor(path) {
        super(path);

        this.RUN(`CREATE TABLE IF NOT EXISTS User(
            id   TEXT PRIMARY KEY,
            hash TEXT UNIQUE,
            name TEXT NOT NULL,
            sent TEXT DEFAULT '[]',
            got  TEXT DEFAULT '[]'
        )`);
    }


    /**
     * 
     * @param {string} SQL sql statement
     * @param {*} [query] run query
     * @returns {Promise<void>}
     */
    RUN(SQL, query) {
        return new Promise((res, rej) => {
            this.get(SQL, query, err => {
                err ? rej(err) : res();
            });
        });
    }

    /**
     * Get user format
     * @param {string} SQL sql statement
     * @param {*} [query] select query
     * @returns {Promise<user | null>}
     */
    GET(SQL, query) {
        return new Promise((res, rej) => {
            this.get(SQL, query, (err, row) => {
                err ? rej(err) : res(row);
            });
        });
    }

    /**
     * 
     * @param {string} SQL sql statement
     * @param {*} [query] select query
     * @returns {Promise<any[]>}
     */
    ALL(SQL, query) {
        return new Promise((res, rej) => {
            this.all(SQL, query, (err, rows) => {
                err ? rej(err) : res(rows);
            });
        });
    }


    /**
     * Add an user
     * @param {string} id 
     * @param {string} hash 
     * @param {string} name 
     */
    register(id, hash, name) {
        return this.RUN(`INSERT INTO User(id, hash, name) VALUES (?, ?, ?)`, [id, hash, name]);
    }

    /**
     * Get an user by user id
     * @param {string} id userId
     */
    async getById(id) {
        const user = await this.GET(`SELECT * FROM User WHERE id = ?`, id);
        if (!user) return user;
        user.sent = JSON.parse(user.sent);
        user.got = JSON.parse(user.got);
        return user;
    }

    /**
     * Get an user by user hash
     * @param {string} hash user hash
     */
    async getByHash(hash) {
        const user = await this.GET(`SELECT * FROM User WHERE hash = ?`, hash);
        if (!user) return user;
        user.sent = JSON.parse(user.sent);
        user.got = JSON.parse(user.got);
        return user;
    }

    /**
     * change user name by user hash
     * @param {string} hash user hash
     * @param {string} name new name
     */
    changeNameByHash(hash, name) {
        return this.RUN(`UPDATE User SET name = ? WHERE hash = ?`, [name, hash]);
    }

    /**
     * change letter by id
     * @param {string} id userId
     * @param {letter[]} sent 
     * @param {letter[]} got 
     */
    changeLetterById(id, sent, got) {
        return this.RUN(`UPDATE User SET sent = ?, got = ? WHERE id =?`, [JSON.stringify(sent), JSON.stringify(got), id]);
    }
}


const db = new DB(__dirname + '/database.db');

module.exports = db;
