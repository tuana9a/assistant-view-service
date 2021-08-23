'use strict';

import { dateUtils, utils } from './common.utils.js';

class RegisterPreviewUtils {
    extractClassIdsFromString(value = '') {
        let result = value
            .split(/\s*,\s*|\s+/)
            .map((e) => e.replace(/[\D]+/g, ''))
            .filter((e) => e != '')
            .map((e) => utils.fromAnyToNumber(e));
        return result;
    }
    getFirstWeekDay(term = '', available = {}) {
        for (let key in available) {
            if (key == term) {
                return available[key].firstWeekDay;
            }
        }
        return dateUtils.dateToDash(new Date());
    }
    timeFormat(h, m, s) {
        if (s) {
            return `${h > 9 ? h : '0' + h}:${m > 9 ? m : '0' + m}:${s > 9 ? s : '0' + s}`;
        }
        return `${h > 9 ? h : '0' + h}:${m > 9 ? m : '0' + m}`;
    }
}
export const registerPreviewUtils = new RegisterPreviewUtils();
