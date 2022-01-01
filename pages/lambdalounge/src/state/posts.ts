import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { InfiniteScrollCustomEvent, Post, PostValidationErrors, ViewingMode } from "../types"

interface PostsState { 
    posts: Post[]
    cursor: string
    viewing_mode: ViewingMode
    post_modal_open: boolean
    post_validation_errors: PostValidationErrors
}

export const postsSlice = createSlice({
    name: "posts",
    initialState: {
        posts: [],
        cursor: "",
        viewing_mode: ["home"],
        post_modal_open: false,
        post_validation_errors: {
            title: "",
            description: "",
            file: ""
        }
    } as PostsState,
    reducers: {
        set_posts: (state, { payload }: PayloadAction<{
            posts: Post[],
            cursor: string
        }>) => {
            state.posts = payload.posts
            state.cursor = payload.cursor
        },
        add_posts: (state, { payload }: PayloadAction<{
            posts: Post[],
            cursor: string
        }>) => {
            state.posts = state.posts.concat(payload.posts)
            state.cursor = payload.cursor
        },
        upload_post: (_state, _payload: PayloadAction<{
            title: string,
            description: string,
            file: File | null
        }>) => {},
        fetch_posts: (state) => {
            state.viewing_mode = ["home"]
        },
        fetch_user_posts: (state, { payload }: PayloadAction<string>) => {
            state.viewing_mode = ["user", payload]
        },
        fetch_saved_posts: state => {
            state.viewing_mode = ["saved"]
        },
        fetch_next_page: (_state, _payload: PayloadAction<InfiniteScrollCustomEvent>) => {},
        delete_post: (_state, _payload: PayloadAction<string>) => {},
        save_post: (_state, _payload: PayloadAction<{
            username: string
            title: string
        }>) => {},
        unsave_post: (_state, _payload: PayloadAction<{
            username: string
            title: string
        }>) => {},
        open_modal: state => {
            state.post_modal_open = true
        },
        close_modal: state => {
            state.post_modal_open = false
        },
        update_errors: (state, { payload }: PayloadAction<Partial<PostValidationErrors>>) => {
            state.post_validation_errors = {
                ...state.post_validation_errors, ...payload
            }
        },
    }
})

export const {
    add_posts, set_posts, fetch_posts, upload_post, delete_post, fetch_user_posts,
    fetch_saved_posts, save_post, unsave_post, open_modal, close_modal, update_errors, fetch_next_page
} = postsSlice.actions
export default postsSlice.reducer
