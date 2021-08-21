'use strict';

import { httpClientService } from './common.js';

const SCREEN_TAG = document.getElementById('terminal-screen');
const VERSION_TAG = document.getElementById('terminal-version');
const PARAMS_GUIDE_TAG = document.getElementById('terminal-args-guide');
const AUTO_COMPLETE_TAG = document.getElementById('terminal-auto-complete');
const ENV_VARIABLES_TAG = document.getElementById('terminal-env-variables');
const TYPING_CONTENT_TAG = document.getElementById('terminal-typing-content');
const COMMAND_PREVIEW_TAG = document.getElementById('terminal-command-preview');

const ENV_VARIABLES = { term: '20192', file: false };
const COMMAND_PATHS = {};

class CommandModel {
    bin = '';
    args = {};
    execute(...args) {}
}

class Terminal {
    add_command(command = new CommandModel()) {
        COMMAND_PATHS[command.bin] = command;
    }
    get_command(bin = '') {
        let pointer = COMMAND_PATHS[bin];
        return pointer;
    }

    set_typing_value(value = '') {
        TYPING_CONTENT_TAG.value = value;
    }
    get_typing_value() {
        return TYPING_CONTENT_TAG.value.replace(/\s+/g, ' ');
    }

    append_command(value = '') {
        let div = document.createElement('div');
        div.classList.add('typed', 'noSelect');
        div.innerHTML = `<span class="time">${terminalUtils.prefix_now()}</span><span class="content">${value}</span>`;
        SCREEN_TAG.appendChild(div);
        SCREEN_TAG.scrollTo(0, SCREEN_TAG.scrollHeight);
    }

    append_response(message = {}, options = { json: false }) {
        if (options.json) {
            message = JSON.stringify(message, null, '\t');
        }
        let div = document.createElement('div');
        div.classList.add('response');
        div.innerHTML = `<pre class="content">${message}</pre><span class="time">${terminalUtils.prefix_now()}</span>`;
        SCREEN_TAG.appendChild(div);
        SCREEN_TAG.scrollTo(0, SCREEN_TAG.scrollHeight);
    }
    append_response_json(message = {}) {
        terminal.append_response(message, { json: true });
    }

    execute(command = '') {
        try {
            command = command.trim();
            for (let bin in COMMAND_PATHS) {
                if (command.startsWith(bin)) {
                    let args = command.split(/\s+/);
                    let command_bin = new CommandModel();
                    command_bin = COMMAND_PATHS[bin];
                    let full_command = command_bin.execute.apply(null, args);
                    return full_command;
                }
            }
        } catch (e) {
            console.error(e);
            return `Can't execute: ${command}`;
        }
    }

    show_env_variables() {
        let innerHTML = '';
        for (let key in ENV_VARIABLES) {
            let value = terminal.get(key);
            if (key == 'file') value = value.name;
            innerHTML += `<span class="variable"><span class="name">${key}</span><span class="value">${value}</span></span>`;
        }
        ENV_VARIABLES_TAG.innerHTML = innerHTML;
    }
    get(name) {
        return ENV_VARIABLES[name];
    }
    set(name, value) {
        if (name == 'file') return false;
        ENV_VARIABLES[name] = value;
        return true;
    }

    isSelectingAutoComplete = false;
    selected_auto_complete_index = -1;

    set_command_preview(value = '') {
        COMMAND_PREVIEW_TAG.textContent = value;
    }
    clear_command_preview() {
        COMMAND_PREVIEW_TAG.textContent = '';
    }

    gen_params_guide(executeName, params = {}) {
        PARAMS_GUIDE_TAG.style.display = null;
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

        PARAMS_GUIDE_TAG.innerHTML = `<span class="executeName">${executeName}</span>(${paramsHTML})`;
    }
    clear_params_guide() {
        PARAMS_GUIDE_TAG.innerHTML = '';
        PARAMS_GUIDE_TAG.style.display = 'none';
    }

