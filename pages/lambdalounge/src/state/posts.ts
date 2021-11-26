import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface PostsState { 
    posts: string[]
    cursor: string
}

export const postsSlice = createSlice({
    name: "posts",
    initialState: {
        posts: [],
        cursor: ""
    } as PostsState,
    reducers: {
        add_posts: (state, { payload }: PayloadAction<string>) => {
            state.posts.push(payload)
        },
        upload_post: (_state, _payload: PayloadAction<string>) => {},
        fetch_posts: () => {},
    }
})

export const { add_posts, fetch_posts, upload_post } = postsSlice.actions
export default postsSlice.reducer
