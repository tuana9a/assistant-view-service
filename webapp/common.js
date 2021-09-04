"user strict";

//SECTION: request
class HttpClientService {
    async ajax(option = { method: "", url: "", headers: {}, body: {} }, onDone = (data) => data) {
        return new Promise(function (resolve, reject) {
            let xhttp = new XMLHttpRequest();
            let headers = option.headers;

            xhttp.onerror = reject;
            xhttp.ontimeout = reject;
            xhttp.onload = function () {
                let data = undefined;
                try {
                    data = JSON.parse(xhttp.response);
                } catch (err) {
                    data = xhttp.response;
                }
                resolve(data);
                onDone(data);
            };

            xhttp.open(option.method, option.url);
            xhttp.setRequestHeader("accept", "*/*");
            xhttp.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            for (const header in headers) xhttp.setRequestHeader(header, headers[header]);

            xhttp.send(JSON.stringify(option.body));
        });
    }
    async uploadFile(option = { url: "", headers: {} }, file, onDone = () => {}) {
        let xhttp = new XMLHttpRequest();
        let headers = option.headers;

        xhttp.onload = function () {
            let data = undefined;
            try {
                data = JSON.parse(xhttp.response);
            } catch (e) {
                data = xhttp.response;
            }
            onDone(data);
        };

        xhttp.open("POST", option.url);
        for (const header in headers) xhttp.setRequestHeader(header, headers[header]);

        let formData = new FormData();
        formData.append("file", file);
        xhttp.send(formData);
    }
}
export const httpClientService = new HttpClientService();
