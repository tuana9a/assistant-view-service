'use strict';

import { AppConfig } from './app.js';
import { httpClientService, localStorageService } from './common.js';
import { dateUtils, utils } from './common.utils.js';

// const TABLE_ROW_HEIGHT = 23;
const TABLE_ROW_HEIGHT = 25;

const NUM_OF_HOUR = 24;
const NUM_OF_DAYWEEK = 7;
const PREFIX_LOCAL_STORAGE_REGISTER_PREVIEW = 'register-preview';

//EXPLAIN: mảng lữu dữ liệu class hiện tại
var TIMETABLE_DATA_PREVIEWING_CLASSES = [];
//EXPLAIN: tiện cho render, check trùng thời gian
var TIMETABLE_DATA_DAY_WEEK_CLASSES = [[], [], [], [], [], [], []];
//EXPLAIN: mảng lưu các div thứ trong tuần
var TIMETABLE_DATA_DAY_WEEK_ELEMENTS = [];
//EXPLAIN: mảng lưu hourOfDay
var TIMETABLE_DATA_DAY_WEEK_ELEMENTS_WITH_HOUR_OF_DAYS = [[], [], [], [], [], [], []];

const CONTAINER_CLASS_IDS_TAG = document.getElementById('classIds');
const CONTAINER_GUESS_CLASS_IDS_TAG = document.getElementById('guessIds');

const TERM_PREVIEW_TAG = document.getElementById('termPreview');
const WEEK_PREVIEW_TAG = document.getElementById('weekPreview');

const INPUT_MSSV_TAG = document.getElementById('inputMssv');
const INPUT_CLASS_ID_TAG = document.getElementById('inputClassId');
const RENDER_TABLE_TAG = document.getElementById('renderTable');

const PAGE_MESSAGES_CONTENT_TAG = document.getElementById('pageMessagesContent');
const OPEN_PAGE_MESSAGES_TAG = document.getElementById('openPageMessages');
const CLOSE_PAGE_MESSAGES_TAG = document.getElementById('closePageMessages');

var REGISTER_PREVIEW_VERSION = 'v2020.07';

class HiddenUtils {
    execute_order(number) {
        let autoRegisterTag = document.getElementById('auto-register');
        let inputPasswordTag = document.getElementById('inputPassword');
        let inputBeginTag = document.getElementById('inputBegin');

        switch (number) {
            case 66:
                autoRegisterTag.classList.toggle('hidden');
                break;

            case 69:
                autoRegisterTag.classList.add('hidden');

                let username = userInputManager.getInputMssv_Value();
                let password = inputPasswordTag.value;

                let beginDate = inputBeginTag.querySelector('#inputDate').value;
                let beginTime = inputBeginTag.querySelector('#inputTime').value;
                let begin = new Date(beginDate + ' ' + beginTime).getTime();

                let classIds = userInputManager.getClassIdsFromUserInput();
                let data = { username, password, classIds, begin, type: 'dk-sis' };
                data = JSON.stringify(data, null, '  ');
                let html = `
                    <h3 class="messageType">Secret</h3>
                    <div class="messageContent">
                        <div class=""><b class="redText">value</b></div>
                        <div class=""><span style="cursor: pointer; word-wrap: break-word;">${data}</span></div>
                    </div>
                `;
                pageMessageManager.addMessageWithListener(html, {
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
                        pageMessageManager.updateNumberMessages();
                    }
                });
                break;
        }
    }
}
const hiddenUtils = new HiddenUtils();

class RegisterPreviewUtils {
    extractClassIdsFromString(value = '') {
        let result = value
            .split(/\s*,\s*|\s+/)
            .map((e) => e.replace(/[\D]+/g, ''))
            .filter((e) => e != '');
        return result;
    }
    generateQueryFromClassIds(ids = []) {
        let result = ids
            .filter((e) => e != '')
            .reduce((total, each) => `${total}${each},`, '')
            .slice(0, -1);
        return result;
    }
    reformatClasses(classes = []) {
        return classes.map((classs) => {
            delete classs._id;
            return classs;
        });
    }
}
const registerPreviewUtils = new RegisterPreviewUtils();

/**
 * quản lí data lưu vào local storage
 */
