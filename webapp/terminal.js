"use strict";

const screenTag = document.getElementById("MessengerScreen");
const autoCompleteTag = document.getElementById("MessageAutoComplete");
const typingCommandTag = document.getElementById("MessageTypingContent");
const commandPreviewTag = document.getElementById("MessagePreview");

const ENVIRONMENT = { term: "20192", file: false, secret: "iloveyou" };
const PATHS = {};

class Command {
    bin = "";
    args = {};
    execute = console.log;
}

class Terminal {
    add_command(command = new Command()) {
        PATHS[command.bin] = command;
    }
    get_command(bin = "") {
        let pointer = PATHS[bin];
        return pointer;
    }

    set_typing_value(value = "") {
        typingCommandTag.value = value;
    }
    get_typing_value() {
        return typingCommandTag.value.replace(/\s+/g, " ");
    }

    append_command(value = "") {
        let div = document.createElement("div");
        div.classList.add("Message", "user-select-none");
        div.innerHTML = `<span class="MessageTime">${terminalUtils.prefix_now()}</span><span class="MessageContent">${value}</span>`;
        screenTag.appendChild(div);
        screenTag.scrollTo(0, screenTag.scrollHeight);
    }

    append_response(message = {}, options = { json: false }) {
        if (options.json) {
            message = JSON.stringify(message, null, " ");
        }
        let div = document.createElement("div");
        div.classList.add("ResponseMessage");
        div.innerHTML = `<pre class="MessageContent">${message}</pre><span class="MessageTime">${terminalUtils.prefix_now()}</span>`;
        screenTag.appendChild(div);
        screenTag.scrollTo(0, screenTag.scrollHeight);
    }
    append_response_json(message = {}) {
        terminal.append_response(message, { json: true });
    }

    execute(command = "") {
        try {
            command = command.trim();
            for (let bin in PATHS) {
                if (command.startsWith(bin)) {
                    let args = command.split(/\s+/);
                    let command_bin = new Command();
                    command_bin = PATHS[bin];
                    let full_command = command_bin.execute.apply(null, args);
                    return full_command;
                }
            }
        } catch (e) {
            console.error(e);
            return `Can't execute: ${command}`;
        }
    }

    env_get_all() {
        let result = {};
        for (const key in ENVIRONMENT) {
            result[key] = key == "file" ? ENVIRONMENT.file.name : ENVIRONMENT[key];
        }
        return result;
    }
    env_get(name) {
        return ENVIRONMENT[name];
    }
    env_set(name, value) {
        ENVIRONMENT[name] = value;
        return true;
    }

    isSelecting = false;
    selectedIndex = -1;

    set_command_preview(value = "") {
        commandPreviewTag.textContent = value;
    }
    clear_command_preview() {
        commandPreviewTag.textContent = "";
    }

    gen_auto_complete(command = "") {
        if (command.match(/^\s*$/)) return;
        for (let bin in PATHS) {
            if (bin.startsWith(command)) {
                let div = document.createElement("div");
                div.classList.add("MessageEntry", "display-flex", "align-items-center");
                div.innerHTML = `<span class="MessageEntryContent">${bin}</span>`;
                div.addEventListener("click", () => {
                    terminal.set_typing_value(div.textContent);
                    terminal.clear_auto_complete();
                    terminal.clear_command_preview();
                });
                autoCompleteTag.appendChild(div);
            }
        }
    }
    clear_auto_complete() {
        autoCompleteTag.innerHTML = "";
    }

    toggle_selecting_auto_complete() {
        let entries = Array.from(autoCompleteTag.querySelectorAll(".MessageEntry"));
        let maxIndex = Math.max(0, entries.length - 1);
        let minIndex = 0;
        if (terminal.selectedIndex > maxIndex) {
            terminal.selectedIndex = maxIndex;
        } else if (terminal.selectedIndex < minIndex) {
            terminal.selectedIndex = minIndex;
        }

        entries.forEach((entry, index) => {
            if (index == terminal.selectedIndex) {
                entry.classList.add("isSelecting");

                let childStart = entry.offsetTop;
                let childEnd = childStart + parseFloat(getComputedStyle(entry).height);

                let dadStart = autoCompleteTag.scrollTop;
                let dadEnd = dadStart + parseFloat(getComputedStyle(autoCompleteTag).height);

                if (childStart < dadStart) {
                    autoCompleteTag.scrollBy(0, childStart - dadStart);
                } else if (childEnd > dadEnd) {
                    autoCompleteTag.scrollBy(0, childEnd - dadEnd);
                }

                terminal.set_command_preview(entry.textContent);
            } else {
                entry.classList.remove("isSelecting");
            }
        });
    }
    /**
     * hàm này lấy giá trị đang select của auto complete và nhét vào TypingMessage value
     */
    fetch_selecting_auto_complete() {
        let entry = autoCompleteTag.querySelectorAll(".MessageEntry")[terminal.selectedIndex];
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

        hour = hour < 10 ? "0" + hour : hour;
        minute = minute < 10 ? "0" + minute : minute;
        second = second < 10 ? "0" + second : second;
        return hour + ":" + minute + ":" + second;
    }
}
const terminalUtils = new TerminalUtils();

typingCommandTag.addEventListener("keydown", (e) => {
    let command = terminal.get_typing_value();

    switch (e.key) {
        case "Enter":
            e.preventDefault();
            if (terminal.isSelecting) {
                terminal.fetch_selecting_auto_complete();
                terminal.isSelecting = false;
                return;
            }
            terminal.clear_auto_complete();
            terminal.clear_command_preview();

            typingCommandTag.value = "";
            if (command.match(/^\s*$/)) return;

            let full_command = terminal.execute(command);
            terminal.append_command(full_command);
            break;

        case "Tab":
            e.preventDefault();
            terminal.isSelecting = false;
            terminal.fetch_selecting_auto_complete();
            break;

        case "ArrowDown":
            e.preventDefault();
            terminal.isSelecting = true;
            terminal.selectedIndex++;
            setTimeout(terminal.toggle_selecting_auto_complete, 0);
            break;

        case "ArrowUp":
            e.preventDefault();
            terminal.isSelecting = true;
            terminal.selectedIndex--;
            setTimeout(terminal.toggle_selecting_auto_complete, 0);
            break;

        default:
            terminal.isSelecting = false;
            setTimeout(() => {
                let command = terminal.get_typing_value();
                terminal.clear_auto_complete();
                terminal.clear_command_preview();
                terminal.gen_auto_complete(command);
                terminal.toggle_selecting_auto_complete();
            }, 0);
            break;
    }
});
