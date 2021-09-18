import { Request, Response } from "express";

import { utils } from "./utils/Utils";
import { logsManager } from "./services/LogsManager";
import { ResponseEntity } from "./models/ResponseEntity";

class Views {
    async findManyLogs(req: Request, resp: Response) {
        try {
            let filter = req.body;
            let collection = utils.reformatString(String(req.query.collection));
            let result = await logsManager.findMany(collection, filter);
            resp.setHeader("Content-Type", "application/json; charset=utf-8");
            resp.send(ResponseEntity.builder().code(1).message("success").data(result).build());
        } catch (e) {
            console.error(e);
            resp.setHeader("Content-Type", "application/json; charset=utf-8");
            resp.send(ResponseEntity.builder().code(0).message("failed").data(e).build());
        }
    }
}

export const views = new Views();
