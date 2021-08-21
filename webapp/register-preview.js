'use strict';

import { AppConfig } from './app.js';
import { httpClientService } from './common.js';
import { utils } from './common.utils.js';
import { registerPreviewUtils } from './register-preview.utils.js';

// const TABLE_ROW_HEIGHT = 25;
const TABLE_ROW_HEIGHT = 30;

const NUM_OF_HOUR = 24;
const NUM_OF_DAYWEEK = 7;

//EXPLAIN: mảng lữu dữ liệu class hiện tại
var TIMETABLE_DATA_PREVIEWING_CLASSES = [];
//EXPLAIN: tiện cho render, check trùng thời gian
var TIMETABLE_DATA_DAY_WEEK_CLASSES = [[], [], [], [], [], [], []];
//EXPLAIN: mảng lưu các div thứ trong tuần
var TIMETABLE_DATA_DAY_WEEK_ELEMENTS = [];
//EXPLAIN: mảng lưu hourOfDay
var TIMETABLE_DATA_DAY_WEEK_ELEMENTS_WITH_HOUR_OF_DAYS = [[], [], [], [], [], [], []];

const classIdsTag = document.getElementById('classIds');
const guessClassIdsTag = document.getElementById('guessIds');

const termPreviewTag = document.getElementById('termPreview');
const weekPreviewTag = document.getElementById('weekPreview');

const renderTableTag = document.getElementById('renderTable');
const inputSearchClassTag = document.getElementById('inputSearchClass');

const pageMessagesContentTag = document.getElementById('pageMessagesContent');
const openPageMessagesTag = document.getElementById('openPageMessages');
const closePageMessagesTag = document.getElementById('closePageMessages');

var VERSION = 'v2020.07';

class LopDangKy {
    ma_lop = -1;
    ma_lop_kem = -1;
    loai_lop = '';
    ma_hoc_phan = '';
    ten_hoc_phan = '';

    buoi_hoc_so = -1;
    thu_hoc = '';
    thoi_gian_hoc = '';
    phong_hoc = '';
    tuan_hoc = '';
    ghi_chu = '';

    _timestamp = -1; // meta data

    // addition field
    div;
    time = { start_h: 0, start_m: 0, stop_h: 0, stop_m: 0 };
}

class HiddenUtils {
    execute_order(number) {
        let autoRegisterTag = document.getElementById('auto-register');
        let inputMssvTag = document.getElementById('inputMssv');
        let inputPasswordTag = document.getElementById('inputPassword');

        switch (number) {
            case 66:
                autoRegisterTag.classList.toggle('hidden');
                break;

            case 69:
                autoRegisterTag.classList.add('hidden');

                let username = inputMssvTag.value;
                let password = inputPasswordTag.value;

                let beginDate = document.querySelector('#inputDate').value;
                let beginTime = document.querySelector('#inputTime').value;
                let begin = new Date(beginDate + ' ' + beginTime).getTime();

                let classIds = userInputManager.getClassIds();
                let data = { username, password, classIds, begin, type: 'dk-sis' };
                data = JSON.stringify(data, null, '  ');
                let html = `
                    <h3 class="messageType">Secret</h3>
                    <div class="messageContent">
                        <div class=""><b class="redText">value</b></div>
                        <div class=""><span style="cursor: pointer; word-wrap: break-word;">${data}</span></div>
                    </div>
                `;
                pageMessageUtils.addMessageWithListener(html, {
                    event: 'click',
                    listener: function (e) {
                        this.remove();
                        navigator.clipboard.writeText(data).then(
                            function () {
                                console.log('Async: Copied to clipboard!');
                            },
                            function (err) {
                                console.error('Async: Could not copy: ', err);
                            }
                        );
                        pageMessageUtils.updateNumberMessages();
                    }
                });
                break;
        }
    }
}
const hiddenUtils = new HiddenUtils();

