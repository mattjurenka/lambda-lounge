import {isFunction} from "lodash"

const backend = "http://127.0.0.1:8787"
const auth = "http://127.0.0.1:8080"

const urls = {
    AUTHENTICATE: (username: string) => auth + `/auth/${username}`,
    DELETE_POST: (username: string, title: string) =>
        backend + `/posts/${username}/${title}/delete/`,
    POSTS: backend + "/posts/by_time/",
    POSTS_BY_USER: (username: string) => backend + `/posts/by_user/${username}/`,
    POST_FILE: (username: string, title: string) =>
        backend + `/posts/file/${username}/${title}/`,
    SAVE_POST: (username: string, title: string) =>
        backend + `/save/${username}/${title}/`,
    SAVED_POSTS: backend + "/posts/saved/",
    UPLOAD_POST: backend + "/posts/",
    UNSAVE_POST: (username: string, title: string) =>
        backend + `/unsave/${username}/${title}/`,
    VERIFY: auth + "/verify",
}

const proxy = new Proxy(urls, {
    get: function (target, prop) {
        const property = (target as any)[prop]
        return isFunction(property) ?
            (...args) => encodeURI(property(...args)) :
            encodeURI(property)
    }
})

export default proxy