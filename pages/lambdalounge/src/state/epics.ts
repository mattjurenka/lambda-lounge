import { from } from "rxjs"
import { filter, map, mergeMap, tap, ignoreElements  } from "rxjs/operators"
import type { MyEpic } from "./types"
import { fetch_posts, add_posts, upload_post } from "./posts"
import axios from "axios"
import URLS from "../urls"

const fetch_posts_epic: MyEpic = (action$) => action$.pipe(
    filter(fetch_posts.match),
    mergeMap(_ => from(axios.get(URLS.POSTS)).pipe(
        map(({ data }) => add_posts(data.posts))
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
            user_id: 0,
            username: "matthewjurenka"
        }))
        axios.post(URLS.UPLOAD_POST, form_data)
    }),
    ignoreElements()
)

export { fetch_posts_epic, upload_posts_epic}