class InputSearchClassUtils {
    getValue() {
        return inputSearchClassTag.value;
    }
    setValue(value = '') {
        inputSearchClassTag.value = value;
    }
    clearValue() {
        inputSearchClassTag.value = '';
    }
}
const inputSearchClassUtils = new InputSearchClassUtils();

/**
 * quản lí việc input của người dùng
 */
class UserInputManager {
    getClassIds() {
        return Array.from(classIdsTag.querySelectorAll('.input')).map((e) => e.textContent.trim());
    }
}
const userInputManager = new UserInputManager();

/**
 * quản lí các thư liên quan tới tuần
 */
class WeekPreviewUtils {
    setValue(value = -1) {
        value = parseInt(value) || 0;
        weekPreviewTag.value = value;
    }
    getValue() {
        let value = parseInt(weekPreviewTag.value) || 0;
        return value;
    }
}
const weekPreviewUtils = new WeekPreviewUtils();

/**
 * quản lí các thứ liên quan tới kỳ học
 */
class TermPreviewUtils {
    getValue() {
        return termPreviewTag.value;
    }
    setValue(value = '') {
        termPreviewTag.value = value || '';
    }
}
const termPreviewUtils = new TermPreviewUtils();

class PageMessageUtils {
    clearNotificationQueue() {
        let messageQueueTag = document.getElementById('messageQueue');
        messageQueueTag.innerHTML = '';
    }
    updateNumberMessages() {
        let messageQueueTag = document.getElementById('messageQueue');

        let openPageMessages = document.getElementById('openPageMessages');
        let numberMessagesTag = document.getElementById('numberOfMessages');

        let messages = messageQueueTag.querySelectorAll('.message');
        numberMessagesTag.innerHTML = `<span class="centerText">${messages.length}</span>`;

        if (messages.length == 0) {
            numberMessagesTag.style.display = 'none';
            openPageMessages.classList.add('noMessage');
            openPageMessages.classList.remove('hasMessage');
        } else {
            numberMessagesTag.style.display = null;
            openPageMessages.classList.add('hasMessage');
            openPageMessages.classList.remove('noMessage');
        }
    }
    addMessageWithListener(html = '', option = { event: '', listener: () => {} }) {
        let messageQueueTag = document.getElementById('messageQueue');

        let div = document.createElement('div');
        div.classList.add('message', 'section');
        div.innerHTML = `${html}`;
        messageQueueTag.appendChild(div);
        if (option && option.event && option.listener) {
            div.addEventListener(option.event, option.listener);
        }
        pageMessageUtils.updateNumberMessages();
    }
    addNotHaveTimeClass(lopDangKy = new LopDangKy()) {
        let html = `
            <h3 class="messageType">Special Case</h3>
            <div class="messageContent">
                <div class=""><b class="redText">ko thời gian</b></div>
                <div class="">${lopDangKy.ten_hoc_phan}</div>
                <div class="">${lopDangKy.ghi_chu}</div>
            </div>
        `;
        pageMessageUtils.addMessageWithListener(html);
    }
    addOverlapTimeClasses(classes = [new LopDangKy()]) {
        let html = classes.reduce(function (total, lopDangKy) {
            let time = lopDangKy.time;
            let _start = registerPreviewUtils.timeFormat(time.start_h, time.start_m);
            let _stop = registerPreviewUtils.timeFormat(time.stop_h, time.stop_m);
            let _time = _start + '-' + _stop;

            let innerHTML = `
                <div class="section">
                    <div class="">${lopDangKy.ten_hoc_phan}</div>
                    <div class=""><b class="redText">${_time}</b></div>
                    <div class="">${lopDangKy.phong_hoc}</div>
                </div>
            `;

            return total + innerHTML;
        }, '');
        html = `
            <h3 class="messageType">Special Case</h3>
            <div class="messageContent">
                <div class=""><b class="redText">trùng thời gian</b></div>
                <div class="dadFlexCenter">
                    ${html}
                </div>
            </div>
        `;
        pageMessageUtils.addMessageWithListener(html);
    }
}
const pageMessageUtils = new PageMessageUtils();

