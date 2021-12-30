import {useSnackbar} from "notistack"
import React, {useEffect, useRef} from "react"
import {useLLSelector} from "../hooks";
import {show_notification} from "../state/user";
import { Notification } from "../types"

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export const error_notification = (message: string) => show_notification({
    message, key: Math.random(), options: {
        variant: "error"
    }
} as Notification)

export const success_notification = (message: string) => show_notification({
    message, key: Math.random(), options: {
        variant: "success"
    }
} as Notification)

export default () => {
    const { enqueueSnackbar, closeSnackbar } = useSnackbar()
    const notifications = useLLSelector(state => state.user.notifications)
    const prevNotifications = usePrevious(notifications)

    Object.entries(notifications).forEach(([key, notification]) => {
        if (
            notification !== undefined && (
                prevNotifications === undefined ||
                !(key in prevNotifications)
            )
        ) {
            enqueueSnackbar(notification.message, notification.options)
        }
    })

    if (prevNotifications !== undefined) {
        Object.entries(prevNotifications).forEach(([key, notification]) => {
            if (notification !== undefined && !(key in notifications)) {
                closeSnackbar(notification.key)
            }
        })
    }
    return <></>
}

