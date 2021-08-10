'use strict';

import { httpClientService } from './common.js';

const TERMINAL_GLOBAL_VARIABLES_TAG = document.getElementById('global-variables');
const TERMINAL_COMMAND_PREVIEW_TAG = document.getElementById('comand-preview');
const TERMINAL_TYPING_CONTENT_TAG = document.getElementById('typing-content');
const TERMINAL_AUTO_COMPLETE_TAG = document.getElementById('auto-complete');
const TERMINAL_PARAMS_GUIDE_TAG = document.getElementById('params-guide');
const TERMINAL_VERSION_TAG = document.getElementById('terminal-version');
const TERMINAL_SCREEN_TAG = document.getElementById('terminal-screen');

export const TERMINAL_GLOBAL_VARIABLES = { term: '20192', file: false };
const TERMINAL_PROMPT_HANDLER = { timeout: {}, execute: {} };
const TERMINAL_COMMAND_TREE = {};

class Terminal {
    add_command(tree, execute, params, prompt) {
        let parts = tree.split(/\s+/);
        let lastIndex = parts.length - 1;
        let index = 0;
        let pointer = TERMINAL_COMMAND_TREE;
        while (index <= lastIndex) {
            let part = parts[index];
            if (pointer[`${part}`] == undefined) pointer[`${part}`] = {};
            pointer = pointer[`${part}`];
            index++;
        }
        pointer.execute = execute;
        pointer.executeName = execute.name;
        pointer.params = params;
        pointer.prompt = prompt;
    }
    get_command(tree = '') {
        function scanSubCommand(command) {
            let results = [];
            for (let key in command) {
                results.push(key);
            }
            return results;
        }
        try {
            if (tree == '') {
                return scanSubCommand(TERMINAL_COMMAND_TREE);
            }

            let parts = tree.split(/\s+/);
            let lastIndex = parts.length - 1;
            let index = 0;
            let pointer = TERMINAL_COMMAND_TREE;

            while (index <= lastIndex && !pointer.execute) {
                let part = parts[index];
                pointer = pointer[`${part}`];
                index++;
            }

            if (pointer.execute) return pointer;
            return scanSubCommand(pointer);
        } catch (e) {
            return undefined;
        }
    }

    set_typing_value(value = '') {
        TERMINAL_TYPING_CONTENT_TAG.value = value;
    }
    get_typing_value() {
        return TERMINAL_TYPING_CONTENT_TAG.value.replace(/\s+/g, ' ');
    }

    /**
     * hàm này add message từ admin gõ vào lệnh
     */
    append_message(value = '') {
        let div = document.createElement('div');
        div.classList.add('typed', 'noSelect');
        div.innerHTML = `<span class="time">${terminalUtils.now()}</span><span class="content">${value}</span>`;
        let content = div.querySelector('.content');
        content.addEventListener('click', (e) => {
            terminal.set_typing_value(content.textContent);
        });
        content.addEventListener('dblclick', (e) => {
            e.preventDefault();
            let textContent = content.textContent;
            terminal.append_message(textContent);
            setTimeout(() => terminal.execute(textContent), 50);
        });
        TERMINAL_SCREEN_TAG.appendChild(div);
        TERMINAL_SCREEN_TAG.scrollTo(0, TERMINAL_SCREEN_TAG.scrollHeight);
    }

    /**
     * hàm này add response từ hệ thống, request, ...
     */
    append_response(message, space = null) {
        if (typeof message == 'object') message = JSON.stringify(message, null, space);
        let div = document.createElement('div');
        div.classList.add('response');
        div.innerHTML = `<pre class="content">${message}</pre><span class="time">${terminalUtils.now()}</span>`;
        TERMINAL_SCREEN_TAG.appendChild(div);
        TERMINAL_SCREEN_TAG.scrollTo(0, TERMINAL_SCREEN_TAG.scrollHeight);
    }
    append_response_json(message = {}) {
        terminal.append_response(message, '\t');
    }