class LocalStorageRegisterPreviewService {
    set(name = '', value) {
        localStorageService.set(PREFIX_LOCAL_STORAGE_REGISTER_PREVIEW, name, value);
    }
    get(name = '') {
        return localStorageService.get(PREFIX_LOCAL_STORAGE_REGISTER_PREVIEW, name);
    }
    init() {
        let mssv = localStorageRegisterPreviewManager.get('mssv');
        if (mssv) userInputManager.setInputMssv_Value(mssv);

        let termPreview = localStorageRegisterPreviewManager.get('term-preview');
        if (termPreview) termPreviewManager.setTermPreviewValue(termPreview);

        let weekPreview = localStorageRegisterPreviewManager.get('week-preview');
        if (weekPreview) weekPreviewManager.setWeekPreviewValue(weekPreview);
    }
}
const localStorageRegisterPreviewManager = new LocalStorageRegisterPreviewService();

/**
 * quản lí việc input của người dùng
 */
class UserInputManager {
    getInputClassIdValue() {
        return INPUT_CLASS_ID_TAG.value;
    }
    clearInputClassIdValue() {
        INPUT_CLASS_ID_TAG.value = '';
    }

    getInputMssv_Value() {
        return INPUT_MSSV_TAG.value;
    }
    setInputMssv_Value(value = '') {
        INPUT_MSSV_TAG.value = value;
    }

    getValueArrayFromUserInput() {
        let result = Array.from(CONTAINER_CLASS_IDS_TAG.querySelectorAll('.input')).map((e) => e.textContent.trim());
        return result;
    }
    getClassIdsFromUserInput() {
        let result = [];
        userInputManager.getValueArrayFromUserInput().forEach((value) => {
            //EXPLAIN: vì 1 input có thể cho phép nhiều class (VD: 1235, 1234 - lớp LT, BT) ...
            let ids = registerPreviewUtils.extractClassIdsFromString(value);
            result.push(...ids);
        });
        return result;
    }
}
const userInputManager = new UserInputManager();

/**
 * quản lí các thư liên quan tới tuần
 */
class WeekPreviewManager {
    updateWhenChangeWeekPreview(delta = 0) {
        delta = parseInt(delta);
        let weekPreview = weekPreviewManager.getWeekPreviewValue() + delta;
        let termPreview = termPreviewManager.getTermPreviewValue();

        weekPreviewManager.setWeekPreviewValue(weekPreview);
        timeTableRenderSerivce.addClasses(TIMETABLE_DATA_PREVIEWING_CLASSES, termPreview);
        localStorageRegisterPreviewManager.set('week-preview', weekPreview);
    }
    setWeekPreviewValue(value = -1) {
        value = parseInt(value);
        WEEK_PREVIEW_TAG.textContent = value;
    }
    getWeekPreviewValue() {
        let value = parseInt(WEEK_PREVIEW_TAG.textContent);
        return value;
    }
}
const weekPreviewManager = new WeekPreviewManager();

/**
 * quản lí các thứ liên quan tới kỳ học
 */
class TermPreviewManager {
    getTermPreviewValue() {
        return TERM_PREVIEW_TAG.value;
    }
    setTermPreviewValue(value = '') {
        TERM_PREVIEW_TAG.value = value;
    }
}
const termPreviewManager = new TermPreviewManager();

