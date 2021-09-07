import fs from "fs";
import { AppConfig } from "../config/AppConfig";
import { dateTimeUtils } from "./DateTimeUtils";

function get_path(date: Date = new Date()) {
    return AppConfig.path.logs_dir + dateTimeUtils.getDate(date) + ".log";
}

class LogUtils {
    info(data: any) {
        let now = new Date();
        let content = dateTimeUtils.getFull(now) + " [INFO] " + data + "\n";
        let filepath = get_path(now);
        fs.appendFileSync(filepath, content);
    }
    warn(data: any) {
        let now = new Date();
        let content = dateTimeUtils.getFull(now) + " [WARN] " + data + "\n";
        let filepath = get_path(now);
        fs.appendFileSync(filepath, content);
    }
    error(data: Error) {
        let now = new Date();
        let content = dateTimeUtils.getDate(now) + " [ERROR] " + data.stack + "\n";
        let filepath = get_path(now);
        fs.appendFileSync(filepath, content);
    }
}

export const logUtils = new LogUtils();
