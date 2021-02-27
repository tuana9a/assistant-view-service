import { Request, Response } from 'express';
import axios from 'axios';

import { reformatString } from '../utils/reformat';
import { fromAnyToNumber } from '../utils/convert';
import { App } from '../app';

var app: App;
export class RegisterPreviewView {
    constructor(appp: App) {
        app = appp;
    }

    async findClassesByTermAndIds(req: Request, resp: Response) {
        let ids = reformatString(String(req.query.ids))
            .split(/\s*,\s*|\s+/)
            .map((e) => e.replace(/\D+/g, ''))
            .filter((e) => e.match(/^\d+$/))
            .map((e) => fromAnyToNumber(e));
        let term = reformatString(String(req.query.term));
        let type = reformatString(String(req.query.type));

        let url = `${app.getMicroAddress('registerPreview')}/api/public/classes?ids=${ids}&term=${term}&type=${type}`;
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
        let mssv = fromAnyToNumber(reformatString(String(req.query.mssv)));
        let term = reformatString(String(req.query.term));

        let url = `${app.getMicroAddress('registerPreview')}/api/public/student?term=${term}&mssv=${mssv}`;
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
