'use strict';

import { dateUtils } from './common.utils.js';

class RegisterPreviewUtils {
    getFirstWeekDay(term = '', available = {}) {
        for (let key in available) {
            if (key == term) {
                return available[`${key}`].firstWeekDay;
            }
        }
        return dateUtils.dateToDash(new Date());
    }
}
export const registerPreviewUtils = new RegisterPreviewUtils();
