import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface PostsState { 
    posts: Post[]
    cursor: string
    viewing_user: string
}

export const postsSlice = createSlice({
    name: "posts",
    initialState: {
        posts: [],
        cursor: "",
        viewing_user: "",
    } as PostsState,
    reducers: {
        set_posts: (state, { payload }: PayloadAction<Post[]>) => {
            state.posts = payload
        },
        add_posts: (state, { payload }: PayloadAction<Post[]>) => {
            state.posts = state.posts.concat(payload)
        },
        upload_post: (_state, _payload: PayloadAction<{
            title: string,
            description: string,
            file: File
        }>) => {},
        fetch_posts: (state) => {
            state.viewing_user = ""
        },
        fetch_user_posts: (state, { payload }: PayloadAction<string>) => {
            state.viewing_user = payload
        },
        delete_post: (_state, _payload: PayloadAction<string>) => {}
    }
})

export const {
    add_posts, set_posts, fetch_posts, upload_post, delete_post, fetch_user_posts
} = postsSlice.actions
export default postsSlice.reducer
