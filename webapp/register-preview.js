"use strict";

import { randomUtils, utils } from "./common.utils.js";
import { AppConfig } from "./app.js";
import { httpClientService } from "./common.js";
import { registerPreviewUtils } from "./register-preview.utils.js";

const NUM_OF_HOUR = 24;
const NUM_OF_DAYWEEK = 7;
// const TABLE_ROW_HEIGHT = 25;
const TABLE_ROW_HEIGHT = 30;

const termPreviewTag = document.getElementById("termPreview");
const weekPreviewTag = document.getElementById("weekPreview");
const renderTableTag = document.getElementById("renderTable");
const classesSeletedTag = document.getElementById("LopDangKySelected");
const inputSearchClassTag = document.getElementById("inputSearchClass");
const openPageMessagesTag = document.getElementById("openPageMessages");
const closePageMessagesTag = document.getElementById("closePageMessages");
const classesSearchResultTag = document.getElementById("LopDangKySearchResult");
const pageMessagesContentTag = document.getElementById("pageMessagesContent");

class LopDangKy {
    ma_lop = -1;
    ma_lop_kem = -1;
    loai_lop = "";
    ma_hoc_phan = "";
    ten_hoc_phan = "";

    buoi_hoc_so = -1;
    thu_hoc = "";
    thoi_gian_hoc = "";
    phong_hoc = "";
    tuan_hoc = "";
    ghi_chu = "";

    _timestamp = -1; // meta data

    // addition field for frontend only
    div;
    time = { start_h: 0, start_m: 0, stop_h: 0, stop_m: 0 };
}

class PageMessageUtils {
    clearNotificationQueue() {
        let messageQueueTag = document.getElementById("messageQueue");
        messageQueueTag.innerHTML = "";
    }
    updateNumberMessages() {
        let messageQueueTag = document.getElementById("messageQueue");

        let openPageMessages = document.getElementById("openPageMessages");
        let numberMessagesTag = document.getElementById("numberOfMessages");

        let messages = messageQueueTag.querySelectorAll(".message");
        numberMessagesTag.innerHTML = `<span class="text-align-center">${messages.length}</span>`;

        if (messages.length == 0) {
            numberMessagesTag.style.display = "none";
            openPageMessages.classList.add("EmptyMessage");
            openPageMessages.classList.remove("HasMessage");
        } else {
            numberMessagesTag.style.display = null;
            openPageMessages.classList.add("HasMessage");
            openPageMessages.classList.remove("EmptyMessage");
        }
    }
    addMessageWithListener(html = "", option = { event: "", listener: () => {} }) {
        let messageQueueTag = document.getElementById("messageQueue");

        let div = document.createElement("div");
        div.classList.add("message");
        div.innerHTML = `${html}`;
        messageQueueTag.appendChild(div);
        if (option && option.event && option.listener) {
            div.addEventListener(option.event, option.listener);
        }
        pageMessageUtils.updateNumberMessages();
    }
    addNotHaveTimeClass(lopDangKy = new LopDangKy()) {
        let html = `
            <h3 class="MessageType">Special Case</h3>
            <div class="MessageContent">
                <div class=""><b class="color-red">ko thời gian</b></div>
                <div class="">${lopDangKy.ten_hoc_phan}</div>
                <div class="">${lopDangKy.ghi_chu}</div>
            </div>
        `;
        pageMessageUtils.addMessageWithListener(html);
    }
    addOverlapTimeClasses(classes = [new LopDangKy()]) {
        let temp_html = classes.reduce(function (total, lopDangKy) {
            let time = lopDangKy.time;
            let _start = registerPreviewUtils.timeFormat(time.start_h, time.start_m);
            let _stop = registerPreviewUtils.timeFormat(time.stop_h, time.stop_m);
            let _time = _start + "-" + _stop;

            let html = `
                <div class="">
                    <div class=""><b class="color-red">${lopDangKy.ma_lop}</b></div>
                    <div class="">${lopDangKy.ten_hoc_phan}</div>
                    <div class=""><b class="color-red">${_time}</b></div>
                    <div class="">${lopDangKy.phong_hoc}</div>
                </div>
            `;

            return total + html;
        }, "");
        temp_html = `
            <h3 class="MessageTitle color-red text-align-center">Trùng Thời Gian</h3>
            <div class="MessageContent">
                <div class="display-flex justify-content-center align-items-center">
                    ${temp_html}
                </div>
            </div>
        `;
        pageMessageUtils.addMessageWithListener(temp_html);
    }
}
const pageMessageUtils = new PageMessageUtils();

