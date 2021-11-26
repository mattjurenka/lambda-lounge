import { from } from "rxjs"
import { filter, map, mergeMap  } from "rxjs/operators"
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
    filter(u
)

export { fetch_posts_epic }
