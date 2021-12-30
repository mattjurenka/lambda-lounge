import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Notification, NotificationMap } from "../types"


interface UserState { 
    username: string
    notifications: NotificationMap
}

export const userSlice = createSlice({
    name: "user",
    initialState: {
        username: "",
        notifications: {},
    } as UserState,
    reducers: {
        check_logged_in: () => {},
        update_username: (state, { payload }: PayloadAction<string>) => {
            state.username = payload
        },
        register: (_state, _payload: PayloadAction<string>) => {},
        show_notification: (state, { payload }: PayloadAction<Notification>) => {
            (state.notifications as NotificationMap)[payload.key] = payload
        },
        hide_notification: (state, { payload }: PayloadAction<number>) => {
            (state.notifications as NotificationMap)[payload] = undefined
        }
    }
})

export const {
    check_logged_in, update_username, register, show_notification, hide_notification
} = userSlice.actions
export default userSlice.reducer
