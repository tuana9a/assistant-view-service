//EXPLAIN: only fetch cached data, do nothing more for simple <3

self.addEventListener("install", function (event) {
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
});

self.addEventListener("activate", function (event) {
    // Tell the active service worker to take control of the page immediately.
    self.clients.claim();
});

self.addEventListener("fetch", function (event) {
    event.respondWith(
        caches.match(event.request).then(async function (response) {
            // If exist then return else make new request
            return response || fetch(event.request);
        })
    );
});

self.addEventListener("notificationclick", function (event) {
    var notification = event.notification;
    var action = event.action;

    switch (action) {
        case "ok":
        case "close":
        case "cancel":
            // do something
            break;
    }

    notification.close();
});
