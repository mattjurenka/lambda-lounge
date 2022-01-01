import type { OptionsObject } from "notistack"

interface Post {
    title: string
    description: string
    user_id: number
    username: string
    timestamp: string
    saved: boolean?
}

type ViewingMode = ["home"] | ["user", string] | ["saved"]

interface PostValidationErrors {
    title: string
    description: string
    file: string
}

interface Notification {
    key: number
    message: string,
    options: OptionsObject
}

type NotificationMap = {[key: number]: Notification | undefined}

interface InfiniteScrollCustomEvent extends CustomEvent {
    target: HTMLIonInfiniteScrollElement
}
