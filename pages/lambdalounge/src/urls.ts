const base = "http://127.0.0.1:8787"

export default {
    POSTS: base + "/posts/by_time/",
    UPLOAD_POST: base + "/posts/",
    POST_FILE: (title: string) => base + `/posts/file/${title}/`,
}
