import React, { useEffect } from "react"
import {useLLDispatch, useLLSelector} from "../hooks"
import {fetch_posts} from "../state/posts"
import URLS from "../urls"

export default () => {
    const dispatch = useLLDispatch()
    const posts = useLLSelector(s => s.posts.posts)

    useEffect(() => {
        dispatch(fetch_posts())
    }, [dispatch])

    return <>
        {posts.map(post => <>
            <h3>{post.title}</h3>
            <h5>By {post.username}</h5>
            <img src={URLS.POST_FILE(post.title)} />
            <p>By {post.description}</p>
            <hr />
        </>)}
    </>
}

