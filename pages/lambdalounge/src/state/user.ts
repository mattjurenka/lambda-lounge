import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface UserState { 
    username: string
}

export const userSlice = createSlice({
    name: "user",
    initialState: {
        username: "",
    } as UserState,
    reducers: {
        check_logged_in: () => {},
        update_username: (state, { payload }: PayloadAction<string>) => {
            state.username = payload
        },
        register: (_state, _payload: PayloadAction<string>) => {},
    }
})

export const { check_logged_in, update_username, register } = userSlice.actions
export default userSlice.reducer
