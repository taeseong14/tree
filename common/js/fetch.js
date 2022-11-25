const F = class {
    /**
     * make new Fetch class
     * @param {string} url 
     * @param {*} [headers] 
     */
    constructor(url, headers = {}) {
        this.url = url;
        this.headers = headers;
    }

    /**
     * @returns {Promise<object | string>}
     */
    async get() {
        const text = await fetch(this.url, {
            headers: this.headers,
        }).then(res => res.text());
        try {
            return JSON.parse(text);
        } catch (e) {
            return text;
        }
    }


    /**
     * post a request
     * @param {object} data json data
     * @returns {Promise<object | text>}
     */
    async post(data) {
        const text = await fetch(this.url, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                ...this.headers,
            },
            body: JSON.stringify(data),
        }).then(res => res.text());
        try {
            return JSON.parse(text);
        } catch (e) {
            return text;
        }
    }
}