'use strict';

import { AppConfig } from '../app.js';
import { renderService } from './render.js';
import { animationService } from '../animation.js';
import { pageMessageService } from './message.js';
import { httpClientService, localStorageService, dateUtils, utils } from '../common.js';

// let TABLE_ROW_HEIGHT = 23;
let TABLE_ROW_HEIGHT = 25;

const NUM_OF_HOUR = 24;
const NUM_OF_DAYWEEK = 7;
var USER_INPUT_TIMEOUT_HANDLER;
const PREFIX_LOCAL_STORAGE_REGISTER_PREVIEW = 'register-preview';
export const TIMETABLE_DATA = {
    PREVIEWING_CLASSES: [], //EXPLAIN: mảng lữu dữ liệu class hiện tại
    DAY_WEEK_CLASSES: [[], [], [], [], [], [], []], //EXPLAIN: tiện cho render, check trùng thời gian
    DAY_WEEK_ELEMENTS: [], //EXPLAIN: mảng lưu các div thứ trong tuần
    DAY_WEEK_ELEMENTS_WITH_HOUR_OF_DAYS: [[], [], [], [], [], [], []] //EXPLAIN: mảng lưu hourOfDay
};

const TERM_PREVIEW_TAG = document.getElementById('termPreview');
export const CONTAINER_CLASS_IDS_TAG = document.getElementById('classIds');
export const RETURN_CURRENT_WEEK_BUTTON = document.getElementById('returnCurrentWeek');

const CONTAINER_GUESS_CLASS_IDS_TAG = document.getElementById('guessIds');
const WEEK_PREVIEW_TAG = document.getElementById('weekPreview');

const INPUT_MSSV_TAG = document.getElementById('inputMssv');
const INPUT_CLASS_ID_TAG = document.getElementById('inputClassId');
const RENDER_TABLE_TAG = document.getElementById('renderTable');

//SECTION: HELPER ===============================================================================================
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
export const registerPreviewUtils = new RegisterPreviewUtils();

/**
 * pattern cho việc lưu data ra local storage
 */
export class BackUpDataRegisterPreview {
    termPreview;
    weekPreview;
    userInputClassIds;
    classArray;
    constructor(termPreview = '20192', weekPreview = 0, userInputClassIds = [], classArray = []) {
        this.termPreview = termPreview;
        this.userInputClassIds = userInputClassIds;
        this.weekPreview = weekPreview;
        this.classArray = classArray;
    }
}

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
        let mssv = registerPreviewLocalStorageManager.get('mssv');
        if (mssv) inputManager.setInputMssv_Value(mssv);

        let available = registerPreviewLocalStorageManager.get('terms');
        if (available) termService.setTermPreviewAvailable(available);

        let currentTerm = registerPreviewLocalStorageManager.get('current-term');
        if (currentTerm) {
            realTimeService.updateCurrentWeek(currentTerm);
            termService.setTermPreviewValue(currentTerm);
            registerPreviewLocalStorageManager.fetchDataThenRender(currentTerm);
        }

        realTimeService.checkRealtime();
    }
    getTermFirstWeekDay(term = '') {
        let available = registerPreviewLocalStorageManager.get('terms');
        for (let key in available) {
            if (key == term) {
                return available[`${key}`].firstWeekDay;
            }
        }
        return dateUtils.dateToDash(new Date());
    }
    getCurrentWeek() {
        return registerPreviewLocalStorageManager.get('current-week') || 0;
    }
    fetchDataThenRender(term = '') {
        let previewData = registerPreviewLocalStorageManager.get(term);
        if (!previewData) return;

        weekService.setWeekPreviewValue(previewData.weekPreview);
        previewData.userInputClassIds.forEach(lopDangKyElementManager.addClassIdToContainer);

        TIMETABLE_DATA.PREVIEWING_CLASSES = previewData.classArray;
        timeTableRenderSerivce.addClasses(TIMETABLE_DATA.PREVIEWING_CLASSES, term);
    }
}
export const registerPreviewLocalStorageManager = new LocalStorageRegisterPreviewService();

