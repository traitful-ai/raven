import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching"
import { clientsClaim } from "workbox-core"

import { initializeApp } from "firebase/app"
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw"

// Use the precache manifest generated by Vite
precacheAndRoute(self.__WB_MANIFEST)

// Clean up old caches
cleanupOutdatedCaches()

const jsonConfig = new URL(location).searchParams.get("config")
// Firebase config initialization
try {
    const firebaseApp = initializeApp(JSON.parse(jsonConfig))
    const messaging = getMessaging(firebaseApp)

    function isChrome() {
        return navigator.userAgent.toLowerCase().includes("chrome")
    }

    onBackgroundMessage(messaging, (payload) => {
        const notificationTitle = payload.notification.title
        let notificationOptions = {
            body: payload.notification.body || "",
        }
        if (payload.data.image) {
            notificationOptions["icon"] = payload.data.image
        }

        if (payload.data.creation) {
            notificationOptions["timestamp"] = payload.data.creation
        }
        let url = `${payload.data.base_url}/raven/channel/${payload.data.channel_id}`

        if (payload.data.message_url) {
            url = payload.data.message_url
        }

        if (isChrome()) {
            notificationOptions["data"] = {
                url: url,
            }
        } else {
            notificationOptions["actions"] = [
                {
                    action: url,
                    title: "View",
                },
            ]
        }
        self.registration.showNotification(notificationTitle, notificationOptions)
    })

    if (isChrome()) {
        self.addEventListener("notificationclick", (event) => {
            event.stopImmediatePropagation()
            event.notification.close()
            if (event.notification.data && event.notification.data.url) {
                clients.openWindow(event.notification.data.url)
            }
        })
    }
} catch (error) {
    console.log("Failed to initialize Firebase", error)
}

self.skipWaiting()
clientsClaim()
console.log("Service Worker Initialized")