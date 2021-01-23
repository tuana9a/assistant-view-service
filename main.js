
const fs = require("fs");
const multer = require("multer");
const adm_zip = require("adm-zip");
const express = require("express");
const axios = require("axios").default;
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

const log_helper = require("./common/log-helper");
const date_helper = require("./common/date-helper");


const ROOT_FOLDER = __dirname;
const INFO = {
    server: {
        port: -1,
    },
    registerPreview: {
        address: ""
    },
    schoolService: {
        address: ""
    },

    ROOT_KEY: "",
    CURRENT_KEY: "",
}


//SECTION: I/O
async function loadConfig() {
    console.log(String(fs.readFileSync("favicon.txt")));
    return Promise.all([
        new Promise((resolve, reject) => {
            let whichConfig = process.argv[2] == "--local" ? "config-local.json" : "config.json";
            console.log("load config: " + whichConfig);
            fs.readFile(whichConfig, "utf-8", (error, data) => {
                let config = JSON.parse(data);
                INFO.server = config.server;
                INFO.registerPreview = config.registerPreview;
                INFO.schoolService = config.schoolService;
                INFO.ROOT_KEY = config.ROOT_KEY;
                resolve();
            });
        }),

    ]);
}
async function initServer() {
    const app = express();
    app.use(express.json());

    app.get('/', async function (req, resp) {
        resp.sendFile(ROOT_FOLDER + '/webapp/index.html');
    });


    app.get('/api/public/register-preview/classes', async function (req, resp) {
        let ids = req.query.ids;
        let term = req.query.term;
        let url = `${INFO.registerPreview.address}/api/public/classes?ids=${ids}&term=${term}`;
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        axios.get(url).then(response => {
            resp.write(JSON.stringify(response.data));
            resp.end();
        }).catch(e => {
            resp.write(JSON.stringify({ success: false, body: e }));
            resp.end();
        });
    });
    app.get('/api/public/register-preview/guess-class', async function (req,resp) {
        let id = req.query.id;
        let term = req.query.term;
        let url = `${INFO.registerPreview.address}/api/public/guess-class?id=${id}&term=${term}`;
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        axios.get(url).then(response => {
            resp.write(JSON.stringify(response.data));
            resp.end();
        }).catch(e => {
            resp.write(JSON.stringify({ success: false, body: e }));
            resp.end();
        });
    });
    app.get('/api/public/school-service/terms', async function (req, resp) {
        let url = `${INFO.schoolService.address}/api/public/terms`;
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        axios.get(url).then(response => {
            resp.write(JSON.stringify(response.data));
            resp.end();
        }).catch(e => {
            resp.write(JSON.stringify({ success: false, body: e }));
            resp.end();
        });
    });
    app.get('/api/public/school-service/current-term', async function (req, resp) {
        let url = `${INFO.schoolService.address}/api/public/current-term`;
        resp.setHeader("Content-Type", "application/json; charset=utf-8");

        axios.get(url).then(response => {
            resp.write(JSON.stringify(response.data));
            resp.end();
        }).catch(e => {
            resp.write(JSON.stringify({ success: false, body: e }));
            resp.end();
        });
    });


    app.get('/*', async function (req, resp) {
        resp.sendFile(ROOT_FOLDER + '/webapp' + req.path, (err) => {
            if (err) {
                resp.setHeader('Content-Type', "text/html; charset=utf-8")
                resp.status(404).sendFile(ROOT_FOLDER + '/webapp/404.html', (err) => {
                    if (err) log_helper.error(err);
                });
            }
        });
    });


    app.post('/api/admin/webapp', upload.single('file'), async function (req, resp) {
        resp.setHeader("Content-Type", "application/json; charset=utf-8");
        let result = { success: true, body: {} };

        let auth = req.headers["auth"];
        if (auth == INFO.CURRENT_KEY) {
            let file = req.file;
            if (file) {
                result.body = "update success";
                let zipPath = "./webapp/" + file.originalname;
                fs.writeFileSync(zipPath, file.buffer, { flag: "w" });

                let webapp_zip = new adm_zip(zipPath);
                webapp_zip.extractAllTo("./webapp/", true);
            } else {
                result.body = "no file";
            }
        } else {
            result.success = false;
            result.body = "unauthorized";
        }

        resp.write(JSON.stringify(result));
        resp.end();
    });
    app.put('/api/micro/current-key', async function (req, resp) {
        resp.setHeader("Content-Type", "application/json; charset=utf-8");
        let body = req.body;
        let auth = req.headers["auth"];
        let result = { success: true, body: {} };

        let key = body.key;
        if (auth == INFO.ROOT_KEY) {
            INFO.CURRENT_KEY = key;
            result.body = "update success";
        } else {
            result.success = false;
        }
        resp.write(JSON.stringify(result));
        resp.end();
    });


    return new Promise((resolve, reject) => {
        const server = app.listen(process.env.PORT || INFO.server.port, function () {
            let port = server.address().port;
            console.log("server start at http://%s:%s", "127.0.0.1", port);
            resolve();
        });
        server.on("error", reject);
    });
}


async function main() {
    loadConfig().then(() => {
        initServer().then(() => {
        }).catch(log_helper.error);
    }).catch(log_helper.error);
}

main()