/**
 * quản lí việc input của người dùng
 */
class InputManager {
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
        inputManager.getValueArrayFromUserInput().forEach((value) => {
            //EXPLAIN: vì 1 input có thể cho phép nhiều class (VD: 1235, 1234 - lớp LT, BT) ...
            let ids = registerPreviewUtils.extractClassIdsFromString(value);
            result.push(...ids);
        });
        return result;
    }
}
export const inputManager = new InputManager();

/**
 * quản lí các thư liên quan tới tuần
 */
class WeekService {
    updateWhenChangeWeekPreview(delta = 0) {
        delta = parseInt(delta);
        let weekPreview = weekService.getWeekPreviewValue() + delta;
        let termPreview = termService.getTermPreviewValue();

        weekService.setWeekPreviewValue(weekPreview);
        let backupData = new BackUpDataRegisterPreview(termPreview, weekPreview, inputManager.getValueArrayFromUserInput(), TIMETABLE_DATA.PREVIEWING_CLASSES);
        registerPreviewLocalStorageManager.set(backupData.termPreview, backupData);

        timeTableRenderSerivce.addClasses(TIMETABLE_DATA.PREVIEWING_CLASSES, termPreview);
        realTimeService.checkRealtime();
    }
    returnCurrentWeek() {
        weekService.setWeekPreviewValue(registerPreviewLocalStorageManager.getCurrentWeek());

        let termPreview = termService.getTermPreviewValue();
        let weekPreview = weekService.getWeekPreviewValue(); //CAUTION: get week preview after set weekPreview
        timeTableRenderSerivce.addClasses(TIMETABLE_DATA.PREVIEWING_CLASSES, termPreview);

        realTimeService.checkRealtime();
        let backupData = new BackUpDataRegisterPreview(termPreview, weekPreview, inputManager.getValueArrayFromUserInput(), TIMETABLE_DATA.PREVIEWING_CLASSES);
        registerPreviewLocalStorageManager.set(backupData.termPreview, backupData);
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
export const weekService = new WeekService();

/**
 * quản lí các thứ liên quan tới kỳ học
 */
class TermService {
    updateWhenSwitchTermPreview() {
        setTimeout(function () {
            timeTableCleaner.clearOnlyClassRenders(); //EXPLAIN: nếu không thì render bị giữ khi chuyển term
            lopDangKyElementManager.clearContainerClassIds(); //EXPLAIN: nếu không thì classIds sẽ giữ nguyên khi chuyển term

            let termPreview = termService.getTermPreviewValue();
            realTimeService.updateCurrentWeek(termPreview); //EXPLAIN: current week after query terms
            registerPreviewLocalStorageManager.fetchDataThenRender(termPreview);

            realTimeService.checkRealtime();
        }, 0);
    }
    getTermPreviewValue() {
        return TERM_PREVIEW_TAG.value;
    }
    setTermPreviewValue(value = '') {
        TERM_PREVIEW_TAG.value = value;
    }
    setTermPreviewAvailable(available = {}) {
        let html = '';
        for (let term in available) {
            html += `<option value="${term}">${term}</option>`;
        }
        TERM_PREVIEW_TAG.innerHTML = html;
    }
}
export const termService = new TermService();

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

/**
 * các hàm to của service này
 */
class RegisterPreviewService {
    /**
     * query từ server và cập nhật các thông số liên quan tới kỳ học
     */
    async updateTermsFromServer() {
        return Promise.all([
            registerPreviewRequestsService.getTermsJson(function (response) {
                if (response) {
                    let termPreview = termService.getTermPreviewValue();
                    let available = response.available;
                    let current = response.current;

                    termService.setTermPreviewAvailable(available);

                    registerPreviewLocalStorageManager.set('terms', available);
                    registerPreviewLocalStorageManager.set('current-term', current);

                    //CAUTION: current week after set webapp terms
                    realTimeService.updateCurrentWeek(termPreview);
                    termService.setTermPreviewValue(termPreview);
                }
            })
        ]);
    }
    /**
     * hàm này là hàm sẽ chạy khi bấm nút PREVIEW
     * nó sẽ lấy thông tin hiện tại của tất cả các thông số sau đó sẽ render
     * có một vài chú ý là việc request có thể lâu nên cần thiết phải lưu closure
     * các biến hiện tại để check việc người dùng thay đổi tham số trước khi result
     * trả về (sẽ dẫn tới sai lệch thông tin các tham số)
     */
    async REGISTER_PREVIEW() {
        let loadingSign = document.getElementById('register-preview-loading-sign');

        loadingSign.style.display = null;
        let mssv = inputManager.getInputMssv_Value();
        let studentRegister;
        let studentRegisterClasses = new Map();

        let termPreview = termService.getTermPreviewValue();
        let weekPreview = weekService.getWeekPreviewValue();

        if (mssv != '') {
            let response = await registerPreviewRequestsService.getStudentRegister(termPreview, mssv, (data) => data);
            if (response.code == 1) studentRegister = response.data;
            registerPreviewLocalStorageManager.set('mssv', mssv);
        }

        let classIds = inputManager.getClassIdsFromUserInput();
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
                let userInputClassIds = inputManager.getValueArrayFromUserInput();

                //EXPLAIN: có thể query quá lâu người dùng chuyển kì sẽ bị sai
                if (termService.getTermPreviewValue() == termPreview) {
                    // nên check nếu đúng thì mới update giá trị và render
                    TIMETABLE_DATA.PREVIEWING_CLASSES = classes;
                    timeTableRenderSerivce.addClasses(classes, termPreview);
                }

                let backupData = new BackUpDataRegisterPreview(termPreview, weekPreview, userInputClassIds, classes);
                registerPreviewLocalStorageManager.set(backupData.termPreview, backupData);
            }
            loadingSign.style.display = 'none';
        });
    }
}
export const registerPreviewService = new RegisterPreviewService();