    gen_auto_complete(command = '') {
        if (command.match(/^\s*$/)) return;
        for (let bin in COMMAND_PATHS) {
            if (bin.startsWith(command)) {
                let div = document.createElement('div');
                div.classList.add('entry', 'dadFlexCenterVer');
                div.innerHTML = `<span class="cursor"></span><span class="value">${bin}</span>`;
                div.addEventListener('click', () => {
                    terminal.set_typing_value(div.textContent);
                    terminal.clear_auto_complete();
                    terminal.clear_command_preview();
                });
                AUTO_COMPLETE_TAG.appendChild(div);
            }
        }
    }
    clear_auto_complete() {
        AUTO_COMPLETE_TAG.innerHTML = '';
    }

    toggle_selecting_auto_complete() {
        let entries = Array.from(AUTO_COMPLETE_TAG.querySelectorAll('.entry'));
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

                let dadStart = AUTO_COMPLETE_TAG.scrollTop;
                let dadEnd = dadStart + parseFloat(getComputedStyle(AUTO_COMPLETE_TAG).height);

                if (childStart < dadStart) {
                    AUTO_COMPLETE_TAG.scrollBy(0, childStart - dadStart);
                } else if (childEnd > dadEnd) {
                    AUTO_COMPLETE_TAG.scrollBy(0, childEnd - dadEnd);
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
        let entry = AUTO_COMPLETE_TAG.querySelectorAll('.entry')[terminal.selected_auto_complete_index];
        if (entry) {
            terminal.set_typing_value(entry.textContent.trim());
        }
    }
}
export const terminal = new Terminal();

class TerminalUtils {
    prefix_now() {
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
const terminalUtils = new TerminalUtils();

terminal.show_env_variables();

window.addEventListener('drop', (e) => {
    e.preventDefault();

    let file = e.dataTransfer.files[0];
    ENV_VARIABLES.file = file;

    terminal.append_response('drop: ' + file.name);
    terminal.show_env_variables();
});
window.addEventListener('dragover', (e) => e.preventDefault());
httpClientService.ajax({ url: '/terminal.version.txt', method: 'GET' }, function (data) {
    VERSION_TAG.innerText = data;
    console.log(data);
});

TYPING_CONTENT_TAG.addEventListener('keydown', (e) => {
    let command = terminal.get_typing_value();

    switch (e.key) {
        case 'Enter':
            e.preventDefault();
            if (terminal.isSelectingAutoComplete) {
                terminal.fetch_selecting_auto_complete();
                terminal.isSelectingAutoComplete = false;
                return;
            }
            terminal.clear_auto_complete();
            terminal.clear_command_preview();

            terminal.clear_params_guide();

            TYPING_CONTENT_TAG.value = '';
            if (command.match(/^\s*$/)) return;

            let full_command = terminal.execute(command);
            terminal.append_command(full_command);
            break;

        case 'Tab':
            e.preventDefault();
            terminal.isSelectingAutoComplete = false;
            terminal.fetch_selecting_auto_complete();
            break;

        case 'ArrowDown':
            e.preventDefault();
            terminal.isSelectingAutoComplete = true;
            terminal.selected_auto_complete_index++;
            setTimeout(terminal.toggle_selecting_auto_complete, 0);
            break;

        case 'ArrowUp':
            e.preventDefault();
            terminal.isSelectingAutoComplete = true;
            terminal.selected_auto_complete_index--;
            setTimeout(terminal.toggle_selecting_auto_complete, 0);
            break;

        default:
            terminal.isSelectingAutoComplete = false;
            setTimeout(() => {
                let command = terminal.get_typing_value();
                terminal.clear_params_guide();
                terminal.clear_auto_complete();
                terminal.clear_command_preview();
                terminal.gen_auto_complete(command);
                terminal.toggle_selecting_auto_complete();
            }, 0);
            break;
    }
});
ENV_VARIABLES_TAG.addEventListener('mousedown', (e) => {
    e.preventDefault();
    TYPING_CONTENT_TAG.focus();
});
