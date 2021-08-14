'user strict';

//SECTION: request
class HttpClientService {
    async ajax(option = { method: '', url: '', headers: {}, body: {} }, doneHandler = (data) => data, errorHandler = () => {}) {
        let promise = new Promise((resolve, reject) => {
            try {
                let xhttp = new XMLHttpRequest();

                xhttp.onreadystatechange = function (e) {
                    if (String(this.status).match(/^(4\d\d|5\d\d)$/)) {
                        reject(e);
                    }
                };
                xhttp.onload = function (e) {
                    let data = xhttp.response;
                    try {
                        data = JSON.parse(data);
                    } catch (e) {}
                    resolve(data);
                };
                xhttp.onerror = reject;
                xhttp.ontimeout = reject;

                xhttp.open(option.method, option.url);
                xhttp.setRequestHeader('accept', '*/*');
                xhttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

                for (const header in option.headers) {
                    xhttp.setRequestHeader(header, option.headers[`${header}`]);
                }

                xhttp.send(JSON.stringify(option.body));
            } catch (e) {
                reject(e);
            }
        });
        promise.then(doneHandler).catch(errorHandler);
        return promise;
    }
    async uploadFile(option = { url: '', headers: [{ name: '', value: '' }] }, file, done = () => {}) {
        let data = new FormData();
        data.append('file', file);

        let xhttp = new XMLHttpRequest();

        xhttp.addEventListener('load', function (e) {
            let object;
            try {
                object = JSON.parse(xhttp.response);
            } catch (e) {
                object = { success: false, body: 'Parse JSON failed' };
            }
            done(object);
        });
        if (option.headers != undefined) {
            for (const header of option.headers) {
                xhttp.setRequestHeader(header.name, header.value);
            }
        }

        xhttp.open('POST', option.url);
        xhttp.send(data);
    }
    async ajax_WithPattern(pattern, params) {
        let promise;
        let method = pattern['method'];
        let url = pattern['mapping'];

        switch (method) {
            case 'GET':
            case 'DELETE':
                let queryString = httpRequestUtils.createQueryStringParallel(pattern['params'], params);
                promise = this.ajax({ method: method, url: url + '?' + queryString });
                break;

            case 'POST':
            case 'PUT':
                let bodyJson = httpRequestUtils.createBodyJsonParallel(pattern['params'], params);
                promise = this.ajax({ method: method, url: url, body: bodyJson });
                break;
        }

        return promise;
    }
}
export const httpClientService = new HttpClientService();

class HttpRequestUtils {
    createQueryStringArray(pairs = [{ key: '', value: '' }]) {
        let result = '';
        pairs.forEach((pair) => {
            result += pair.key + '=' + pair.value + '&';
        });
        return result.slice(0, -1);
    }
    createQueryStringParallel(keys = [], values = []) {
        let result = '';
        let length = values.length;
        for (let i = 0; i < length; i++) {
            result += keys[i] + '=' + values[i] + '&';
        }
        return result.slice(0, -1);
    }
    createBodyJsonArray(pairs = [{ key: '', value: '' }]) {
        let result = {};
        pairs.forEach((pair) => {
            result[`${pair.key}`] = pair.value;
        });
        return result;
    }
    createBodyJsonParallel(keys = [], values = []) {
        let result = {};
        let length = values.length;
        for (let i = 0; i < length; i++) {
            result[`${keys[i]}`] = values[i];
        }
        return result;
    }
}
export const httpRequestUtils = new HttpRequestUtils();

//SECTION: local storage
class LocalStorageService {
    set(prefix = '', name = '', data) {
        if (typeof data == 'object') data = JSON.stringify(data);
        localStorage.setItem(prefix + '-' + name, data);
    }
    get(prefix = '', name = '') {
        let data = localStorage.getItem(prefix + '-' + name);
        try {
            data = JSON.parse(data);
        } catch (e) {}
        return data;
    }
}
export const localStorageService = new LocalStorageService();