class PageMessageManager {
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
        pageMessageManager.updateNumberMessages();
    }
    addNotHaveTimeClass(classs) {
        let html = `
            <h3 class="messageType">Special Case</h3>
            <div class="messageContent">
                <div class=""><b class="redText">ko thời gian</b></div>
                <div class="">${classs['tenHocPhan']}</div>
                <div class="">${classs['ghiChu']}</div>
            </div>
        `;
        pageMessageManager.addMessageWithListener(html);
    }
    addOverlapTimeClasses(classes = []) {
        let html = classes.reduce((total, classs) => {
            let thoiGian = classs['thoiGian'];
            let startString = classTimeFormat(thoiGian.startHour, thoiGian.startMinute);
            let endString = classTimeFormat(thoiGian.endHour, thoiGian.endMinute);
            let thoiGianString = startString + '-' + endString;

            let innerHTML = `
                <div class="section">
                    <div class="">${classs['tenHocPhan']}</div>
    
                    <div class=""><b class="redText">${thoiGianString}</b></div>
                    <div class="">${classs['phong']}</div>
    
                    <div class=""><b class="redText">${classs['ngay']}</b></div>
                    <div class="">${classs['nhom']}</div>
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
        pageMessageManager.addMessageWithListener(html);
    }
}
const pageMessageManager = new PageMessageManager();

/**
 * quản lí các element liên quan tới lớp đăng kí
 */
class LopDangKyElementManager {
    addClassIdToContainer(value) {
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
        CONTAINER_CLASS_IDS_TAG.appendChild(createClassIdDiv(value));
    }
    addGuessIdToContainer(value) {
        function createClassIdDiv(value) {
            let div = document.createElement('div');
            div.classList.add('classId', 'noSelect');
            div.innerHTML = `<span class="maLop">${value}</span>`;
            div.addEventListener('click', (e) => {
                lopDangKyElementManager.addClassIdToContainer(div.textContent);
                div.remove();
            });
            return div;
        }
        CONTAINER_GUESS_CLASS_IDS_TAG.appendChild(createClassIdDiv(value));
    }
    clearContainerClassIds() {
        CONTAINER_CLASS_IDS_TAG.innerHTML = '';
    }
    clearGuessIdsContainer() {
        CONTAINER_GUESS_CLASS_IDS_TAG.innerHTML = '';
    }
}
const lopDangKyElementManager = new LopDangKyElementManager();

class RegisterPreviewRequestsService {
    async getClassesGuess(value = '', term = '', callback = console.log) {
        let query = registerPreviewUtils.generateQueryFromClassIds(registerPreviewUtils.extractClassIdsFromString(value));
        let url = AppConfig.worker_config.service2.address + `/api/public/classes?ids=${query}&term=${term}&type=near`;
        return httpClientService.ajax({ url: url, method: 'GET' }, callback);
    }
    async getClassesMatch(term = '', ids = [], callback = console.log) {
        let query = registerPreviewUtils.generateQueryFromClassIds(ids);
        let url = AppConfig.worker_config.service2.address + `/api/public/classes?ids=${query}&term=${term}&type=match`;
        return httpClientService.ajax({ url: url, method: 'GET' }, callback);
    }
    async getStudentRegister(term = '', mssv = '', callback = console.log) {
        let url = AppConfig.worker_config.service2.address + `/api/public/student?term=${term}&mssv=${mssv}`;
        return httpClientService.ajax({ url: url, method: 'GET' }, callback);
    }
}
const registerPreviewRequestsService = new RegisterPreviewRequestsService();

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
                    if (parseInt(week) == weekPreviewManager.getWeekPreviewValue()) return true;
                    break;
                case 2:
                    let startWeek = parseInt(temp[0]);
                    let endWeek = parseInt(temp[1]);
                    for (let i = startWeek; i <= endWeek; i++) {
                        if (i == weekPreviewManager.getWeekPreviewValue()) return true;
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
        for (const classes of TIMETABLE_DATA_DAY_WEEK_CLASSES) {
            let overlapHandeledClasses = []; //EXPLAIN: handled class on that day, skip when meet again

            //EXPLAIN: iterate classes on that day
            for (const mainClass of classes) {
                if (utils.existInArray(mainClass, overlapHandeledClasses)) continue;

                let existOverlap = false;
                let overlapClasses = []; //EXPLAIN: array with all class that same with main
                // use after iterate all to alert to speical queue

                //EXPLAIN: main class compare with other class on that day
                // if overlap then existOverlap = true
                for (const otherClass of classes) {
                    if (otherClass == mainClass) continue;

                    let mainTime = mainClass['thoiGian'];
                    let otherTime = otherClass['thoiGian'];

                    let mainStart = mainTime.startHour * 60 + mainTime.startMinute;
                    let otherStart = otherTime.startHour * 60 + otherTime.startMinute;

                    let mainEnd = mainTime.endHour * 60 + mainTime.endMinute;
                    let otherEnd = otherTime.endHour * 60 + otherTime.endMinute;

                    let notOverlap = mainStart > otherEnd || mainEnd < otherStart;
                    if (notOverlap) continue;

                    existOverlap = true;
                    overlapHandeledClasses.push(otherClass);
                    overlapClasses.push(otherClass);
                }

                //EXPLAIN: if have overlap add mainClass to handled so skip if meet again
                if (existOverlap) {
                    overlapHandeledClasses.push(mainClass);
                    overlapClasses.push(mainClass);
                    pageMessageManager.addOverlapTimeClasses(overlapClasses);
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
        TIMETABLE_DATA_DAY_WEEK_ELEMENTS.forEach((dayOfWeek) => dayOfWeek.querySelectorAll('.classRender').forEach((each) => each.remove()));
    }
    clearAllClassDetails() {
        Array.from(document.querySelectorAll('.classDetails')).forEach((each) => each.remove());
    }
}
const timeTableCleaner = new TimeTableCleaner();

// rendering
class LopDangKyRenderPattern {
    maLop;
    maLopKem;
    loaiLop;
    maHocPhan;
    tenHocPhan;

    thoiGian;
    thu;
    phong;
    tuan;

    nhom;
    ngay;
    ghiChu;
}
class TimeTableRenderService {
    initTable(dropHours = new Set(), TABLE_ROW_HEIGHT = 23) {
        RENDER_TABLE_TAG.innerHTML = ``;

        function createHourIndexColumn(dropHours = new Set()) {
            let column = document.createElement('div');
            column.classList.add('column', 'indexHour');

            column.innerHTML = `<div class="columName" style="height:${TABLE_ROW_HEIGHT + 'px'}"><span></span></div>`;
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
            column.innerHTML = `<div class="columName dadFlexCenter" style="height:${TABLE_ROW_HEIGHT + 'px'}"><span>${dayName}</span></div>`;
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

        RENDER_TABLE_TAG.appendChild(createHourIndexColumn(dropHours)); //EXPLAIN: cột chỉ số thời gian
        [2, 3, 4, 5, 6, 7, 8].forEach((day) => RENDER_TABLE_TAG.appendChild(createDayWeekColumn(day, dropHours)));

        TIMETABLE_DATA_DAY_WEEK_ELEMENTS = Array.from(RENDER_TABLE_TAG.querySelectorAll('.dayOfWeek'));
        for (let i = 0; i < NUM_OF_DAYWEEK; i++) {
            TIMETABLE_DATA_DAY_WEEK_ELEMENTS_WITH_HOUR_OF_DAYS[i] = Array.from(TIMETABLE_DATA_DAY_WEEK_ELEMENTS[i].querySelectorAll('.hourOfDay'));
        }

        //EXPLAIN: scroll to working hour
        // let renderContainer = RENDER_TABLE_TAG.parentElement;
        // renderContainer.style.height = 14 * TABLE_ROW_HEIGHT + 'px';
        // renderContainer.scrollTo(0, 6 * TABLE_ROW_HEIGHT);
    }
    addElementRender(classs, TABLE_ROW_HEIGHT = 23) {
        let thu = classs['thu'];
        let time = classs['thoiGian'];

        let hourOfDayElement = timeTableUtils.getHourOfDayElement(thu, time.startHour);
        let top = hourOfDayElement.offsetTop + (time.startMinute / 60) * TABLE_ROW_HEIGHT;
        let height = (time.endHour - time.startHour + (time.endMinute - time.startMinute) / 60) * TABLE_ROW_HEIGHT;

        let time_start = timeTableUtils.classTimeFormat(time.startHour, time.startMinute);
        let time_end = timeTableUtils.classTimeFormat(time.endHour, time.endMinute);

        let classRenderElement = document.createElement('div');
        classRenderElement.classList.add('classRender', 'positionAbsolute');
        classRenderElement.style.top = `${top}px`;
        classRenderElement.style.height = `${height}px`;
        let rgb = `rgb(${255 - Math.random() * 150},${255 - Math.random() * 150},${255 - Math.random() * 150})`;
        classRenderElement.style.backgroundColor = rgb;
        classRenderElement.innerHTML = `
            <div class="classContainer positionRelative dadFlexCenter">
                <div class="classProps">
                    <div class="tenHocPhan classProp">${classs['tenHocPhan']} (${classs['loaiLop']})</div>
                    <div class="thoiGian classProp">${time_start + ' - ' + time_end}</div>
                    <div class="phong classProp">${classs['phong']}</div>
                </div>
            </div>
        `;
        // classRenderElement.style.zIndex = 20 - thu;
        classRenderElement.style.zIndex = 15;
        TIMETABLE_DATA_DAY_WEEK_ELEMENTS[thu - 2].appendChild(classRenderElement);
        TIMETABLE_DATA_DAY_WEEK_CLASSES[thu - 2].push({ ...classs, div: classRenderElement });
    }
    addCacBuoiHoc_BuoiHoc(classs) {
        let cacBuoiHoc = classs['cacBuoiHoc'];
        if (!cacBuoiHoc) return;
        for (const buoiHoc of cacBuoiHoc) {
            let tuanHoc = buoiHoc['tuanHoc'];
            if (timeTableUtils.notHaveClassTime(tuanHoc)) {
                pageMessageManager.addNotHaveTimeClass(classs);
                continue;
            } else if (!timeTableUtils.hasClassThisWeek(tuanHoc)) continue;

            let thuHoc = buoiHoc['thuHoc'];

            let thoiGianHoc = buoiHoc['thoiGianHoc']; //EXPLAIN: VD: 1234-5678 -> 12h34p - 56h78p
            let time = {
                startHour: parseInt(thoiGianHoc.substr(0, 2)),
                startMinute: parseInt(thoiGianHoc.substr(2, 3)),
                endHour: parseInt(thoiGianHoc.substr(5, 2)),
                endMinute: parseInt(thoiGianHoc.substr(7, 2))
            };

            let pattern = new LopDangKyRenderPattern();

            pattern.maLop = classs['maLop'];
            pattern.loaiLop = classs['loaiLop'];
            pattern.maLopKem = classs['maLopKem'];
            pattern.maHocPhan = classs['maHocPhan'];
            pattern.tenHocPhan = classs['tenHocPhan'];
            pattern.ghiChu = classs['ghiChu'];

            pattern.thoiGian = time;
            pattern.thu = thuHoc;
            pattern.phong = buoiHoc['phongHoc'];
            pattern.tuan = tuanHoc;

            timeTableRenderSerivce.addElementRender(pattern, TABLE_ROW_HEIGHT);
        }
    }
    addThiGiuaKi_NhomThi(classs, firstWeekDay = '') {
        let cacNhom = classs['thiGiuaKi'];
        if (!cacNhom) return;
        for (const nhomThi of cacNhom) {
            let tuanThi = nhomThi['tuanThi'].substr(1);
            if (tuanThi == '') {
                tuanThi = String(dateUtils.weeksFromStartDay(nhomThi['ngayThi'], firstWeekDay));
            }
            if (timeTableUtils.notHaveClassTime(tuanThi)) {
                pageMessageManager.addNotHaveTimeClass(classs);
                continue;
            } else if (!timeTableUtils.hasClassThisWeek(tuanThi)) continue;

            let thuThi = nhomThi['thuThi'];
            if (thuThi == null || thuThi == undefined || thuThi == '') continue;
            switch (thuThi) {
                case 'Thứ hai':
                    thuThi = 2;
                    break;
                case 'Thứ ba':
                    thuThi = 3;
                    break;
                case 'Thứ tư':
                    thuThi = 4;
                    break;
                case 'Thứ năm':
                    thuThi = 5;
                    break;
                case 'Thứ sáu':
                    thuThi = 6;
                    break;
                case 'Thứ bảy':
                    thuThi = 7;
                    break;
                case 'Chủ nhật':
                    thuThi = 8;
                    break;
            }

            let kipThi = nhomThi['kipThi']; //EXPLAIN: VD: 1234-5678 -> 12h34p - 56h78p
            let time = {
                startHour: 0,
                startMinute: 0,
                endHour: 0,
                endMinute: 0
            };

            if (kipThi.match(/Kíp \d-\d/gi)) {
                let intStart = kipThi.charAt(4);
                let intEnd = kipThi.charAt(6);
                switch (intStart) {
                    case '1':
                        time.startHour = 7;
                        time.startMinute = 0;
                        break;
                    case '2':
                        time.startHour = 9;
                        time.startMinute = 30;
                        break;
                    case '3':
                        time.startHour = 12;
                        time.startMinute = 30;
                        break;
                    case '4':
                        time.startHour = 15;
                        time.startMinute = 0;
                        break;
                }
                switch (intEnd) {
                    case '1':
                        time.endHour = 8;
                        time.endMinute = 30;
                        break;
                    case '2':
                        time.endHour = 11;
                        time.endMinute = 0;
                        break;
                    case '3':
                        time.endHour = 14;
                        time.endMinute = 0;
                        break;
                    case '4':
                        time.endHour = 16;
                        time.endMinute = 30;
                        break;
                }
            } else if (kipThi.match(/Kíp 1/gi)) {
                time.startHour = 7;
                time.startMinute = 0;
                time.endHour = 8;
                time.endMinute = 30;
            } else if (kipThi.match(/Kíp 2/gi)) {
                time.startHour = 9;
                time.startMinute = 30;
                time.endHour = 11;
                time.endMinute = 0;
            } else if (kipThi.match(/Kíp 3/gi)) {
                time.startHour = 12;
                time.startMinute = 30;
                time.endHour = 14;
                time.endMinute = 0;
            } else if (kipThi.match(/Kíp 4/gi)) {
                time.startHour = 15;
                time.startMinute = 0;
                time.endHour = 16;
                time.endMinute = 30;
            } else {
                let matches = kipThi.match(/\d+h\d*/gi);
                // console.log(matches);
                if (matches) {
                    let temp = matches[0].split('h');
                    time.startHour = parseInt(temp[0]);
                    time.startMinute = parseInt(temp[1] == '' ? '0' : temp[1]);
                    if (matches[1] == undefined) {
                        time.endHour = time.startHour + 1;
                        time.startMinute = time.startMinute;
                    } else {
                        temp = matches[1].split('h');
                        time.endHour = parseInt(temp[0]);
                        time.endMinute = parseInt(temp[1] == '' ? '0' : temp[1]);
                    }
                }
            }

            let pattern = new LopDangKyRenderPattern();

            pattern.maLop = classs['maLop'];
            pattern.maLopKem = classs['maLopKem'];
            pattern.loaiLop = classs['loaiLop'];
            pattern.maHocPhan = classs['maHocPhan'];
            pattern.tenHocPhan = classs['tenHocPhan'];
            pattern.ghiChu = classs['ghiChu'];

            pattern.thoiGian = time;
            pattern.thu = thuThi;
            pattern.phong = nhomThi['phongThi'];
            pattern.tuan = tuanThi;
            pattern.ngay = nhomThi['ngayThi'];

            pattern.nhom = nhomThi['name'];

            timeTableRenderSerivce.addElementRender(pattern, TABLE_ROW_HEIGHT);
        }
    }
    addThiCuoiKi_NhomThi(classs, firstWeekDay = '') {
        let cacNhom = classs['thiCuoiKi'];
        if (!cacNhom) return;
        for (const nhomThi of cacNhom) {
            let tuanThi = nhomThi['tuanThi'].substr(1);
            if (tuanThi == '') {
                tuanThi = String(dateUtils.weeksFromStartDay(nhomThi['ngayThi'], firstWeekDay));
            }
            if (timeTableUtils.notHaveClassTime(tuanThi)) {
                pageMessageManager.addNotHaveTimeClass(classs);
                continue;
            } else if (!timeTableUtils.hasClassThisWeek(tuanThi)) continue;

            let thuThi = nhomThi['thuThi'];
            if (thuThi == null || thuThi == undefined || thuThi == '') continue;
            switch (thuThi) {
                case 'Thứ hai':
                    thuThi = 2;
                    break;
                case 'Thứ ba':
                    thuThi = 3;
                    break;
                case 'Thứ tư':
                    thuThi = 4;
                    break;
                case 'Thứ năm':
                    thuThi = 5;
                    break;
                case 'Thứ sáu':
                    thuThi = 6;
                    break;
                case 'Thứ bảy':
                    thuThi = 7;
                    break;
                case 'Chủ nhật':
                    thuThi = 8;
                    break;
            }

            let kipThi = nhomThi['kipThi']; //EXPLAIN: VD: 1234-5678 -> 12h34p - 56h78p
            let time = {
                startHour: 0,
                startMinute: 0,
                endHour: 0,
                endMinute: 0
            };
            if (kipThi.match(/Kíp \d-\d/gi)) {
                let intStart = kipThi.charAt(4);
                let intEnd = kipThi.charAt(6);
                switch (intStart) {
                    case '1':
                        time.startHour = 7;
                        time.startMinute = 0;
                        break;
                    case '2':
                        time.startHour = 9;
                        time.startMinute = 30;
                        break;
                    case '3':
                        time.startHour = 12;
                        time.startMinute = 30;
                        break;
                    case '4':
                        time.startHour = 15;
                        time.startMinute = 0;
                        break;
                }
                switch (intEnd) {
                    case '1':
                        time.endHour = 8;
                        time.endMinute = 30;
                        break;
                    case '2':
                        time.endHour = 11;
                        time.endMinute = 0;
                        break;
                    case '3':
                        time.endHour = 14;
                        time.endMinute = 0;
                        break;
                    case '4':
                        time.endHour = 16;
                        time.endMinute = 30;
                        break;
                }
            } else if (kipThi.match(/Kíp 1/gi)) {
                time.startHour = 7;
                time.startMinute = 0;
                time.endHour = 8;
                time.endMinute = 30;
            } else if (kipThi.match(/Kíp 2/gi)) {
                time.startHour = 9;
                time.startMinute = 30;
                time.endHour = 11;
                time.endMinute = 0;
            } else if (kipThi.match(/Kíp 3/gi)) {
                time.startHour = 12;
                time.startMinute = 30;
                time.endHour = 14;
                time.endMinute = 0;
            } else if (kipThi.match(/Kíp 4/gi)) {
                time.startHour = 15;
                time.startMinute = 0;
                time.endHour = 16;
                time.endMinute = 30;
            }

            let pattern = new LopDangKyRenderPattern();

            pattern.maLop = classs['maLop'];
            pattern.maLopKem = classs['maLopKem'];
            pattern.loaiLop = classs['loaiLop'];
            pattern.maHocPhan = classs['maHocPhan'];
            pattern.tenHocPhan = classs['tenHocPhan'];
            pattern.ghiChu = classs['ghiChu'];

            pattern.thoiGian = time;
            pattern.thu = thuThi;
            pattern.phong = nhomThi['phongThi'];
            pattern.tuan = tuanThi;
            pattern.ngay = nhomThi['ngayThi'];

            pattern.nhom = nhomThi['name'];

            timeTableRenderSerivce.addElementRender(pattern, TABLE_ROW_HEIGHT);
        }
    }
    addClasses(classes = [], term = '') {
        pageMessageManager.clearNotificationQueue();
        timeTableCleaner.clearOnlyClassRenders();
        timeTableCleaner.clearAllClassDetails();

        // let firstWeekDay = registerPreviewLocalStorageManager.getTermFirstWeekDay(term);
        for (const classs of classes) {
            timeTableRenderSerivce.addCacBuoiHoc_BuoiHoc(classs);
            // timeTableRenderSerivce.addThiGiuaKi_NhomThi(classs, firstWeekDay);
            // timeTableRenderSerivce.addThiCuoiKi_NhomThi(classs, firstWeekDay);
        }

        timeTableUtils.scanOverlapTimeClasses();
        pageMessageManager.updateNumberMessages();
    }
}
const timeTableRenderSerivce = new TimeTableRenderService();

/**
 * hàm này là hàm sẽ chạy khi bấm nút PREVIEW
 * nó sẽ lấy thông tin hiện tại của tất cả các thông số sau đó sẽ render
 * có một vài chú ý là việc request có thể lâu nên cần thiết phải lưu closure
 * các biến hiện tại để check việc người dùng thay đổi tham số trước khi result
 * trả về (sẽ dẫn tới sai lệch thông tin các tham số)
 */
async function REGISTER_PREVIEW() {
    let loadingSign = document.getElementById('register-preview-loading-sign');

    loadingSign.style.display = null;
    let mssv = userInputManager.getInputMssv_Value();
    let studentRegister;
    let studentRegisterClasses = new Map();

    let termPreview = termPreviewManager.getTermPreviewValue();
    localStorageRegisterPreviewManager.set('term-preview', termPreview);
    let weekPreview = weekPreviewManager.getWeekPreviewValue();
    localStorageRegisterPreviewManager.set('week-preview', weekPreview);

    if (mssv != '') {
        let response = await registerPreviewRequestsService.getStudentRegister(termPreview, mssv, (data) => data);
        if (response.code == 1) studentRegister = response.data;
        localStorageRegisterPreviewManager.set('mssv', mssv);
    }

    let classIds = userInputManager.getClassIdsFromUserInput();
    if (studentRegister) {
        classIds = studentRegister.dangKi.map(function (each) {
            let maLop = each.maLop;
            studentRegisterClasses.set(maLop, each);
            return maLop;
        });
    }

    registerPreviewRequestsService.getClassesMatch(termPreview, classIds, function (response) {
        if (response.code == 1) {
            let classes = registerPreviewUtils.reformatClasses(response.data);

            if (studentRegister) {
                lopDangKyElementManager.clearContainerClassIds();
                classes = classes.map(function (classs) {
                    let nhom = studentRegisterClasses.get(classs.maLop).nhom;
                    classs.thiGiuaKi = classs.thiGiuaKi?.filter((each) => each.name == nhom);
                    classs.thiCuoiKi = classs.thiCuoiKi?.filter((each) => each.name == nhom);
                    lopDangKyElementManager.addClassIdToContainer(`${classs.maLop} - ${classs.tenHocPhan} - ${classs.loaiLop}`);
                    return classs;
                });
            }

            //EXPLAIN: có thể change sau query với trường hợp dùng mssv
            let userInputClassIds = userInputManager.getValueArrayFromUserInput();

            //EXPLAIN: có thể query quá lâu người dùng chuyển kì sẽ bị sai
            if (termPreviewManager.getTermPreviewValue() == termPreview) {
                // nên check nếu đúng thì mới update giá trị và render
                TIMETABLE_DATA_PREVIEWING_CLASSES = classes;
                timeTableRenderSerivce.addClasses(classes, termPreview);
            }
        }
        loadingSign.style.display = 'none';
    });
}

document.getElementById('secret-show').addEventListener('click', function () {
    hiddenUtils.execute_order(66);
});
document.getElementById('secret-execute').addEventListener('click', function () {
    hiddenUtils.execute_order(69);
});

document.querySelectorAll('.REGISTER-PREVIEW').forEach(function (each) {
    each.addEventListener('click', REGISTER_PREVIEW);
});
document.querySelectorAll('.toggleWeekPreview').forEach(function (each) {
    let value = each.getAttribute('data-value');
    each.addEventListener('mousedown', function () {
        weekPreviewManager.updateWhenChangeWeekPreview(value);
    });
});

httpClientService.ajax({ url: '/register-preview.version.txt', method: 'GET' }, function (data) {
    if (data) REGISTER_PREVIEW_VERSION = data;
    document.getElementById('register-preview-version').innerText = REGISTER_PREVIEW_VERSION || 'v2020.07';
});

function main() {
    INPUT_MSSV_TAG.addEventListener('keydown', (e) => {
        if (e.key == 'Enter') setTimeout(REGISTER_PREVIEW, 50);
    });

    // page message init
    OPEN_PAGE_MESSAGES_TAG.addEventListener('click', function () {
        //EXPLAIN: check nếu đang dragging thì k kích hoạt
        if (OPEN_PAGE_MESSAGES_TAG.getAttribute('data-animation-dragging') == 'true') return;

        PAGE_MESSAGES_CONTENT_TAG.classList.toggle('hidden');
        CLOSE_PAGE_MESSAGES_TAG.classList.toggle('hidden');
    });
    CLOSE_PAGE_MESSAGES_TAG.addEventListener('click', function () {
        PAGE_MESSAGES_CONTENT_TAG.classList.add('hidden');
        CLOSE_PAGE_MESSAGES_TAG.classList.add('hidden');
    });

    let dropHours = new Set([]);
    timeTableRenderSerivce.initTable(dropHours, TABLE_ROW_HEIGHT);

    var userInputTimeoutHandler;
    INPUT_CLASS_ID_TAG.addEventListener('keydown', (e) => {
        clearTimeout(userInputTimeoutHandler);
        userInputTimeoutHandler = setTimeout(async () => {
            let value = userInputManager.getInputClassIdValue();
            if (value == '') return;
            if (e.key == 'Enter') {
                lopDangKyElementManager.addClassIdToContainer(value);
                userInputManager.clearInputClassIdValue();
            } else if (value.length > 4) {
                registerPreviewRequestsService.getClassesGuess(value, termPreviewManager.getTermPreviewValue(), (response) => {
                    if (response.code == 1) {
                        lopDangKyElementManager.clearGuessIdsContainer();
                        let classes = registerPreviewUtils.reformatClasses(response.data);
                        if (classes.length == 0) {
                            let content = `<div><span style="color: var(--green_neon);">không tìm thấy</span></div>`;
                            CONTAINER_GUESS_CLASS_IDS_TAG.innerHTML = content;
                            return;
                        }
                        classes.forEach(function (classs) {
                            let content = `${classs.maLop} - ${classs.tenHocPhan} - ${classs.loaiLop}`;
                            lopDangKyElementManager.addGuessIdToContainer(content);
                        });
                    }
                });
            } else {
                lopDangKyElementManager.clearGuessIdsContainer();
            }
        }, 50);
    });

    /**
     * 2 dòng code phía dưới phải để sát nhau không di chuyển ra ngoài
     * hay thay đổi vị trí của chúng được :( code...
     */
    localStorageRegisterPreviewManager.init();
}
main();
