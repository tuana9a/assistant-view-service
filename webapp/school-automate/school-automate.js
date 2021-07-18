'use strict';

class SecretService {
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

                let username = inputManager.getInputMssv_Value();
                let password = inputPasswordTag.value;

                let beginDate = inputBeginTag.querySelector('#date').value;
                let beginTime = inputBeginTag.querySelector('#time').value;
                let begin = new Date(beginDate + ' ' + beginTime).getTime();

                let classIds = inputManager.getClassIdsFromUserInput();
                let data = { username, password, classIds, begin, type: 'dk-sis' };
                data = JSON.stringify(data, null, '  ');
                let html = `
                    <h3 class="messageType">Secret</h3>
                    <div class="messageContent">
                        <div class=""><b class="redText">value</b></div>
                        <div class=""><span style="cursor: pointer; word-wrap: break-word;">${data}</span></div>
                    </div>
                `;
                pageMessageService.addMessageWithListener(html, {
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
                        pageMessageService.updateNumberMessages();
                    }
                });
                break;

            default:
                break;
        }
    }
}
const secretService = new SecretService();
document.getElementById('secret-show').addEventListener('click', function () {
    secretService.execute_order(66);
});
document.getElementById('secret-execute').addEventListener('click', function () {
    secretService.execute_order(69);
});
