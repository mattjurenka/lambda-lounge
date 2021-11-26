import React from "react"
import { useLLDispatch, useLLSelector } from "./hooks"
import {fetch_posts} from "./state/posts"

const Main = () => {
    const dispatch = useLLDispatch()
    const posts = useLLSelector(state => state.posts.posts)
    return <div>
        {posts.map((p, idx) => <p id={idx.toString()}>{p}</p>)}
        <button onClick={_ => dispatch(fetch_posts())}>
            Add Post
        </button>
    </div>
}

export default Main