/**
 * quản lí các element liên quan tới lớp đăng kí
 */
class ClassIdsElementsUtils {
    addClassId(value) {
        function createClassIdDiv(value) {
            let div = document.createElement('div');
            div.classList.add('classId');
            div.innerHTML = `
                <span class="input" role="textbox" contenteditable>${value}</span>
                <span class="remove noSelect"><span>❌</span></span>
            `;
            div.querySelector('.remove').addEventListener('click', (e) => {
                div.remove();
            });
            return div;
        }
        classIdsTag.appendChild(createClassIdDiv(value));
    }
    addGuessId(value) {
        let div = document.createElement('div');
        div.classList.add('classId', 'noSelect');
        div.innerHTML = `<span class="maLop">${value}</span>`;
        div.addEventListener('click', (e) => {
            classIdsElementsUtils.addClassId(div.textContent);
            div.remove();
            if (guessClassIdsTag.querySelectorAll('.classId').length == 0) {
                classIdsElementsUtils.hideGuessIds();
            }
        });
        guessClassIdsTag.appendChild(div);
    }
    cleaClassIds() {
        classIdsTag.innerHTML = '';
    }
    clearGuessIds() {
        guessClassIdsTag.innerHTML = '';
    }
    hideGuessIds() {
        guessClassIdsTag.style.display = 'none';
    }
    showGuessIds() {
        guessClassIdsTag.style.display = null;
    }
}
const classIdsElementsUtils = new ClassIdsElementsUtils();

// time table
class TimeTableUtils {
    hasClassThisWeek(classWeek = '') {
        if (classWeek == null || classWeek == undefined || classWeek == '') return false;

        let subWeeks = classWeek.split(',');
        for (let i = 0; i < subWeeks.length; i++) {
            let week = subWeeks[i];
            let temp = week.split('-');
            switch (temp.length) {
                case 1:
                    if (parseInt(week) == weekPreviewUtils.getValue()) return true;
                    break;
                case 2:
                    let startWeek = parseInt(temp[0]);
                    let endWeek = parseInt(temp[1]);
                    for (let i = startWeek; i <= endWeek; i++) {
                        if (i == weekPreviewUtils.getValue()) return true;
                    }
                    break;
                default:
                    return true;
            }
        }

        return false;
    }
    notHaveClassTime(classWeek = '') {
        return classWeek == '';
    }
    getHourOfDayElement(thu, gio) {
        return TIMETABLE_DATA_DAY_WEEK_ELEMENTS_WITH_HOUR_OF_DAYS[thu - 2][gio];
    }
    scanOverlapTimeClasses() {
        //EXPLAIN: iterate every dayweek
        let classes = [new LopDangKy()];
        for (classes of TIMETABLE_DATA_DAY_WEEK_CLASSES) {
            let overlapHandeledClasses = []; //EXPLAIN: handled class on that day, skip when meet again

            //EXPLAIN: iterate classes on that day
            for (const main_class of classes) {
                if (utils.existInArray(main_class, overlapHandeledClasses)) continue;

                let existOverlap = false;
                let overlapClasses = []; //EXPLAIN: array with all class that same with main
                // use after iterate all to alert to speical queue

                //EXPLAIN: main class compare with other class on that day
                // if overlap then existOverlap = true
                for (const other_class of classes) {
                    if (other_class == main_class) continue;

                    let time_main = main_class.time;
                    let time_other = other_class.time;

                    let start_main = time_main.start_h * 60 + time_main.start_m;
                    let stop_main = time_main.stop_h * 60 + time_main.stop_m;

                    let start_other = time_other.start_h * 60 + time_other.start_m;
                    let stop_other = time_other.stop_h * 60 + time_other.stop_m;

                    let notOverlap = start_main > stop_other || stop_main < start_other;
                    if (notOverlap) continue;

                    existOverlap = true;
                    overlapHandeledClasses.push(other_class);
                    overlapClasses.push(other_class);
                }

                //EXPLAIN: if have overlap add mainClass to handled so skip if meet again
                if (existOverlap) {
                    overlapHandeledClasses.push(main_class);
                    overlapClasses.push(main_class);
                    pageMessageUtils.addOverlapTimeClasses(overlapClasses);
                }
            }
        }
    }
    classTimeFormat(hour = 0, minute = 0) {
        return (hour < 10 ? '0' + hour : hour) + ':' + (minute < 10 ? '0' + minute : minute);
    }
}
const timeTableUtils = new TimeTableUtils();

