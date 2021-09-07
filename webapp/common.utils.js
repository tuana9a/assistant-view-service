"user strict";

const NUM_OF_DAYWEEK = 7;

//SECTION: support method
class Utils {
    getCookie(name) {
        let pattern = name + "=";
        let cookies = document.cookie.split(";");
        for (let i = 0, length = cookies.length; i < length; i++) {
            let cookie = cookies[i];
            cookie = cookie.trim();
            if (cookie.indexOf(pattern) == 0) {
                return cookie.substring(pattern.length, cookie.length);
            }
        }
        return "";
    }
    getQueryValueFromUrl(name, url = window.location.href) {
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return "";
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    existInArray(value, array = []) {
        for (const e of array) {
            if (e == value) return true;
        }
        return false;
    }
    fromAnyToNumber(input = {}) {
        let value = parseInt(input);
        return value ? value : 0;
    }
}
export const utils = new Utils();

//SECTION: timing
class DateUtils {
    dateToDash(input = new Date()) {
        let day = input.getDate();
        let month = input.getMonth() + 1; //EXPLAIN: range: 0-11
        let year = input.getFullYear();
        return (day < 10 ? "0" : "") + day + "/" + (month < 10 ? "0" : "") + month + "/" + year;
    }
    fromStringToDate_VN(input = "") {
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
        if (miliseconds < 1000) return miliseconds + "ms ago";
        let seconds = miliseconds / 1000.0;
        if (seconds < 60) return Math.round(seconds) + "s ago";
        let minutes = seconds / 60.0;
        if (minutes < 60) return Math.round(minutes) + "m ago";
        let hours = minutes / 60.0;
        if (hours < 24) return Math.round(hours) + "h ago";
        let days = hours / 24.0;
        return Math.round(days) + "d ago";
    }
    //CAUTION: nếu lệch mất một tuần thì vào đây mà sửa
    weeksFromStartDay(dash = "", firstWeekDay = "") {
        // console.log(dash, firstWeekDay);
        let date1 = this.fromStringToDate_VN(dash);
        let date2 = this.fromStringToDate_VN(firstWeekDay);
        let weeks = this.daysBetween(date1, date2) / 7;
        // console.log(weeks);
        return Math.floor(weeks) + 1;
        //EXPLAIN: đéo biết giải thích thế nào cái cộng 1, thời gian mệt vlòn
    }
    calcCurrentWeek(firstWeekDay = "") {
        let start = dateUtils.fromStringToDate_VN(firstWeekDay);
        let weeks = Math.floor(dateUtils.daysBetween(start, new Date()) / NUM_OF_DAYWEEK);
        return weeks + 1; //EXPLAIN: vd chia đc 0.5 thì là tuần 1, chia đc 1.2 là tuần 2
    }
}
export const dateUtils = new DateUtils();

class RandomUtils {
    color_hex(r = { s: 0, e: 255 }, g = { s: 0, e: 255 }, b = { s: 0, e: 255 }) {
        let _r = Math.floor(r.s + Math.random() * (r.e - r.s));
        let _g = Math.floor(g.s + Math.random() * (g.e - g.s));
        let _b = Math.floor(b.s + Math.random() * (b.e - b.s));
        _r = _r > 15 ? _r.toString(16) : "0" + _r.toString(16);
        _g = _g > 15 ? _g.toString(16) : "0" + _g.toString(16);
        _b = _b > 15 ? _b.toString(16) : "0" + _b.toString(16);
        return `#${_r + _g + _b}`; //hexa
    }
    color_rgb(r = { start: 0, end: 255 }, g = { start: 0, end: 255 }, b = { start: 0, end: 255 }) {
        let _r = Math.floor(r.start + Math.random() * (r.end - r.start));
        let _g = Math.floor(g.start + Math.random() * (g.end - g.start));
        let _b = Math.floor(b.start + Math.random() * (b.end - b.start));
        return `rgb(${_r},${_g},${_b}`;
    }
}
export const randomUtils = new RandomUtils();
