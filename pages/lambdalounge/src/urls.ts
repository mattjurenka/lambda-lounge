const backend = "http://127.0.0.1:8787"
const auth = "http://127.0.0.1:8080"

export default {
    AUTHENTICATE: (username: string) => auth + `/auth/${username}`,
    DELETE_POST: (username: string, title: string) =>
        backend + `/posts/${username}/${title}/delete/`,
    POSTS: backend + "/posts/by_time/",
    POSTS_BY_USER: (username: string) => backend + `/posts/by_user/${username}/`,
    POST_FILE: (username: string, title: string) =>
        backend + `/posts/file/${username}/${title}/`,
    UPLOAD_POST: backend + "/posts/",
    VERIFY: auth + "/verify",
}