class TimeTableCleaner {
    //EXPLAIN: giữ mảng chính, clear mảng ngày, clear html div.class
    clearOnlyClassRenders() {
        TIMETABLE_DATA_DAY_WEEK_CLASSES = TIMETABLE_DATA_DAY_WEEK_CLASSES.map(() => []); //EXPLAIN: reset each day of week
        TIMETABLE_DATA_DAY_WEEK_ELEMENTS.forEach((dayOfWeek) =>
            dayOfWeek.querySelectorAll('.classRender').forEach((each) => each.remove())
        );
    }
    clearAllClassDetails() {
        Array.from(document.querySelectorAll('.classDetails')).forEach((each) => each.remove());
    }
}
const timeTableCleaner = new TimeTableCleaner();

// rendering
class TimeTableRenderUtils {
    initTable(dropHours = new Set(), TABLE_ROW_HEIGHT = 23) {
        renderTableTag.innerHTML = ``;

        function createHourIndexColumn(dropHours = new Set()) {
            let column = document.createElement('div');
            column.classList.add('column', 'indexHour');

            column.innerHTML = `<div class="columName" style="height:${
                TABLE_ROW_HEIGHT + 'px'
            }"><span></span></div>`;
            for (let i = 0; i < NUM_OF_HOUR; i++) {
                let hourOfDay = document.createElement('div');
                hourOfDay.classList.add('hourOfDay', `_${i}h`, 'dadFlexCenter');
                hourOfDay.style.height = TABLE_ROW_HEIGHT + 'px';
                hourOfDay.innerHTML = `<span>${i}</span>`;
                if (dropHours.has(i)) hourOfDay.style.display = 'none';
                column.appendChild(hourOfDay);
            }

            return column;
        }
        function createDayWeekColumn(dayweek, dropHours = new Set()) {
            let column = document.createElement('div');
            let classList = column.classList;
            let dayName = '';
            classList.add('column', 'positionRelative', 'dayOfWeek', `_${dayweek}`);

            switch (dayweek) {
                case 2:
                    classList.add('mon');
                    dayName = 'Mon';
                    break;
                case 3:
                    classList.add('tue');
                    dayName = 'Tue';
                    break;
                case 4:
                    classList.add('wed');
                    dayName = 'Wed';
                    break;
                case 5:
                    classList.add('thu');
                    dayName = 'Thu';
                    break;
                case 6:
                    classList.add('fri');
                    dayName = 'Fri';
                    break;
                case 7:
                    classList.add('sat', 'weekend');
                    dayName = 'Sat';
                    break;
                case 8:
                    classList.add('sun', 'weekend');
                    dayName = 'Sun';
                    break;
            }
            column.innerHTML = `<div class="columName dadFlexCenter" style="height:${
                TABLE_ROW_HEIGHT + 'px'
            }"><span>${dayName}</span></div>`;
            for (let i = 0; i < NUM_OF_HOUR; i++) {
                let hourOfDay = document.createElement('div');
                hourOfDay.classList.add('hourOfDay', `_${i}h`);
                if ([0, 1, 2, 3, 4, 5, 20, 21, 22, 23].indexOf(i) != -1) {
                    hourOfDay.classList.add('notWorkHour');
                }
                hourOfDay.style.height = TABLE_ROW_HEIGHT + 'px';
                if (dropHours.has(i)) hourOfDay.style.display = 'none';
                column.appendChild(hourOfDay);
            }
            return column;
        }

        renderTableTag.appendChild(createHourIndexColumn(dropHours)); //EXPLAIN: cột chỉ số thời gian
        [2, 3, 4, 5, 6, 7, 8].forEach((day) =>
            renderTableTag.appendChild(createDayWeekColumn(day, dropHours))
        );

        TIMETABLE_DATA_DAY_WEEK_ELEMENTS = Array.from(
            renderTableTag.querySelectorAll('.dayOfWeek')
        );
        for (let i = 0; i < NUM_OF_DAYWEEK; i++) {
            TIMETABLE_DATA_DAY_WEEK_ELEMENTS_WITH_HOUR_OF_DAYS[i] = Array.from(
                TIMETABLE_DATA_DAY_WEEK_ELEMENTS[i].querySelectorAll('.hourOfDay')
            );
        }

        //EXPLAIN: scroll to working hour
        // let renderContainer = RENDER_TABLE_TAG.parentElement;
        // renderContainer.style.height = 14 * TABLE_ROW_HEIGHT + 'px';
        // renderContainer.scrollTo(0, 6 * TABLE_ROW_HEIGHT);
    }
    renderLopDangKy(lopDangKy = new LopDangKy()) {
        let tuanHoc = lopDangKy.tuan_hoc;
        if (timeTableUtils.notHaveClassTime(tuanHoc)) {
            pageMessageUtils.addNotHaveTimeClass(lopDangKy);
            return;
        } else if (!timeTableUtils.hasClassThisWeek(tuanHoc)) {
            return;
        }

        let thoiGianHoc = lopDangKy.thoi_gian_hoc; //EXPLAIN: VD: 1234-5678 -> 12h34p - 56h78p
        let time = {
            start_h: parseInt(thoiGianHoc.substr(0, 2)),
            start_m: parseInt(thoiGianHoc.substr(2, 3)),
            stop_h: parseInt(thoiGianHoc.substr(5, 2)),
            stop_m: parseInt(thoiGianHoc.substr(7, 2))
        };
        lopDangKy.time = time;

        let hourOfDayElement = timeTableUtils.getHourOfDayElement(lopDangKy.thu_hoc, time.start_h);
        let top = hourOfDayElement.offsetTop + (time.start_m / 60) * TABLE_ROW_HEIGHT;
        let height =
            (time.stop_h - time.start_h + (time.stop_m - time.start_m) / 60) * TABLE_ROW_HEIGHT;

        let _time_start = timeTableUtils.classTimeFormat(time.start_h, time.start_m);
        let _time_stop = timeTableUtils.classTimeFormat(time.stop_h, time.stop_m);

        let newElement = document.createElement('div');
        newElement.classList.add('classRender', 'positionAbsolute');
        newElement.style.top = `${top}px`;
        newElement.style.height = `${height}px`;
        let rgb = `rgb(${255 - Math.random() * 150},${255 - Math.random() * 150},${
            255 - Math.random() * 150
        })`;
        newElement.style.backgroundColor = rgb;
        newElement.innerHTML = `
            <div class="classContainer positionRelative dadFlexCenter">
                <div class="classProps">
                    <div class="classProp">${lopDangKy.ten_hoc_phan} (${lopDangKy.loai_lop})</div>
                    <div class="classProp">${_time_start + ' - ' + _time_stop}</div>
                    <div class="classProp">${lopDangKy.phong_hoc}</div>
                </div>
            </div>
        `;

        // classRenderElement.style.zIndex = 20 - thu_hoc;
        newElement.style.zIndex = 15;
        TIMETABLE_DATA_DAY_WEEK_ELEMENTS[lopDangKy.thu_hoc - 2].appendChild(newElement);
        lopDangKy.div = newElement;
        TIMETABLE_DATA_DAY_WEEK_CLASSES[lopDangKy.thu_hoc - 2].push(lopDangKy);
    }
    renderClasses(classes = []) {
        pageMessageUtils.clearNotificationQueue();
        timeTableCleaner.clearOnlyClassRenders();
        timeTableCleaner.clearAllClassDetails();

        for (const lopDangKy of classes) {
            timeTableRenderUtils.renderLopDangKy(lopDangKy);
        }

        timeTableUtils.scanOverlapTimeClasses();
        pageMessageUtils.updateNumberMessages();
    }
}
const timeTableRenderUtils = new TimeTableRenderUtils();

