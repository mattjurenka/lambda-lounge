use worker::*;

mod utils;

#[event(fetch, respond_with_errors)]
pub async fn main(req: Request, env: Env) -> Result<Response> {

    // Create an instance of the Router, which can use paramaters (/user/:name) or wildcard values
    // (/file/*pathname). Alternatively, use `Router::with_data(D)` and pass in arbitrary data for
    // routes to access and share using the `ctx.data()` method.
    let router = Router::new();

    router
        .get_async("/posts", |_req, _ctx| async move {
            Response::ok("Hello World")
        })
        .post_async("/posts", |mut req, ctx| async move {
            if let Ok(json) = req.json::<utils::Post>().await {
                console_log!("{}", json.title);
            }

            Response::error("Bad Request", 400)
        })
        .run(req, env).await
}