    execute(command = '') {
        switch (command.toLocaleUpperCase()) {
            case 'Y':
                TERMINAL_PROMPT_HANDLER.execute();
                clearTimeout(TERMINAL_PROMPT_HANDLER.timeout);
                terminal.reset_prompt();
                return;
            case 'N':
                clearTimeout(TERMINAL_PROMPT_HANDLER.timeout);
                terminal.reset_prompt();
                return;
        }

        let parts = command.split(/\s+/);
        try {
            let paramIndex;
            let tree = '';
            let pointer = TERMINAL_COMMAND_TREE;
            for (paramIndex = 0; !pointer.execute; paramIndex++) {
                let part = parts[paramIndex];
                pointer = pointer[`${part}`];
                tree += part + ' ';
            }

            let paramValues = parts.filter((e, i) => i >= paramIndex);
            let paramModels = pointer.params;

            paramIndex = 0;
            for (let key in paramModels) {
                let value = paramValues[paramIndex];
                if (!value) paramValues[paramIndex] = TERMINAL_GLOBAL_VARIABLES[`${key}`];
                paramIndex++;
            }

            let prompt = pointer.prompt;
            if (prompt) {
                terminal.prompt_execute(tree, paramModels, paramValues, prompt.timeout);
                TERMINAL_PROMPT_HANDLER.execute = () => pointer.execute.apply(null, paramValues);
                TERMINAL_PROMPT_HANDLER.timeout = setTimeout(TERMINAL_PROMPT_HANDLER.execute, prompt.timeout);
                return;
            }

            pointer.execute.apply(null, paramValues);
        } catch (e) {
            terminal.append_response(`Can't execute: ${command}`);
        }
    }

    reset_prompt() {
        TERMINAL_PROMPT_HANDLER.timeout = {};
        TERMINAL_PROMPT_HANDLER.execute = console.log;
    }
    prompt_execute(tree = '', paramModels = {}, paramValues = [], timeout) {
        let paramIndex = 0;
        let preview = tree.trim() + '<br>';

        for (let key in paramModels) {
            let value = paramValues[paramIndex];
            let name = key;
            let type = paramModels[`${name}`].type;

            if (type == 'file') value = value.name;
            preview += `- <span class="redText">${name}</span> = <span class="redText">${value}</span><br>`;

            paramIndex++;
        }

        preview = preview.trim() + `(<b class="yes-no">Y</b>|<b class="yes-no">N</b>)? (${timeout}ms)`;

        let div = document.createElement('div');
        div.classList.add('prompt', 'dadFlexCenter', 'noSelect');
        div.innerHTML = `<span class="content">${preview}</span>`;
        Array.from(div.querySelectorAll('.yes-no')).forEach((each) => {
            each.addEventListener('click', () => {
                let textContent = each.textContent;
                terminal.append_message(textContent);
                terminal.execute(textContent);
            });
        });

        TERMINAL_SCREEN_TAG.appendChild(div);
        TERMINAL_SCREEN_TAG.scrollTo(0, TERMINAL_SCREEN_TAG.scrollHeight);
    }

    show_global_variables() {
        let innerHTML = '';
        for (let key in TERMINAL_GLOBAL_VARIABLES) {
            let value = terminal.get_global_variable(key);
            innerHTML += `<span class="variable"><span class="name">${key}</span><span class="value">${value}</span></span>`;
        }
        TERMINAL_GLOBAL_VARIABLES_TAG.innerHTML = innerHTML;
    }
    get_global_variable(name) {
        if (name == 'file') return TERMINAL_GLOBAL_VARIABLES.file.name;
        return TERMINAL_GLOBAL_VARIABLES[`${name}`];
    }

    selected_auto_complete_index = -1;

    set_command_preview(value = '') {
        TERMINAL_COMMAND_PREVIEW_TAG.textContent = value;
    }
    clear_command_preview() {
        TERMINAL_COMMAND_PREVIEW_TAG.textContent = '';
    }