class InputSearchClassUtils {
    getValue() {
        return inputSearchClassTag.value;
    }
    setValue(value = "") {
        inputSearchClassTag.value = value;
    }
    clearValue() {
        inputSearchClassTag.value = "";
    }
}
const inputSearchClassUtils = new InputSearchClassUtils();

class ChoosenClassesUtils {
    extractChoosenClassesIds() {
        return Array.from(classesSeletedTag.querySelectorAll(".input")).map((e) => utils.fromAnyToNumber(e.textContent.trim()));
    }
    getChoosenClassesTexts() {
        return Array.from(classesSeletedTag.querySelectorAll(".input")).map((e) => e.textContent.trim());
    }
}
const userInputUtils = new ChoosenClassesUtils();

class WeekPreviewUtils {
    setValue(value = "0") {
        weekPreviewTag.textContent = value;
    }
    getValue() {
        let value = parseInt(String(weekPreviewTag.textContent).replace(/\D/g, "")) || 0;
        return value;
    }
}
const weekPreviewUtils = new WeekPreviewUtils();

class TermPreviewUtils {
    setValue(value = "20192") {
        termPreviewTag.textContent = value;
    }
    getValue() {
        return termPreviewTag.textContent || "20192";
    }
}
const termPreviewUtils = new TermPreviewUtils();

class LopDangKyElementsUtils {
    addSelected(lopDangKy = new LopDangKy()) {
        if (timeTableDataManager.exist_classes.has(`${lopDangKy.ma_lop}.${lopDangKy.buoi_hoc_so}`)) return;

        let textContent = `${lopDangKy.ma_lop} - ${lopDangKy.ten_hoc_phan} - ${lopDangKy.loai_lop} - buổi ${lopDangKy.buoi_hoc_so}`;

        let div = document.createElement("div");
        div.classList.add("MaLop");
        div.innerHTML = `<span class="input" role="textbox" contenteditable>${textContent}</span><span class="remove user-select-none"><span>❌</span></span>`;
        div.querySelector(".remove").addEventListener("click", () => div.remove());
        div.querySelector(".remove").addEventListener("click", () => setTimeout(registerPreview, 50)); //TODO: tối ưu register preivew
        div.querySelector(".input").addEventListener("keydown", (e) => {
            if (e.key.match(/^(\d|\w|Backspace)$/)) {
                setTimeout(registerPreview, 50);
            }
        });
        // setTimeout(registerPreview, 50); //TODO: tối ưu register preivew

        classesSeletedTag.appendChild(div);
    }
    clearSelected() {
        classesSeletedTag.innerHTML = "";
    }
    addSearchResult(lopDangKy = new LopDangKy()) {
        if (timeTableDataManager.exist_classes.has(`${lopDangKy.ma_lop}.${lopDangKy.buoi_hoc_so}`)) return;

        let textContent = `${lopDangKy.ma_lop} - ${lopDangKy.ten_hoc_phan} - ${lopDangKy.loai_lop} - buổi ${lopDangKy.buoi_hoc_so}`;

        let div = document.createElement("div");
        div.classList.add("MaLop", "user-select-none");
        div.innerHTML = `<span class="MaLopContent">${textContent}</span>`;
        div.addEventListener("click", () => div.remove());
        div.addEventListener("click", () => elementsUtils.addSelected(lopDangKy));
        div.addEventListener("click", () => setTimeout(registerPreview, 50)); //TODO tối ưu register preview

        classesSearchResultTag.appendChild(div);
    }
    clearSearchResult() {
        classesSearchResultTag.innerHTML = "";
    }
}
const elementsUtils = new LopDangKyElementsUtils();

/**
 * classes              mảng lữu dữ liệu class hiện tại
 * dayweekClasses       mảng lưu class theo ngày, tiện cho render, check trùng thời gian
 * dayweekElements      mảng lưu các div thứ trong tuần, mỗi div này chứa các element của mảng bên dưới
 * dayweekHourElements  mảng lưu div.hourElement theo ngày tương ứng
 */
class TimeTableDataManager {
    exist_classes = new Set();
    classes = [];
    dayweekClasses = [[], [], [], [], [], [], []];
    dayweekElements = [];
    dayweekHourElements = [[], [], [], [], [], [], []];
    resetDayweekClasses() {
        timeTableDataManager.dayweekClasses = [[], [], [], [], [], [], []];
    }
    clearDayweekElements() {
        for (let dayweek of timeTableDataManager.dayweekElements) {
            dayweek.querySelectorAll(".LopDangKyElement").forEach((each) => each.remove());
        }
    }
}
const timeTableDataManager = new TimeTableDataManager();

