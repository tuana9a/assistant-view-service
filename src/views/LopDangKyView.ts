import { Request, Response } from 'express';
import axios from 'axios';

import { app } from '../main';
import { utils } from '../utils/Utils';

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

        let url = `${app.getConfig(
            'workers.school-register-preview.address'
        )}/api/public/classes?ids=${ids}&term=${term}&type=${type}`;
        resp.setHeader('Content-Type', 'application/json; charset=utf-8');

        axios
            .get(url)
            .then((response) => {
                resp.send(response.data);
            })
            .catch((e) => {
                resp.send({ success: false, body: String(e) });
            });
    }
    async findStudentByTermAndMssv(req: Request, resp: Response) {
        let mssv = utils.fromAnyToNumber(utils.reformatString(String(req.query.mssv)));
        let term = utils.reformatString(String(req.query.term));

        let url = `${app.getConfig(
            'workers.school-register-preview.address'
        )}/api/public/student?term=${term}&mssv=${mssv}`;
        resp.setHeader('Content-Type', 'application/json; charset=utf-8');

        axios
            .get(url)
            .then((response) => {
                resp.send(response.data);
            })
            .catch((e) => {
                resp.send({ success: false, body: String(e) });
            });
    }
}

export const lopDangKyView = new LopDangKyView();