    gen_params_guide(executeName, params = {}) {
        TERMINAL_PARAMS_GUIDE_TAG.style.display = null;
        let paramsHTML = '';
        for (let key in params) {
            let param = params[`${key}`];

            if (param.value && param.next) {
                paramsHTML += `<span class="redText">${key}</span> = <span class="whiteText">${param.value}</span>, `;
            } else if (param.next) {
                paramsHTML += `<span class="redText">${key}</span> : <span class="whiteText">${param.type}</span>, `;
            } else if (param.value) {
                paramsHTML += `<span class="">${key}</span> = <span class="whiteText">${param.value}</span>, `;
            } else {
                paramsHTML += `<span class="">${key}</span> : <span class="whiteText">${param.type}</span>, `;
            }
        }
        paramsHTML = paramsHTML.trim().slice(0, -1);

        TERMINAL_PARAMS_GUIDE_TAG.innerHTML = `<span class="executeName">${executeName}</span>(${paramsHTML})`;
    }
    clear_params_guide() {
        TERMINAL_PARAMS_GUIDE_TAG.innerHTML = '';
        TERMINAL_PARAMS_GUIDE_TAG.style.display = 'none';
    }

    gen_auto_complete(command = '') {
        terminal.clear_params_guide();
        terminal.clear_auto_complete();

        if (command.match(/^\s*$/)) return;

        let parts = command.split(/\s+/);
        let lastIndex = parts.length - 1;

        try {
            let pointer = TERMINAL_COMMAND_TREE;
            let paramIndex = 0;

            let currentCommand = '';
            while (paramIndex < lastIndex && !pointer.execute) {
                let part = parts[paramIndex];
                pointer = pointer[`${part}`];
                currentCommand += part + ' ';
                paramIndex++;
            }

            if (pointer.execute) {
                let nextParamIndex = lastIndex - paramIndex;
                let paramModels = JSON.parse(JSON.stringify(pointer.params));
                let i = 0;

                for (let key in paramModels) {
                    let param = paramModels[`${key}`];

                    if (i == nextParamIndex) param.next = true;
                    let value = '';

                    if (param.type == '...any') {
                        param.next = true;
                        value = parts
                            .filter((e, i) => i >= paramIndex)
                            .reduce((t, e) => t + e + ' ', '')
                            .trim();
                    } else {
                        value = parts[paramIndex + i];
                    }

                    if (value) {
                        param.value = value;
                    } else {
                        param.value = terminal.get_global_variable(key);
                    }
                    ++i;
                }

                terminal.gen_params_guide(pointer.executeName, paramModels);
                return;
            }

            let lastPart = parts[lastIndex];
            let regex = new RegExp('^' + lastPart);
            for (let subCommand in pointer) {
                if (subCommand.match(regex)) {
                    let div = document.createElement('div');
                    div.classList.add('entry', 'dadFlexCenterVer');
                    div.addEventListener('click', () => {
                        terminal.set_typing_value(div.textContent);
                        terminal.clear_auto_complete();
                    });
                    let value = (currentCommand + subCommand).trim().replace(/\s+/g, ' ');
                    div.innerHTML = `<span class="cursor"></span><span class="value">${value}</span>`;
                    TERMINAL_AUTO_COMPLETE_TAG.appendChild(div);
                }
            }
        } catch (e) {
            // console.error(e);
        }
    }
    clear_auto_complete() {
        TERMINAL_AUTO_COMPLETE_TAG.innerHTML = '';
        terminal.clear_command_preview();
    }

