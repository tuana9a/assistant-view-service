'user strict';

const NUM_OF_DAYWEEK = 7;

//SECTION: support method
class Utils {
    getCookie(name) {
        let pattern = name + '=';
        let cookies = document.cookie.split(';');
        for (let i = 0, length = cookies.length; i < length; i++) {
            let cookie = cookies[i];
            cookie = cookie.trim();
            if (cookie.indexOf(pattern) == 0) {
                return cookie.substring(pattern.length, cookie.length);
            }
        }
        return '';
    }
    existInArray(value, array = []) {
        for (const e of array) {
            if (e == value) return true;
        }
        return false;
    }
}
export const utils = new Utils();

//SECTION: timing
class DateUtils {
    dateToDash(input = new Date()) {
        let day = input.getDate();
        let month = input.getMonth() + 1; //EXPLAIN: range: 0-11
        let year = input.getFullYear();
        return (day < 10 ? '0' : '') + day + '/' + (month < 10 ? '0' : '') + month + '/' + year;
    }
    fromStringToDate_VN(input = '') {
        if (!input.match(/^\d{1,2}(\/|-|\.)\d{1,2}(\/|-|\.)\d+$/)) return new Date();
        try {
            let parts = input.split(/(\/|-|\.)/).filter((e) => !e.match(/^(\/|-|\.)$/));
            let day = parts[0],
                month = parts[1],
                year = parts[2];
            return new Date(`${month}/${day}/${year}`);
        } catch (e) {
            return new Date();
        }
    }
    toDayWeek_VN(input = 0) {
        switch (input) {
            case 0:
                return 8;
            default:
                return input + 1;
        }
    }
    daysBetween(date1 = new Date(), date2 = new Date()) {
        let delta = date1.getTime() - date2.getTime();
        // console.log(delta);
        return Math.abs(delta) / 86_400_000;
    }
    timeBetween_String(date1 = new Date(), date2 = new Date()) {
        let miliseconds = date2.getTime() - date1.getTime();
        if (miliseconds < 1000) return miliseconds + 'ms ago';
        let seconds = miliseconds / 1000.0;
        if (seconds < 60) return Math.round(seconds) + 's ago';
        let minutes = seconds / 60.0;
        if (minutes < 60) return Math.round(minutes) + 'm ago';
        let hours = minutes / 60.0;
        if (hours < 24) return Math.round(hours) + 'h ago';
        let days = hours / 24.0;
        return Math.round(days) + 'd ago';
    }
    //CAUTION: nếu lệch mất một tuần thì vào đây mà sửa
    weeksFromStartDay(dash = '', firstWeekDay = '') {
        // console.log(dash, firstWeekDay);
        let date1 = this.fromStringToDate_VN(dash);
        let date2 = this.fromStringToDate_VN(firstWeekDay);
        let weeks = this.daysBetween(date1, date2) / 7;
        // console.log(weeks);
        return Math.floor(weeks) + 1;
        //EXPLAIN: đéo biết giải thích thế nào cái cộng 1, thời gian mệt vlòn
    }
    calcCurrentWeek(firstWeekDay = '') {
        let start = dateUtils.fromStringToDate_VN(firstWeekDay);
        let weeks = Math.floor(dateUtils.daysBetween(start, new Date()) / NUM_OF_DAYWEEK);
        return weeks + 1; //EXPLAIN: vd chia đc 0.5 thì là tuần 1, chia đc 1.2 là tuần 2
    }
}
export const dateUtils = new DateUtils();

//SECTION: request
export class HttpRequestOption {
    method = '';
    url = '';
    headers = {};
    body = {};
}
class HttpClientService {
    async ajax(option = new HttpRequestOption(), doneHandler = () => {}, errorHandler = () => {}) {
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
