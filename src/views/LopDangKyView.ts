import { Request, Response } from 'express';
import axios from 'axios';

import { app } from '../main';
import { utils } from '../utils/Utils';
import { ResponseEntity } from '../models/ResponseEntity';

class LopDangKyView {
    async findClassesByTermAndIds(req: Request, resp: Response) {
        let ids = utils
            .reformatString(String(req.query.ids))
            .split(/\s*,\s*|\s+/)
            .map((e) => e.replace(/\D+/g, ''))
            .filter((e) => e.match(/^\d+$/))
            .map((e) => utils.fromAnyToNumber(e));
        let term = utils.reformatString(String(req.query.term));
        let type = utils.reformatString(String(req.query.type)); //EXPLAIN: type: near, match, phụ vụ loại tìm kiếm

        let address = app.getWorkerAddress('assistant-school-register-preview');
        let url = `${address}/api/public/classes?ids=${ids}&term=${term}&type=${type}`;

        axios
            .get(url)
            .then((response) => {
                resp.setHeader('Content-Type', 'application/json; charset=utf-8');
                resp.send(response.data);
            })
            .catch((e) => {
                resp.setHeader('Content-Type', 'application/json; charset=utf-8');
                resp.send(ResponseEntity.builder().code(-1).message('failed').data(String(e)));
            });
    }
    async findStudentByTermAndMssv(req: Request, resp: Response) {
        let mssv = utils.fromAnyToNumber(utils.reformatString(String(req.query.mssv)));
        let term = utils.reformatString(String(req.query.term));

        let address = app.getWorkerAddress('assistant-school-register-preview');
        let url = `${address}/api/public/student?term=${term}&mssv=${mssv}`;

        axios
            .get(url)
            .then((response) => {
                resp.setHeader('Content-Type', 'application/json; charset=utf-8');
                resp.send(response.data);
            })
            .catch((e) => {
                resp.setHeader('Content-Type', 'application/json; charset=utf-8');
                resp.send(ResponseEntity.builder().code(-1).message('failed').data(String(e)));
            });
    }
}

export const lopDangKyView = new LopDangKyView();
