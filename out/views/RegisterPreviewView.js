"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterPreviewView = void 0;
const axios_1 = __importDefault(require("axios"));
const reformat_1 = require("../utils/reformat");
const convert_1 = require("../utils/convert");
var app;
class RegisterPreviewView {
    constructor(appp) {
        app = appp;
    }
    async findClassesByTermAndIds(req, resp) {
        let ids = reformat_1.reformatString(String(req.query.ids))
            .split(/\s*,\s*|\s+/)
            .map((e) => e.replace(/\D+/g, ''))
            .filter((e) => e.match(/^\d+$/))
            .map((e) => convert_1.fromAnyToNumber(e));
        let term = reformat_1.reformatString(String(req.query.term));
        let type = reformat_1.reformatString(String(req.query.type));
        let url = `${app.getMicroAddress('registerPreview')}/api/public/classes?ids=${ids}&term=${term}&type=${type}`;
        resp.setHeader('Content-Type', 'application/json; charset=utf-8');
        axios_1.default
            .get(url)
            .then((response) => {
            resp.send(response.data);
        })
            .catch((e) => {
            resp.send({ success: false, body: String(e) });
        });
    }
    async findStudentByTermAndMssv(req, resp) {
        let mssv = convert_1.fromAnyToNumber(reformat_1.reformatString(String(req.query.mssv)));
        let term = reformat_1.reformatString(String(req.query.term));
        let url = `${app.getMicroAddress('registerPreview')}/api/public/student?term=${term}&mssv=${mssv}`;
        resp.setHeader('Content-Type', 'application/json; charset=utf-8');
        axios_1.default
            .get(url)
            .then((response) => {
            resp.send(response.data);
        })
            .catch((e) => {
            resp.send({ success: false, body: String(e) });
        });
    }
}
exports.RegisterPreviewView = RegisterPreviewView;
//# sourceMappingURL=RegisterPreviewView.js.map