/**
 * hàm tìm class với việc tự setup query nên khá linh động
 */
async function findManyLopDangKy(term = '', ids = [], options = { fuzzy: false }) {
    ids = ids.map((e) => utils.fromAnyToNumber(e));
    let filter = { ma_lop: { $in: ids } };
    if (options.fuzzy) {
        filter = {
            $or: ids.map(function (id) {
                let length = String(id).length;
                let missing = 6 - length;
                let filter = { ma_lop: id };
                if (missing > 0) {
                    let delta = Math.pow(10, missing);
                    let gte = id * delta;
                    let lte = gte + delta;
                    filter = { ma_lop: { $gte: gte, $lte: lte } };
                }
                return filter;
            })
        };
    }

    let url = AppConfig.worker_config.service2.address + `/api/find/many/lop-dang-ky?term=${term}`;
    return httpClientService.ajax({ url: url, method: 'POST', body: filter });
}

/**
 * hàm này là hàm sẽ chạy khi bấm nút PREVIEW
 * nó sẽ lấy thông tin hiện tại của tất cả các thông số sau đó sẽ render
 * có một vài chú ý là việc request có thể lâu nên cần thiết phải lưu closure
 * các biến hiện tại để check việc người dùng thay đổi tham số trước khi result
 * trả về (sẽ dẫn tới sai lệch thông tin các tham số)
 */
