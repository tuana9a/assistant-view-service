'use strict';

import { httpClientService, localStorageService } from './common.js';

const PREFIX_PWA = 'webapp';
const CACHE_NAME = 'webapp';
/**
 * NOT_TO_CACHE
 * terms.json
 * version.txt
 */
const URL_TO_CACHE = [
    '/',
    '/Alata.ttf',
    '/animation.css',
    '/animation.js',
    '/app.css',
    '/app.js',
    '/button.css',
    '/common.css',
    '/common.js',
    '/dad-child.css',
    '/favicon.ico',
    '/index.html',
    '/manifest.json',
    '/service-worker.js',
    // '/terms.json',
    // '/version.txt',
    '/worker-config.json',
    '/fonts/Alata.ttf',
    '/icons/manifest-icon-192.png',
    '/icons/manifest-icon-512.png',
    '/register-preview/query.js',
    '/register-preview/register-preview.css',
    '/register-preview/register-preview.js',
    '/register-preview/timetable.css',
    '/register-preview/timetable.js'
];
const WEBAPP_VERSION_ID_TAG = document.getElementById('version');
var CLIENT_WEBAPP_VERSION = localStorageService.get(PREFIX_PWA, 'version');
var WEBAPP_NEWEST_VERSION = CLIENT_WEBAPP_VERSION;
export const AppConfig = {
    worker_config: {
        service0: {
            name: 'master.hust-assistant.com',
            address: ''
        },
        service1: {
            name: 'hust-assistant.com',
            address: ''
        },
        service2: {
            name: 'register-preview.hust-assistant.com',
            address: ''
        },
        service3: {
            name: 'master.automation.hust-assistant.com',
            address: ''
        },
        service4: {
            name: 'message-queue.hust-assistant.com',
            address: ''
        },
        service5: {
            name: 'captcha-predict.automation.hust-assistant.com',
            address: ''
        }
    }
};

class WebApp {
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
        for (const url of URL_TO_CACHE) {
            backup.set(url, await cache.match(new Request(url)));
        }
        return backup;
    }
    async updateCaches() {
        await webApp.clearCaches();
        let cache = await caches.open(CACHE_NAME);
        return cache.addAll(
            URL_TO_CACHE.map(function (url) {
                return new Request(url, { cache: 'reload' });
            })
        );
    }
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker
                    .register('/service-worker.js')
                    .then(function (e) {
                        console.log('Service Worker: success');
                    })
                    .catch(function (e) {
                        console.log('Service Worker: FAILED');
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
    requestNotificationPermission() {
        Notification.requestPermission(function (status) {
            console.log('Notification Permission:', status);
        });
    }
    sendNotification(title = '', options = { body: '', data: {}, actions: [{ action: '', title: '' }] }) {
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
const webApp = new WebApp();

function main() {
    WEBAPP_VERSION_ID_TAG.textContent = 'v' + (CLIENT_WEBAPP_VERSION || '0.0.0');
    // WEBAPP.registerServiceWorker();
    webApp.unregisterServiceWorkers();
    webApp.clearCaches();

    document.getElementById('updateButton').addEventListener('click', async function () {
        console.log('updating...');
        const BACKUP = await webApp.backupCaches();

        webApp
            .updateCaches()
            .then(function () {
                console.log('update success');
                WEBAPP_VERSION_ID_TAG.innerText = 'v' + (WEBAPP_NEWEST_VERSION || '0.0.0');
                localStorageService.set(PREFIX_PWA, 'version', WEBAPP_NEWEST_VERSION);
            })
            .catch(function () {
                console.log('update failed');
                caches.open(CACHE_NAME).then(function (cache) {
                    for (const url of URL_TO_CACHE) {
                        cache.put(new Request(url), BACKUP.get(url));
                    }
                });
            });
    });

    httpClientService.ajax({ url: '/version.txt', method: 'GET' }, function (data) {
        if (data) {
            WEBAPP_NEWEST_VERSION = data;
        }
    });
    httpClientService.ajax({ url: '/worker-config.json', method: 'GET' }, (response) => {
        if (response) AppConfig.worker_config = response;
    });
}
main();
