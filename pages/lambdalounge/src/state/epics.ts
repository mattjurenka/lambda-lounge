import { from, EMPTY, of } from "rxjs"
import {
    filter, map, mergeMap, catchError, mapTo, delay
} from "rxjs/operators"
import type { MyEpic } from "./types"
import {
    set_posts, fetch_posts, add_posts, upload_post, delete_post, fetch_user_posts,
    fetch_saved_posts, save_post, unsave_post, close_modal, update_errors
} from "./posts"
import {
    register, check_logged_in, update_username, show_notification, hide_notification
} from "./user"
import axios from "axios"
import URLS from "../urls"
import {success_notification} from "../components/notifications"

const fetch_posts_epic: MyEpic = action$ => action$.pipe(
    filter(fetch_posts.match),
    mergeMap(_ => from(axios.get(URLS.POSTS, {withCredentials: true})).pipe(
        map(({ data }) => set_posts(data.posts))
    ))
)

const fetch_saved_posts_epic: MyEpic = action$ => action$.pipe(
    filter(fetch_saved_posts.match),
    mergeMap(_ => from(axios.get(URLS.SAVED_POSTS, {withCredentials: true})).pipe(
        map(({ data }) => set_posts(data.posts))
    ))
)

const fetch_user_posts_epic: MyEpic = action$ => action$.pipe(
    filter(fetch_user_posts.match),
    mergeMap(({ payload }) => from(axios.get(
        URLS.POSTS_BY_USER(payload), {withCredentials: true}
    )).pipe(
        map(({ data }) => set_posts(data.posts))
    ))
)

const upload_posts_epic: MyEpic = action$ => action$.pipe(
    filter(upload_post.match),
    mergeMap(({ payload }) => {
        const regex = /^[A-Za-z0-9 ]+$/
        const title_error = payload.title.length > 120 ?
            "Title cannot exceed 120 characters." :
            payload.title.length <= 0 ?
                "Title cannot be empty" : 
                !regex.test(payload.title) ?
                "Title can only have letters, numbers, and spaces" : ""

        const description_error = payload.description.length > 1028 ?
            "Title cannot exceed 1028 characters." :
            payload.description.length <= 0 ?
                "Description cannot be empty" : ""

        const file_error = payload.file === null ?
            "No File Uploaded" :
            payload.file.size >= 5_000_000 ?
                "File cannot be over 5 MB in size" : ""

        if ([title_error, description_error, file_error].some(err => err !== "")) {
            return of(update_errors({
                title: title_error, description: description_error, file: file_error
            }))
        } else {
            const form_data = new FormData()
            form_data.set("file", payload.file as File)
            form_data.set("data", JSON.stringify({
                title: payload.title,
                description: payload.description,
            }))
            axios.post(URLS.UPLOAD_POST, form_data, {withCredentials: true})
            return of(close_modal(), success_notification("Uploaded Post"))
        }
    })
)

const register_epic: MyEpic = action$ => action$.pipe(
    filter(register.match),
    mergeMap(({ payload }) => from(axios.get(
        URLS.AUTHENTICATE(payload), {withCredentials: true}
    )).pipe(
        mergeMap(_ => of(
            update_username(payload), success_notification(`Registered as ${payload}`)
        ))
    ))
)

const check_logged_in_epic: MyEpic = action$ => action$.pipe(
    filter(check_logged_in.match),
    mergeMap(_ => from(axios.get(URLS.VERIFY, {withCredentials: true}))
        .pipe(
            catchError(_ => EMPTY),
            map(({ data }) => update_username(data))
        ))
)

const delete_post_epic: MyEpic = (action$, state$) => action$.pipe(
    filter(delete_post.match),
    mergeMap(({ payload }) => from(axios.post(
        URLS.DELETE_POST(state$.value.user.username, payload), {}, {withCredentials: true}
    )).pipe(
        mergeMap(_ => of(fetch_posts(), success_notification("Deleted Post")))
    ))
)

const save_post_epic: MyEpic = action$ => action$.pipe(
    filter(save_post.match),
    mergeMap(({ payload }) => from(axios.post(
        URLS.SAVE_POST(payload.username, payload.title),
        {}, {withCredentials: true}
    )).pipe(
        mergeMap(_ => of(fetch_posts(), success_notification("Saved Post")))
    ))
)

const unsave_post_epic: MyEpic = action$ => action$.pipe(
    filter(unsave_post.match),
    mergeMap(({ payload }) => from(axios.post(
        URLS.UNSAVE_POST(payload.username, payload.title),
        {}, {withCredentials: true}
    )).pipe(
        mergeMap(_ => of(fetch_posts(), success_notification("Unsaved Post")))
    ))
)

const show_notification_epic: MyEpic = action$ => action$.pipe(
    filter(show_notification.match),
    delay(3000),
    map(({ payload }) => hide_notification(payload.key))
)

export {
    fetch_posts_epic, upload_posts_epic, register_epic, check_logged_in_epic,
    delete_post_epic, fetch_user_posts_epic, fetch_saved_posts_epic, save_post_epic,
    unsave_post_epic, show_notification_epic
}