    toggle_selecting_auto_complete() {
        let entries = Array.from(TERMINAL_AUTO_COMPLETE_TAG.querySelectorAll('.entry'));
        let maxIndex = Math.max(0, entries.length - 1);
        let minIndex = 0;
        if (terminal.selected_auto_complete_index > maxIndex) {
            terminal.selected_auto_complete_index = maxIndex;
        } else if (terminal.selected_auto_complete_index < minIndex) {
            terminal.selected_auto_complete_index = minIndex;
        }

        entries.forEach((entry, index) => {
            if (index == terminal.selected_auto_complete_index) {
                entry.classList.add('selected');

                let childStart = entry.offsetTop;
                let childEnd = childStart + parseFloat(getComputedStyle(entry).height);

                let dadStart = TERMINAL_AUTO_COMPLETE_TAG.scrollTop;
                let dadEnd = dadStart + parseFloat(getComputedStyle(TERMINAL_AUTO_COMPLETE_TAG).height);

                if (childStart < dadStart) {
                    TERMINAL_AUTO_COMPLETE_TAG.scrollBy(0, childStart - dadStart);
                } else if (childEnd > dadEnd) {
                    TERMINAL_AUTO_COMPLETE_TAG.scrollBy(0, childEnd - dadEnd);
                }

                terminal.set_command_preview(entry.textContent);
            } else {
                entry.classList.remove('selected');
            }
        });
    }
    /**
     * hàm này lấy giá trị đang select của auto complete và nhét vào typing value
     */
    fetch_selecting_auto_complete() {
        let entry = TERMINAL_AUTO_COMPLETE_TAG.querySelectorAll('.entry')[terminal.selected_auto_complete_index];
        if (entry) {
            terminal.set_typing_value(entry.textContent.trim());
        }
    }
}
export const terminal = new Terminal();

class TerminalUtils {
    now() {
        let now = new Date();
        let hour = now.getHours();
        let minute = now.getMinutes();
        let second = now.getSeconds();

        hour = hour < 10 ? '0' + hour : hour;
        minute = minute < 10 ? '0' + minute : minute;
        second = second < 10 ? '0' + second : second;
        return hour + ':' + minute + ':' + second;
    }
}
export const terminalUtils = new TerminalUtils();

function init_terminal() {
    terminal.show_global_variables();
    let isAutoCompleteSelecting = false;

    TERMINAL_TYPING_CONTENT_TAG.addEventListener('keydown', (e) => {
        let command = terminal.get_typing_value();

        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (isAutoCompleteSelecting) {
                    terminal.fetch_selecting_auto_complete();
                    isAutoCompleteSelecting = false;
                    return;
                }
                terminal.clear_auto_complete();
                terminal.clear_params_guide();

                TERMINAL_TYPING_CONTENT_TAG.value = '';
                if (command.match(/^\s*$/)) return;

                terminal.append_message(command);
                terminal.execute(command);
                break;

            case 'Tab':
                e.preventDefault();
                isAutoCompleteSelecting = false;
                terminal.fetch_selecting_auto_complete();
                break;

            case 'ArrowDown':
                e.preventDefault();
                isAutoCompleteSelecting = true;
                terminal.selected_auto_complete_index++;
                setTimeout(terminal.toggle_selecting_auto_complete, 0);
                break;

            case 'ArrowUp':
                e.preventDefault();
                isAutoCompleteSelecting = true;
                terminal.selected_auto_complete_index--;
                setTimeout(terminal.toggle_selecting_auto_complete, 0);
                break;

            default:
                isAutoCompleteSelecting = false;
                setTimeout(() => {
                    let command = terminal.get_typing_value();
                    terminal.gen_auto_complete(command);
                    terminal.toggle_selecting_auto_complete();
                }, 0);
                break;
        }
    });
    TERMINAL_GLOBAL_VARIABLES_TAG.addEventListener('mousedown', (e) => {
        e.preventDefault();
        TERMINAL_TYPING_CONTENT_TAG.focus();
    });

    window.addEventListener('drop', (e) => {
        e.preventDefault();

        let dropedFile = e.dataTransfer.files[0];
        TERMINAL_GLOBAL_VARIABLES.file = dropedFile;
        terminal.append_message('Drop File: ' + dropedFile.name);

        terminal.show_global_variables();
    });
    window.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
}
httpClientService.ajax({ url: '/terminal.version.txt', method: 'GET' }, function (data) {
    if (data) TERMINAL_VERSION_TAG.innerText = data;
});
setTimeout(init_terminal, 0);
