class DateTimeUtils {
    getDate(date: Date = new Date()) {
        let y = date.getFullYear();
        let m = date.getMonth() + 1; //0 -> 11
        let d = date.getDate();
        return `${y}-${m > 9 ? m : "0" + m}-${d > 9 ? d : "0" + d}`;
    }
    getTime(date: Date = new Date()) {
        let h = date.getHours();
        let m = date.getMinutes();
        let s = date.getSeconds();
        return `${h > 9 ? h : "0" + h}:${m > 9 ? m : "0" + m}:${s > 9 ? s : "0" + s}`;
    }
    getFull(date: Date = new Date()) {
        return this.getDate(date) + " " + this.getTime(date);
    }
}

export const dateTimeUtils = new DateTimeUtils();