async function registerPreview() {
    let loadingSign = document.getElementById('register-preview-loading-sign');
    loadingSign.style.display = null;

    let termPreview = termPreviewUtils.getValue();
    let classIds = userInputManager.getClassIds();
    if (classIds.length == 0) {
        classIds = registerPreviewUtils.extractClassIdsFromString(inputSearchClassUtils.getValue());
    }

    let response = await findManyLopDangKy(termPreview, classIds);
    if (response.code == 1) {
        let classes = response.data;

        //EXPLAIN: có thể query quá lâu người dùng chuyển kì sẽ bị sai
        if (termPreviewUtils.getValue() == termPreview) {
            // nên check nếu đúng thì mới update giá trị và render
            TIMETABLE_DATA_PREVIEWING_CLASSES = classes;
            timeTableRenderUtils.renderClasses(classes);
        }
    }
    loadingSign.style.display = 'none';
}

document
    .getElementById('secret-show')
    .addEventListener('click', () => hiddenUtils.execute_order(66));

document
    .getElementById('secret-execute')
    .addEventListener('click', () => hiddenUtils.execute_order(69));

document
    .querySelectorAll('.REGISTER-PREVIEW')
    .forEach((each) => each.addEventListener('click', registerPreview));

document.querySelectorAll('.toggleWeekPreview').forEach((each) =>
    each.addEventListener('mousedown', function () {
        let delta = parseInt(each.getAttribute('data-value'));
        let week_old = weekPreviewUtils.getValue();
        let week_new = parseInt(week_old + delta);
        localStorage.setItem('week', week_new);

        weekPreviewUtils.setValue(week_new);
        timeTableRenderUtils.renderClasses(TIMETABLE_DATA_PREVIEWING_CLASSES);
    })
);

