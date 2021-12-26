import { from, empty } from "rxjs"
import { filter, map, mergeMap, tap, ignoreElements, catchError, mapTo  } from "rxjs/operators"
import type { MyEpic } from "./types"
import {
    set_posts, fetch_posts, add_posts, upload_post, delete_post, fetch_user_posts
} from "./posts"
import { register, check_logged_in, update_username } from "./user"
import axios from "axios"
import URLS from "../urls"

const fetch_posts_epic: MyEpic = (action$) => action$.pipe(
    filter(fetch_posts.match),
    mergeMap(_ => from(axios.get(URLS.POSTS)).pipe(
        map(({ data }) => set_posts(data.posts))
    ))
)

const fetch_user_posts_epic: MyEpic = action$ => action$.pipe(
    filter(fetch_user_posts.match),
    mergeMap(({ payload }) => from(axios.get(URLS.POSTS_BY_USER(payload))).pipe(
        map(({ data }) => set_posts(data.posts))
    ))
)

const upload_posts_epic: MyEpic = action$ => action$.pipe(
    filter(upload_post.match),
    tap(({ payload }) => {
        const form_data = new FormData()
        form_data.set("file", payload.file)
        form_data.set("data", JSON.stringify({
            title: payload.title,
            description: payload.description,
        }))
        axios.post(URLS.UPLOAD_POST, form_data, {withCredentials: true})
    }),
    mapTo(fetch_posts())
)

const register_epic: MyEpic = action$ => action$.pipe(
    filter(register.match),
    mergeMap(({ payload }) => from(axios.get(
        URLS.AUTHENTICATE(payload), {withCredentials: true}
    )).pipe(
        map(_ => update_username(payload))
    ))
)

const check_logged_in_epic: MyEpic = action$ => action$.pipe(
    filter(check_logged_in.match),
    mergeMap(_ => from(axios.get(URLS.VERIFY, {withCredentials: true}))
        .pipe(
            catchError(err => empty()),
            map(({ data }) => update_username(data))
        ))
)

const delete_post_epic: MyEpic = (action$, state$) => action$.pipe(
    filter(delete_post.match),
    mergeMap(({ payload }) => from(axios.post(
        URLS.DELETE_POST(state$.value.user.username, payload), {}, {withCredentials: true}
    )).pipe(
        mapTo(fetch_posts())
    ))
)

export {
    fetch_posts_epic, upload_posts_epic, register_epic, check_logged_in_epic,
    delete_post_epic, fetch_user_posts_epic
}
