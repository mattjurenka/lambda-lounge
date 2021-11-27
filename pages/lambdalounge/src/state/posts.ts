import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface PostsState { 
    posts: Post[]
    cursor: string
}

export const postsSlice = createSlice({
    name: "posts",
    initialState: {
        posts: [],
        cursor: ""
    } as PostsState,
    reducers: {
        add_posts: (state, { payload }: PayloadAction<Post[]>) => {
            state.posts = state.posts.concat(payload)
        },
        upload_post: (_state, _payload: PayloadAction<{
            title: string,
            description: string,
            file: File
        }>) => {},
        fetch_posts: () => {},
    }
})

export const { add_posts, fetch_posts, upload_post } = postsSlice.actions
export default postsSlice.reducer
