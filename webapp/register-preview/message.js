'use strict';

const PAGE_MESSAGES_CONTENT_TAG = document.getElementById('pageMessagesContent');
const OPEN_PAGE_MESSAGES_TAG = document.getElementById('openPageMessages');
const CLOSE_PAGE_MESSAGES_TAG = document.getElementById('closePageMessages');

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

class PageMessageService {
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
        pageMessageService.updateNumberMessages();
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
        pageMessageService.addMessageWithListener(html);
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
        pageMessageService.addMessageWithListener(html);
    }
}
export const pageMessageService = new PageMessageService();