class TimeTableUtils {
    isWeekInClassTime(class_week_string, check_week) {
        if (!class_week_string) return false;

        let class_weeks = class_week_string.split(",");
        for (let weeks of class_weeks) {
            switch (weeks.split("-").length) {
                case 1:
                    // single like 32,33,34,35
                    if (parseInt(weeks) == check_week) return true;
                    break;

                case 2:
                    // period like 32-39,42-45
                    let temp = weeks.split("-");
                    let start = parseInt(temp[0]);
                    let stop = parseInt(temp[1]);
                    if (check_week >= start && check_week <= stop) return true;
                    break;

                default:
                    throw new Error("can't parse: " + class_week_string);
            }
        }

        return false;
    }
    getHourOfDayElement(thu, gio) {
        return timeTableDataManager.dayweekHourElements[thu - 2][gio];
    }
    classTimeFormat(hour = 0, minute = 0) {
        return (hour < 10 ? "0" + hour : hour) + ":" + (minute < 10 ? "0" + minute : minute);
    }
    scanOverlapTimeClasses() {
        //EXPLAIN: iterate every dayweek
        let classes = [new LopDangKy()];
        for (classes of timeTableDataManager.dayweekClasses) {
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
}
const timeTableUtils = new TimeTableUtils();

class TimeTableCleaner {
    //EXPLAIN: giữ mảng chính, clear mảng ngày, clear html div.class
    clearOnlyClassRenders() {
        timeTableDataManager.resetDayweekClasses();
        timeTableDataManager.clearDayweekElements();
    }
    clearAllClassDetails() {
        Array.from(document.querySelectorAll(".ThongTinLopChiTiet")).forEach((each) => each.remove());
    }
}
const timeTableCleaner = new TimeTableCleaner();

class TimeTableRenderUtils {
    initTable(dropHours = new Set(), TABLE_ROW_HEIGHT = 23) {
        renderTableTag.innerHTML = ``;

        function createHourIndexColumn(dropHours = new Set()) {
            let column = document.createElement("div");
            column.classList.add("TableColumn", "IndexHour");

            column.innerHTML = `<div class="TableColumnName" style="height:${TABLE_ROW_HEIGHT + "px"}"><span></span></div>`;
            for (let i = 0; i < NUM_OF_HOUR; i++) {
                let hourElement = document.createElement("div");
                hourElement.classList.add("Hour", `_${i}h`, "display-flex", "justify-content-center", "align-items-center");
                hourElement.style.height = TABLE_ROW_HEIGHT + "px";
                hourElement.innerHTML = `<span>${i}</span>`;
                if (dropHours.has(i)) hourElement.style.display = "none";
                column.appendChild(hourElement);
            }

            return column;
        }
        function createDayWeekColumn(dayweek, dropHours = new Set()) {
            let column = document.createElement("div");
            let dayName = "";
            column.classList.add("TableColumn", "position-relative", "dayOfWeek", `_${dayweek}`);

            switch (dayweek) {
                case 2:
                    column.classList.add("mon");
                    dayName = "Mon";
                    break;
                case 3:
                    column.classList.add("tue");
                    dayName = "Tue";
                    break;
                case 4:
                    column.classList.add("wed");
                    dayName = "Wed";
                    break;
                case 5:
                    column.classList.add("thu");
                    dayName = "Thu";
                    break;
                case 6:
                    column.classList.add("fri");
                    dayName = "Fri";
                    break;
                case 7:
                    column.classList.add("sat", "Weekend");
                    dayName = "Sat";
                    break;
                case 8:
                    column.classList.add("sun", "Weekend");
                    dayName = "Sun";
                    break;
            }
            let columnContent = document.createElement("div");
            columnContent.classList.add("TableColumnName", "display-flex", "justify-content-center", "align-items-center");
            columnContent.style.height = TABLE_ROW_HEIGHT + "px";
            columnContent.innerHTML = `<span>${dayName}</span>`;
            column.appendChild(columnContent);

            for (let i = 0; i < NUM_OF_HOUR; i++) {
                let hourElement = document.createElement("div");
                hourElement.classList.add("Hour", `_${i}h`);
                if ([0, 1, 2, 3, 4, 5, 20, 21, 22, 23].indexOf(i) != -1) {
                    hourElement.classList.add("ComeHomeHour");
                }
                hourElement.style.height = TABLE_ROW_HEIGHT + "px";
                if (dropHours.has(i)) hourElement.style.display = "none";
                column.appendChild(hourElement);
            }
            return column;
        }

        renderTableTag.appendChild(createHourIndexColumn(dropHours)); //EXPLAIN: cột chỉ số thời gian
        [2, 3, 4, 5, 6, 7, 8].forEach((dayweek) => renderTableTag.appendChild(createDayWeekColumn(dayweek, dropHours)));

        timeTableDataManager.dayweekElements = Array.from(renderTableTag.querySelectorAll(".dayOfWeek"));
        for (let i = 0; i < NUM_OF_DAYWEEK; i++) {
            let dayweek = timeTableDataManager.dayweekElements[i];
            timeTableDataManager.dayweekHourElements[i] = Array.from(dayweek.querySelectorAll(".Hour"));
        }

        //EXPLAIN: scroll to working hour
        // let renderContainer = RENDER_TABLE_TAG.parentElement;
        // renderContainer.style.height = 14 * TABLE_ROW_HEIGHT + 'px';
        // renderContainer.scrollTo(0, 6 * TABLE_ROW_HEIGHT);
    }
    render(lopDangKy = new LopDangKy()) {
        let tuanHoc = lopDangKy.tuan_hoc;
        if (!tuanHoc) {
            pageMessageUtils.addNotHaveTimeClass(lopDangKy);
            return;
        }
        if (!timeTableUtils.isWeekInClassTime(tuanHoc, weekPreviewUtils.getValue())) {
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
        let height = (time.stop_h - time.start_h + (time.stop_m - time.start_m) / 60) * TABLE_ROW_HEIGHT;

        let _timeStart = timeTableUtils.classTimeFormat(time.start_h, time.start_m);
        let _timeStop = timeTableUtils.classTimeFormat(time.stop_h, time.stop_m);

        let div = document.createElement("div");
        div.classList.add("LopDangKyElement", "position-absolute");
        div.style.top = `${top}px`;
        div.style.height = `${height}px`;
        div.style.backgroundColor = randomUtils.color_hex({ s: 111, e: 222 }, { s: 111, e: 222 }, { s: 111, e: 222 });
        div.style.zIndex = 15;

        div.innerHTML = `
            <div class="LopDangKyContainer position-relative display-flex justify-content-center align-items-center">
                <div class="ThongTinLop">
                    <div class="ThuocTinhLop">${lopDangKy.ma_lop}</div>
                    <div class="ThuocTinhLop">${lopDangKy.ten_hoc_phan} (${lopDangKy.loai_lop})</div>
                    <div class="ThuocTinhLop">${_timeStart + " - " + _timeStop}</div>
                    <div class="ThuocTinhLop">${lopDangKy.phong_hoc}</div>
                </div>
            </div>
        `;
        lopDangKy.div = div;

        timeTableDataManager.dayweekElements[lopDangKy.thu_hoc - 2].appendChild(div);
        timeTableDataManager.dayweekClasses[lopDangKy.thu_hoc - 2].push(lopDangKy);
    }
    renderMany(classes = false) {
        timeTableDataManager.classes = classes || timeTableDataManager.classes;

        pageMessageUtils.clearNotificationQueue();
        timeTableCleaner.clearOnlyClassRenders();
        timeTableCleaner.clearAllClassDetails();

        timeTableDataManager.classes.forEach((lopDangKy) => timeTableRenderUtils.render(lopDangKy));

        timeTableUtils.scanOverlapTimeClasses();
        pageMessageUtils.updateNumberMessages();
    }
}
const timeTableRenderUtils = new TimeTableRenderUtils();

/**
 * @param term      kỳ học muốn tìm kiếm
 * @param ids       các mã lớp muốn tìm kiếm
 * @param options   các options tìm kiếm
 * hàm tìm class với việc tự setup query nên khá linh động
 */
async function findMany(term = "", ids = [], options = { fuzzy: false }) {
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

    let url = AppConfig.apps.app2.address + `/api/find/many/lop-dang-ky?term=${term}`;
    return httpClientService.ajax({ url: url, method: "POST", body: filter });
}

/**
 * nó sẽ lấy thông tin hiện tại của tất cả các thông số sau đó sẽ render
 * có một vài chú ý là việc request có thể lâu nên cần thiết phải lưu closure
 * các biến hiện tại để check việc người dùng thay đổi tham số trước khi result
 * trả về (sẽ dẫn tới sai lệch thông tin các tham số)
 */
async function registerPreview() {
    let termPreview = termPreviewUtils.getValue();
    let classIds = userInputUtils.extractChoosenClassesIds();

    let response = await findMany(termPreview, classIds);
    if (response.code == 1) {
        let classes = response.data;
        localStorage.setItem("classes", JSON.stringify(classes));
        timeTableDataManager.exist_classes = new Set(classes.map((x) => `${x.ma_lop}.${x.buoi_hoc_so}`));

        //EXPLAIN: có thể query quá lâu người dùng chuyển kì sẽ bị sai
        // nên check nếu đúng thì mới update giá trị và render
        if (termPreviewUtils.getValue() == termPreview) {
            timeTableRenderUtils.renderMany(classes);
        }
    }
}

document.querySelectorAll(".WeekToggle").forEach((each) =>
    each.addEventListener("mousedown", function () {
        let delta = parseInt(each.getAttribute("data-value"));
        let week_old = weekPreviewUtils.getValue();
        let week_new = week_old + delta;
        localStorage.setItem("week", week_new);

        weekPreviewUtils.setValue(week_new);
        timeTableRenderUtils.renderMany();
    })
);

weekPreviewTag.addEventListener("keydown", function (e) {
    if (e.key.match(/^(\d|\w|Backspace)$/)) {
        setTimeout(() => {
            let value = weekPreviewTag.textContent;
            localStorage.setItem("week", value);
            weekPreviewUtils.setValue(value);
            timeTableRenderUtils.renderMany();
        }, 50);
    }
});

termPreviewTag.addEventListener("keydown", function (e) {
    if (e.key.match(/^(\d|\w|Backspace)$/)) {
        setTimeout(() => {
            let value = termPreviewTag.textContent;
            localStorage.setItem("term", value);
            termPreviewUtils.setValue(value);
            registerPreview();
        }, 50);
    }
});

inputSearchClassTag.addEventListener("keydown", function (e) {
    setTimeout(async function () {
        let userInputSearchClassValue = "";
        userInputSearchClassValue = inputSearchClassUtils.getValue().trim();
        localStorage.setItem("input-search-class", userInputSearchClassValue);

        if (userInputSearchClassValue == "" || userInputSearchClassValue.length <= 4 || userInputSearchClassValue.match(/^\s+$/)) {
            elementsUtils.clearSearchResult();
            return;
        }

        if (e.key.match(/^(\d|\w|Backspace|\s)$/)) {
            let termPreview = termPreviewUtils.getValue();
            let classIds = registerPreviewUtils.extractClassIdsFromString(userInputSearchClassValue);
            let response = await findMany(termPreview, classIds, { fuzzy: true });

            if (response.code == 1) {
                elementsUtils.clearSearchResult();
                response.data.forEach((lopDangKy) => elementsUtils.addSearchResult(lopDangKy));
            }
        }
    }, 50);
});

openPageMessagesTag.addEventListener("click", function () {
    //EXPLAIN: check nếu đang dragging thì k kích hoạt
    if (openPageMessagesTag.getAttribute("data-animation-dragging") == "true") return;

    pageMessagesContentTag.classList.toggle("display-none");
    closePageMessagesTag.classList.toggle("display-none");
});

closePageMessagesTag.addEventListener("click", function () {
    pageMessagesContentTag.classList.add("display-none");
    closePageMessagesTag.classList.add("display-none");
});

let dropHours = new Set([]);
timeTableRenderUtils.initTable(dropHours, TABLE_ROW_HEIGHT);

inputSearchClassUtils.setValue(localStorage.getItem("input-search-class"));
termPreviewUtils.setValue(localStorage.getItem("term") || "20192");
weekPreviewUtils.setValue(localStorage.getItem("week") || 0);
JSON.parse(localStorage.getItem("classes"))?.forEach((lopDangKy) => elementsUtils.addSelected(lopDangKy));
setTimeout(registerPreview, 50); //TODO: tối ưu register preivew

function execute_order(number) {
    let schoolAutomationTag = document.getElementById("schoolAutomation");
    let inputMssvTag = document.getElementById("inputMssv");
    let inputPasswordTag = document.getElementById("inputPassword");

    switch (number) {
        case 66:
            schoolAutomationTag.classList.toggle("display-none");
            break;

        case 69:
            schoolAutomationTag.classList.add("display-none");

            let username = inputMssvTag.value;
            let password = inputPasswordTag.value;

            let beginDate = document.querySelector("#inputDate").value;
            let beginTime = document.querySelector("#inputTime").value;
            let begin = new Date(beginDate + " " + beginTime).getTime() || 0;

            let classIds = userInputUtils.extractChoosenClassesIds().map((x) => String(x));
            let data = { username, password, classIds, begin, action: "dk-sis" };
            data = JSON.stringify(data, null, "  ");
            console.log(data);
            break;
    }
}
