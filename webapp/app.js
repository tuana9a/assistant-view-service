'use strict';

import { httpClientService } from './common.js';

var isServiceWorkderAvailable = false;
const CACHE_NAME = 'webapp';
const CACHED_URLS = [];
const SERVICE_WORKER_FILE = 'app.service-worker.v1.js';

export var AppConfig = {
    apps: {
        app2: {
            name: 'register-preview',
            address: ''
        },
        app3: {
            name: 'automation',
            address: ''
        }
    }
};

class CachesUtils {
    async clearCaches() {
        return caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        });
    }
    async backupCaches() {
        let cache = await caches.open(CACHE_NAME);
        let backup = new Map();
        for (const url of CACHED_URLS) {
            backup.set(url, await cache.match(new Request(url)));
        }
        return backup;
    }
    async updateCaches() {
        await cachesUtils.clearCaches();
        let cache = await caches.open(CACHE_NAME);
        return cache.addAll(CACHED_URLS.map((url) => new Request(url, { cache: 'reload' })));
    }
}
const cachesUtils = new CachesUtils();

class NotificationUtils {
    requestNotificationPermission() {
        Notification.requestPermission(function (status) {
            console.log('Notification Permission:', status);
        });
    }
    sendNotification(
        title = '',
        options = { body: '', data: {}, actions: [{ action: '', title: '' }] }
    ) {
        if (Notification.permission == 'granted') {
            navigator.serviceWorker.getRegistration().then(function (serviceWorker) {
                serviceWorker.showNotification(title, {
                    ...options,
                    icon: 'icons/manifest-icon-192.png',
                    silent: true
                });
            });
        }
    }
}
export const notificationUtils = new NotificationUtils();

class ServiceWorkerUtils {
    registerServiceWorker(serviceWorkerFile) {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker
                    .register(serviceWorkerFile)
                    .then(function () {
                        console.log('register service worker: success');
                    })
                    .catch(function () {
                        console.log('register service worker: failed');
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
    async connect(path = 'websocket') {
        return new Promise(function (resolve, reject) {
            switch (window.location.protocol) {
                case 'http:':
                    websocket = new WebSocket(`ws://${window.location.host}${path}`);
                    break;
                case 'https:':
                    websocket = new WebSocket(`wss://${window.location.host}${path}`);
                    break;
            }
            websocket.onopen = function (e) {
                terminal.append_response('WebSocket connected 💘');
                websocket.send(JSON.stringify({ which: 0, auth: getCookie('auth') }));
                resolve('WebSocket connected 💘');
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
            terminal.append_response('WebSocket closed 😢');
        }
    }
}
export const webSocketClient = new WebSocketClient();

class App {
    async update() {
        console.log('updating...');
        const BACKUP = await cachesUtils.backupCaches();

        cachesUtils
            .updateCaches()
            .then(function () {
                console.log('update success');
            })
            .catch(function () {
                console.log('update failed');
                caches.open(CACHE_NAME).then(function (cache) {
                    for (const url of CACHED_URLS) {
                        cache.put(new Request(url), BACKUP.get(url));
                    }
                });
            });
    }
}
export const app = new App();

if ('serviceWorker' in navigator) {
    isServiceWorkderAvailable = true;
}
if (isServiceWorkderAvailable) {
    cachesUtils.clearCaches();
    serviceWorkerUtils.unregisterServiceWorkers();
}
// localStorage.clear();

httpClientService.ajax({ url: '/app.version.txt', method: 'GET' }, (data) =>
    console.log('app.version: ' + data)
);
httpClientService.ajax(
    { url: '/app-config.json', method: 'GET' },
    (response) => (AppConfig = response)
);
