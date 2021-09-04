"use strict";

import { httpClientService } from "./common.js";

var isServiceWorkderAvailable = "serviceWorker" in navigator;

const CACHE_NAME = "webapp";
const CACHED_URLS = [];

export var AppConfig = {
    apps: {
        app2: {
            name: "",
            address: ""
        },
        app3: {
            name: "",
            address: ""
        }
    },
    version: "v2019.7",
    service_worker_file: "app.service-worker.js"
};

class CachesUtils {
    async clear() {
        return caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        });
    }
    async backup() {
        let cache = await caches.open(CACHE_NAME);
        let backup = new Map();
        for (const url of CACHED_URLS) {
            backup.set(url, await cache.match(new Request(url)));
        }
        return backup;
    }
    async update() {
        let cache = await caches.open(CACHE_NAME);
        return cache.addAll(CACHED_URLS.map((url) => new Request(url, { cache: "reload" })));
    }
}
const cachesUtils = new CachesUtils();

class NotificationUtils {
    requestNotificationPermission() {
        Notification.requestPermission(function (status) {
            console.log("Notification Permission:", status);
        });
    }
    sendNotification(title = "", options = { body: "", data: {}, actions: [{ action: "", title: "" }] }) {
        if (Notification.permission == "granted") {
            navigator.serviceWorker.getRegistration().then(function (serviceWorker) {
                serviceWorker.showNotification(title, {
                    ...options,
                    icon: "icons/manifest-icon-192.png",
                    silent: true
                });
            });
        }
    }
}
const notificationUtils = new NotificationUtils();

class ServiceWorkerUtils {
    registerServiceWorker(serviceWorkerFile) {
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", function () {
                navigator.serviceWorker
                    .register(serviceWorkerFile)
                    .then(function () {
                        console.log("register service worker: success");
                    })
                    .catch(function () {
                        console.log("register service worker: failed");
                    });
            });
        }
    }
    async unregisterServiceWorkers() {
        return navigator.serviceWorker.getRegistrations().then(function (serviceWorkers) {
            return serviceWorkers.map(function (serviceWorker) {
                return serviceWorker.unregister();
            });
        });
    }
}
const serviceWorkerUtils = new ServiceWorkerUtils();
var websocket = null;

class WebSocketClient {
    async connect(path = "websocket") {
        return new Promise(function (resolve, reject) {
            switch (window.location.protocol) {
                case "http:":
                    websocket = new WebSocket(`ws://${window.location.host}${path}`);
                    break;
                case "https:":
                    websocket = new WebSocket(`wss://${window.location.host}${path}`);
                    break;
            }
            websocket.onopen = function (e) {
                terminal.append_response("WebSocket connected 💘");
                websocket.send(JSON.stringify({ which: 0, auth: getCookie("auth") }));
                resolve("WebSocket connected 💘");
            };
            websocket.onmessage = function (msg) {
                terminal.append_response_json(JSON.parse(msg.data));
            };
            websocket.onclose = webSocketClient.close;
            websocket.onerror = reject;
        });
    }
    close() {
        if (websocket) {
            if (websocket.readyState == WebSocket.OPEN) websocket.close();
            websocket = null;
            terminal.append_response("WebSocket closed 😢");
        }
    }
}
const webSocketClient = new WebSocketClient();

class App {
    async update() {
        const BACKUP = await cachesUtils.backup();
        await cachesUtils.clear();
        try {
            await cachesUtils.update(); //TODO: check if error can catch
            console.log("update: success");
        } catch (err) {
            console.log("update: failed");
            let cache = await caches.open(CACHE_NAME);
            CACHED_URLS.forEach((url) => cache.put(new Request(url), BACKUP.get(url)));
        }
    }
    reset() {
        cachesUtils.clear();
        localStorage.clear();
        serviceWorkerUtils.unregisterServiceWorkers();
    }
}
const app = new App();

httpClientService.ajax({ url: "/app-config.json", method: "GET" }, (data) => (AppConfig = data));