class RegisterPreviewRequestsService {
    async getTermsJson(callback = console.log) {
        return httpClientService.ajax({ url: '/terms.json', method: 'GET' }, callback);
    }
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
export const registerPreviewRequestsService = new RegisterPreviewRequestsService();

class TimeTableUtils {
    hasClassThisWeek(classWeek = '') {
        if (classWeek == null || classWeek == undefined || classWeek == '') return false;

        let subWeeks = classWeek.split(',');
        for (let i = 0; i < subWeeks.length; i++) {
            let week = subWeeks[i];
            let temp = week.split('-');
            switch (temp.length) {
                case 1:
                    if (parseInt(week) == weekService.getWeekPreviewValue()) return true;
                    break;
                case 2:
                    let startWeek = parseInt(temp[0]);
                    let endWeek = parseInt(temp[1]);
                    for (let i = startWeek; i <= endWeek; i++) {
                        if (i == weekService.getWeekPreviewValue()) return true;
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
        return TIMETABLE_DATA.DAY_WEEK_ELEMENTS_WITH_HOUR_OF_DAYS[thu - 2][gio];
    }
    scanOverlapTimeClasses() {
        //EXPLAIN: iterate every dayweek
        for (const classes of TIMETABLE_DATA.DAY_WEEK_CLASSES) {
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
                    pageMessageService.addOverlapTimeClasses(overlapClasses);
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
        TIMETABLE_DATA.DAY_WEEK_CLASSES = TIMETABLE_DATA.DAY_WEEK_CLASSES.map(() => []); //EXPLAIN: reset each day of week
        TIMETABLE_DATA.DAY_WEEK_ELEMENTS.forEach((dayOfWeek) => dayOfWeek.querySelectorAll('.classRender').forEach((each) => each.remove()));
    }
    clearAllClassDetails() {
        Array.from(document.querySelectorAll('.classDetails')).forEach((each) => each.remove());
    }
}
export const timeTableCleaner = new TimeTableCleaner();

//SECTION: rendering
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
        RENDER_TABLE_TAG.innerHTML = `
            <div class="renderRuler" id="renderRuler">
                <hr class="ruler">
            </div>
        `;

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

        TIMETABLE_DATA.DAY_WEEK_ELEMENTS = Array.from(RENDER_TABLE_TAG.querySelectorAll('.dayOfWeek'));
        for (let i = 0; i < NUM_OF_DAYWEEK; i++) {
            TIMETABLE_DATA.DAY_WEEK_ELEMENTS_WITH_HOUR_OF_DAYS[i] = Array.from(TIMETABLE_DATA.DAY_WEEK_ELEMENTS[i].querySelectorAll('.hourOfDay'));
        }

        //EXPLAIN: scroll to working hour
        let renderContainer = RENDER_TABLE_TAG.parentElement;
        renderContainer.style.height = 14 * TABLE_ROW_HEIGHT + 'px';
        renderContainer.scrollTo(0, 6 * TABLE_ROW_HEIGHT);
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

        let classDetails = document.createElement('div');
        classDetails.classList.add('classDetails', 'drag-to-move', 'hidden');
        classDetails.innerHTML = `
            <h3 class="drag-to-move-header redText" style="padding: 5px 0">Details</h3>    
            <div class="positionAbsolute close">❌</div>
            
            <span class="classProp">${classs['tenHocPhan']}</span>
            <br>
            <span class="classProp">Mã lớp: ${classs['maLop']}</span>
            <br>
            <span class="classProp">Mã HP : ${classs['maHocPhan']}</span>
            <br>
            <span class="classProp">Thứ   : ${thu}</span>
            <br>
            <span class="classProp">Tuần  : ${classs['tuan']}</span>
            <br>
            <span class="classProp">Ngày  : ${classs['ngay']}</span>
            <br>
            <span class="classProp">Nhóm  : ${classs['nhom']}</span>
            <br>
            <span class="classProp">${classs['ghiChu']}</span>
        `;
        animationService.makeElement_DragToMove(classDetails);
        let closeClassDetails = classDetails.querySelector('.close');
        closeClassDetails.addEventListener('click', () => classDetails.classList.add('hidden'));
        document.body.appendChild(classDetails);

        let classProps = classRenderElement.querySelector('.classProps');
        classProps.addEventListener('click', (e) => {
            classDetails.style.left = e.clientX + 'px';
            classDetails.style.top = e.clientY + 'px';
            classDetails.classList.remove('hidden');
        });
        classProps.addEventListener('touchdown', (e) => {
            classDetails.style.left = e.touches[0].clientX + 'px';
            potherClassProps.style.top = e.touches[0].clientY + 'px';
            classDetails.classList.remove('hidden');
        });

        TIMETABLE_DATA.DAY_WEEK_ELEMENTS[thu - 2].appendChild(classRenderElement);
        TIMETABLE_DATA.DAY_WEEK_CLASSES[thu - 2].push({ ...classs, div: classRenderElement });
    }
    addCacBuoiHoc_BuoiHoc(classs) {
        let cacBuoiHoc = classs['cacBuoiHoc'];
        if (!cacBuoiHoc) return;
        for (const buoiHoc of cacBuoiHoc) {
            let tuanHoc = buoiHoc['tuanHoc'];
            if (timeTableUtils.notHaveClassTime(tuanHoc)) {
                pageMessageService.addNotHaveTimeClass(classs);
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
                pageMessageService.addNotHaveTimeClass(classs);
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
                pageMessageService.addNotHaveTimeClass(classs);
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
        pageMessageService.clearNotificationQueue();
        timeTableCleaner.clearOnlyClassRenders();
        timeTableCleaner.clearAllClassDetails();

        let firstWeekDay = registerPreviewLocalStorageManager.getTermFirstWeekDay(term);
        for (const classs of classes) {
            timeTableRenderSerivce.addCacBuoiHoc_BuoiHoc(classs);
            timeTableRenderSerivce.addThiGiuaKi_NhomThi(classs, firstWeekDay);
            timeTableRenderSerivce.addThiCuoiKi_NhomThi(classs, firstWeekDay);
        }

        timeTableUtils.scanOverlapTimeClasses();
        pageMessageService.updateNumberMessages();
    }
}
export const timeTableRenderSerivce = new TimeTableRenderService();

//SECTION: REALTIME ==========================================================================================================================
//CAUTION tính theo tây chủ nhật là 0 thứ 2 là 1,...
class RealTimeService {
    updateCurrentWeek(term = '') {
        let firstWeekDay = registerPreviewLocalStorageManager.getTermFirstWeekDay(term);
        let result = dateUtils.calcCurrentWeek(firstWeekDay);
        registerPreviewLocalStorageManager.set('current-week', result);

        realTimeService.checkRealtime();
        return result;
    }
    checkRealtime() {
        if (weekService.getWeekPreviewValue() == registerPreviewLocalStorageManager.getCurrentWeek()) {
            RETURN_CURRENT_WEEK_BUTTON.style.display = 'none';
            realTimeService.show();
        } else {
            RETURN_CURRENT_WEEK_BUTTON.style.display = null;
            realTimeService.hide();
        }
    }
    renderDayWeek(tableElement, dayWeek) {
        tableElement.querySelector(`.dayOfWeek._${dayWeek}`)?.classList.add('currentDayWeek');
    }
    clearDayWeekRender(tableElement) {
        tableElement.querySelectorAll('.currentDayWeek').forEach((each) => each.classList.remove('currentDayWeek'));
    }
    show() {
        const realTimeRulerDiv = document.getElementById('renderRuler');
        realTimeService.renderDayWeek(RENDER_TABLE_TAG, dateUtils.toDayWeek_VN(new Date().getDay()));
        realTimeRulerDiv.style.display = null;
    }
    hide() {
        const realTimeRulerDiv = document.getElementById('renderRuler');
        realTimeService.clearDayWeekRender(RENDER_TABLE_TAG);
        realTimeRulerDiv.style.display = 'none';
    }
    start(rulerElement, CURRENT_NOW, dropHours, TABLE_ROW_HEIGHT = 23) {
        function repeat_update() {
            const HALF_RULER_HEIGHT = 1;

            let now = new Date();
            CURRENT_NOW.minute = now.getMinutes();
            CURRENT_NOW.hour = now.getHours();

            //EXPLAIN: riêng ngày thì phải check để clear currentDay cũ
            if (now.getDay() != CURRENT_NOW.dayweek) {
                CURRENT_NOW.dayweek = now.getDay();
                realTimeService.clearDayWeekRender(RENDER_TABLE_TAG);
                realTimeService.renderDayWeek(RENDER_TABLE_TAG, dateUtils.toDayWeek_VN(CURRENT_NOW.dayweek));
                realTimeService.updateCurrentWeek(termService.getTermPreviewValue()); //EXPLAIN: có thể đã chuyển tuần nên cần phải update
            }

            //SECTION: update ruler

            if (dropHours.has(CURRENT_NOW.hour)) return; //EXPLAIN: nếu out of range thì ngừng update
            let thu = dateUtils.toDayWeek_VN(CURRENT_NOW.dayweek);
            let hourOfDayElement = timeTableUtils.getHourOfDayElement(thu, CURRENT_NOW.hour);
            let top = hourOfDayElement.offsetTop + (CURRENT_NOW.minute / 60) * TABLE_ROW_HEIGHT - HALF_RULER_HEIGHT;

            rulerElement.style.top = `${top}px`;

            setTimeout(repeat_update, 60_000);
        }
        repeat_update();
    }
}
export const realTimeService = new RealTimeService();

function main() {
    let renderContainer = RENDER_TABLE_TAG.parentElement;
    //slide render table
    let deltaX = 0;
    let deltaY = 0;
    let positionX = 0;
    let positionY = 0;
    renderContainer.addEventListener('mousedown', onmousedown);

    //SECTION: mouse drag
    function onmousedown(e) {
        e = e || window.event;
        // e.preventDefault();

        if (!e.target.classList.contains('hourOfDay')) return;
        // get the mouse cursor position at startup:
        positionX = e.clientX;
        positionY = e.clientY;

        document.addEventListener('mouseup', onmouseup);
        document.addEventListener('mousemove', onmousemove);
    }
    function onmousemove(e) {
        e = e || window.event;
        e.preventDefault();
        // caculate delta from previos
        deltaX = e.clientX - positionX;
        deltaY = e.clientY - positionY;
        // calculate the new cursor position
        positionX = e.clientX;
        positionY = e.clientY;
        // set the element's new position
        renderContainer.scrollBy(-deltaX, -deltaY);
    }
    function onmouseup(_e) {
        // stop moving when mouse button is released:
        document.removeEventListener('mouseup', onmouseup);
        document.removeEventListener('mousemove', onmousemove);
    }

    let dropHours = new Set([]);
    timeTableRenderSerivce.initTable(dropHours, TABLE_ROW_HEIGHT);

    let now = new Date();
    const CURRENT_NOW = { dayweek: now.getDay(), hour: now.getHours(), minute: now.getMinutes() };
    const rulerElement = RENDER_TABLE_TAG.querySelector('#renderRuler');

    realTimeService.start(rulerElement, CURRENT_NOW, dropHours, TABLE_ROW_HEIGHT);

    TERM_PREVIEW_TAG.addEventListener('change', termService.updateWhenSwitchTermPreview);
    RETURN_CURRENT_WEEK_BUTTON.addEventListener('click', weekService.returnCurrentWeek);

    INPUT_MSSV_TAG.addEventListener('keydown', (e) => {
        if (e.key == 'Enter') {
            setTimeout(registerPreviewService.REGISTER_PREVIEW, 50);
        }
    });
    INPUT_CLASS_ID_TAG.addEventListener('keydown', (e) => {
        clearTimeout(USER_INPUT_TIMEOUT_HANDLER);
        USER_INPUT_TIMEOUT_HANDLER = setTimeout(async () => {
            let value = inputManager.getInputClassIdValue();
            if (value == '') return;
            if (e.key == 'Enter') {
                lopDangKyElementManager.addClassIdToContainer(value);
                inputManager.clearInputClassIdValue();
            } else if (value.length > 4) {
                queryService.getClassesGuess(value, termService.getTermPreviewValue(), (response) => {
                    if (response.code == 1) {
                        lopDangKyElementManager.clearGuessIdsContainer();
                        let classes = registerPreviewUtils.reformatClasses(response.data);
                        renderService.renderGuessIdsFromClasses(classes);
                    }
                });
            } else {
                lopDangKyElementManager.clearGuessIdsContainer();
            }
        }, 50);
    });

    document.querySelectorAll('.REGISTER-PREVIEW').forEach(function (each) {
        each.addEventListener('click', registerPreviewService.REGISTER_PREVIEW);
    });
    document.querySelectorAll('.toggleWeekPreview').forEach(function (each) {
        let value = each.getAttribute('data-value');
        each.addEventListener('mousedown', function () {
            weekService.updateWhenChangeWeekPreview(value);
        });
    });

    registerPreviewLocalStorageManager.init();
    registerPreviewService.updateTermsFromServer().then(realTimeService.checkRealtime);
}
main();