weekPreviewTag.addEventListener('keydown', function (e) {
    if (e.key.match(/^(\d|\w|Backspace)$/)) {
        setTimeout(() => {
            let week = weekPreviewUtils.getValue();
            localStorage.setItem('week', week);
            weekPreviewUtils.setValue(week);
            timeTableRenderUtils.renderClasses(TIMETABLE_DATA_PREVIEWING_CLASSES);
        }, 500);
    }
});

termPreviewTag.addEventListener('keydown', function (e) {
    if (e.key.match(/^(\d|\w|Backspace)$/)) {
        setTimeout(() => {
            let term = termPreviewUtils.getValue();
            localStorage.setItem('term', term);
        }, 500);
    }
});

openPageMessagesTag.addEventListener('click', function () {
    //EXPLAIN: check nếu đang dragging thì k kích hoạt
    if (openPageMessagesTag.getAttribute('data-animation-dragging') == 'true') return;

    pageMessagesContentTag.classList.toggle('hidden');
    closePageMessagesTag.classList.toggle('hidden');
});

closePageMessagesTag.addEventListener('click', function () {
    pageMessagesContentTag.classList.add('hidden');
    closePageMessagesTag.classList.add('hidden');
});

inputSearchClassTag.addEventListener('keydown', function (e) {
    setTimeout(async function () {
        let userInputSearchClassValue = '';
        userInputSearchClassValue = inputSearchClassUtils.getValue().trim();
        localStorage.setItem('input-search-class', userInputSearchClassValue);
        if (userInputSearchClassValue == '' || userInputSearchClassValue.match(/^\s+$/)) {
            classIdsElementsUtils.clearGuessIds();
            classIdsElementsUtils.hideGuessIds();
            return;
        }

        if (userInputSearchClassValue.length <= 4) {
            classIdsElementsUtils.clearGuessIds();
            classIdsElementsUtils.hideGuessIds();
            return;
        }

        if (e.key == 'Enter') {
            classIdsElementsUtils.addClassId(userInputSearchClassValue);
            inputSearchClassUtils.clearValue();
            classIdsElementsUtils.clearGuessIds();
            classIdsElementsUtils.hideGuessIds();
            return;
        }

        let termPreview = termPreviewUtils.getValue();
        let ids = registerPreviewUtils.extractClassIdsFromString(userInputSearchClassValue);
        let response = await findManyLopDangKy(termPreview, ids, { fuzzy: true });

        if (response.code == 1) {
            let classes = [new LopDangKy()];
            classes = response.data;
            if (classes.length == 0) {
                classIdsElementsUtils.clearGuessIds();
                classIdsElementsUtils.hideGuessIds();
                return;
            }
            classIdsElementsUtils.showGuessIds();
            for (let lopDangKy of classes) {
                let content = `${lopDangKy.ma_lop} - ${lopDangKy.ten_hoc_phan} (${lopDangKy.loai_lop}) - No.${lopDangKy.buoi_hoc_so}`;
                classIdsElementsUtils.addGuessId(content);
            }
        }
    }, 100);
});

async function main() {
    httpClientService.ajax(
        { url: '/register-preview.version.txt', method: 'GET' },
        function (data) {
            if (data) VERSION = data;
            document.getElementById('register-preview-version').innerText = VERSION || 'v2020.07';
        }
    );
    let dropHours = new Set([]);
    timeTableRenderUtils.initTable(dropHours, TABLE_ROW_HEIGHT);

    let inputSearchClass = localStorage.getItem('input-search-class');
    let term = localStorage.getItem('term');
    let week = localStorage.getItem('week');

    inputSearchClassUtils.setValue(inputSearchClass);
    termPreviewUtils.setValue(term);
    weekPreviewUtils.setValue(week);
}

main();
