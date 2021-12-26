use std::future::{Future};
use futures::stream::FuturesUnordered;
use worker::*;
use worker::Response;
use std::hash::Hash;
use std::hash::Hasher;
use futures::{join};
use futures::future::{select_all};
use chrono::prelude::*;
use worker_sys::console_log;
use futures::stream::{self, StreamExt};
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::rc::Rc;
use std::iter;
use urlencoding::decode;
extern crate base64;

mod utils;
use utils::{Post, ListPostsResponse, calculate_hash};

async fn many<I, F>(iter: I) -> Vec<F::Output>
    where
        I: Iterator<Item=F>,
        F: Future
{
    let pinned_futs: Vec<_> = iter.into_iter().enumerate()
        .map(|(idx, fut)| async move { (idx, fut.await) })
        .map(Box::pin)
        .collect();
    let mut ret: Vec<_> = (0..pinned_futs.len()).map(|_| None).collect();
    let mut futs = pinned_futs;
    while !futs.is_empty() {
        let (r, _idx, remaining) = select_all(futs).await;
        ret[r.0] = Some(r.1);
        futs = remaining;
    }
    ret.into_iter().filter_map(|opt| opt).collect()
}

//Verify the user's identity by forwarding their cookies to the auth server
async fn verify_jwt(cookies: &String) -> Result<String> {
    let mut headers = Headers::new();
    headers.set("Cookie", cookies)?;
    let req = Request::new_with_init(
        "http://9e6a-67-183-191-15.ngrok.io/verify",
        RequestInit::new()
            .with_headers(headers)
            .with_method(Method::Get)
    )?;
    let x = Fetch::Request(req);
    let mut y = x.send().await?;
    match y.status_code() {
        200 => Ok(y.text().await?),
        x => Err(format!("could not authenticate user, received code {}", x).into())
    }
}

pub async fn get_posts_file(_: Request, ctx: RouteContext<()>) -> Result<Response> {
    let post_files = ctx.kv("POST_FILES")?;
    match (
        ctx.param("title").and_then(|encoded| decode(encoded).ok()),
        ctx.param("username").and_then(|encoded| decode(encoded).ok())
    ) {
        (Some(title), Some(username)) => {
            let hash = calculate_hash(&username.into_owned(), &title.into_owned());
            match post_files.get(&hash).await? {
                Some(file) => {
                    if let Ok(bytes) = base64::decode(file.as_string()) {
                        let mut headers = Headers::new();
                        headers.set("Content-Type", "image/jpeg")?;
                        Response::from_body(ResponseBody::Body(bytes))
                            .map(|r| r.with_headers(headers))
                    } else {
                        Response::error("File is corrupted", 400)
                    }
                }
                None => Response::error("File not found", 400)
            }
        }
        _ => {
            Response::error("Could not parse Title", 400)
        }
    }
}

//Gets recent posts by order of most to least recent
pub async fn get_recent_posts(_: Request, ctx: RouteContext<()>) -> Result<Response> {
    let posts = ctx.kv("POSTS")?;
    let timestamp_index = ctx.kv("TIMESTAMP_INDEX")?;

    let mut posts_list_options = timestamp_index.list()
        .limit(25);
    if let Some(cursor) = ctx.param("cursor") {
        posts_list_options = posts_list_options.cursor(cursor.to_string());
    }
    let posts_list = posts_list_options.execute().await?;

    let hashes: Vec<_> = posts_list.keys.iter()
        .filter_map(|k| k.name.split("_").nth(1))
        .collect();

    let p = &posts;
    let recent_posts: Vec<Post> = many(hashes.iter().map(|key| p.get(key))).await.into_iter()
        .filter_map(|opt| opt.ok())
        .filter_map(|value| value.and_then(|post_json| post_json.as_json::<Post>().ok()))
        .collect();

    let response = ListPostsResponse::new(
        recent_posts, &posts_list.cursor.unwrap_or("".to_string())
    );
    Response::from_json(&response)
}


///Handles users creating a new post
pub async fn post_posts(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let form = req.form_data().await?;
    match (
        form.get("data"),
        form.get("file"),
        req.headers().get("Cookie")
    )  {
        //Ensure that data is a real field and file' is a real field
        (Some(FormEntry::Field(post_str)), Some(FormEntry::File(buf)), Ok(Some(cookie))) => {
            match serde_json::from_str::<utils::Post>(&post_str) {
                Ok(mut post) => {
                    //Enforce string lengths
                    if post.title.len() > 120 {
                        return Response::error("Post Title over 120 Characters.", 400);
                    } else if post.description.len() > 1028 {
                        return Response::error(
                            "Post Description over 1028 Characters.", 400
                        );
                    }

                    match verify_jwt(&cookie).await {
                        Ok(username) => {
                            console_log!("Found username: {}", username);
                            let posts = ctx.kv("POSTS")?;
                            let post_files = ctx.kv("POST_FILES")?;
                            let timestamp_index = ctx.kv("TIMESTAMP_INDEX")?;
                            let timestamp_user_index = ctx.kv("TIMESTAMP_USER_INDEX")?;

                            //Calculate hash of title
                            let hash = calculate_hash(
                                &username, &post.title
                            );
                            
                            //Calculate datetime by reverse lexological order
                            let now = Utc::now();
                            post.timestamp = now.to_string();
                            post.username = username.clone();
                            let rev_timestamp = utils::get_lexicographic_datetime(now);

                            //Update POSTS and POST_FILES
                            join!(
                                posts.put(&hash, serde_json::to_string(&post)?)?.execute(),
                                post_files.put(
                                    &hash, base64::encode(buf.bytes().await?)
                                )?.execute(),
                                timestamp_index.put(
                                    &format!("{}_{}", rev_timestamp, hash), ""
                                )?.execute(),
                                timestamp_user_index.put(
                                    &format!("{}_{}_{}", username, rev_timestamp, hash), ""
                                )?.execute(),
                            );
                            Response::empty()
                        },
                        Err(e) => {
                            Response::error("Unable to verify identity", 400)
                        },
                    }
                },
                Err(_) => Response::error("Unable to deserialize data", 400),
            }
        },
        _ => Response::error(
            "Unable to deserialize 'data' or 'file' properly.", 400
        ),
    }
}

//Handles user deleting a post
pub async fn delete_post(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    match (
        ctx.param("title").and_then(|v| decode(v).ok()),
        req.headers().get("Cookie")
    ) {
        (Some(title), Ok(Some(cookies))) => {
            console_log!("{}", cookies);
            match verify_jwt(&cookies).await {
                Ok(username) => {
                    let posts = ctx.kv("POSTS")?;
                    let post_files = ctx.kv("POST_FILES")?;

                    let hash = calculate_hash(&username, &title.into_owned());
                    join!(
                        posts.delete(&hash),
                        post_files.delete(&hash)
                    );
                    Response::ok("")
                },
                Err(e) => {
                    console_log!("{}", e);
                    Response::error("Unable to authenticate user", 400)
                }
            }
        },
        (None, _) => Response::error("Unable to decode title", 400),
        _ => Response::error("No cookies found", 400)
    }
}

pub async fn get_user_posts(_: Request, ctx: RouteContext<()>) -> Result<Response> {
    match ctx.param("username").and_then(|v| decode(v).ok()) {
        Some(username) => {
            let timestamp_user_index = ctx.kv("TIMESTAMP_USER_INDEX")?;
            let posts = ctx.kv("POSTS")?;

            let mut posts_list_options = timestamp_user_index.list()
                .limit(25)
                .prefix(username.into());
            if let Some(cursor) = ctx.param("cursor") {
                posts_list_options = posts_list_options.cursor(cursor.to_string());
            }
            let posts_list = posts_list_options.execute().await?;
            let hashes: Vec<_> = posts_list.keys.iter()
                .filter_map(|k| k.name.split("_").nth(2))
                .collect();
            let p = &posts;
            let recent_posts: Vec<Post> = many(
                hashes.iter().map(|key| p.get(key))
            ).await.into_iter()
                .filter_map(|opt| opt.ok())
                .filter_map(
                    |value| value.and_then(|post_json| post_json.as_json::<Post>().ok())
                )
                .collect();

            let response = ListPostsResponse::new(
                recent_posts, &posts_list.cursor.unwrap_or("".to_string()));
            Response::from_json(&response)
        },
        None => Response::error("Unable to parse username", 400),
    }
}

#[event(fetch, respond_with_errors)]
pub async fn main(req: Request, env: Env) -> Result<Response> {

    // Create an instance of the Router, which can use paramaters (/user/:name) or wildcard values
    // (/file/*pathname). Alternatively, use `Router::with_data(D)` and pass in arbitrary data for
    // routes to access and share using the `ctx.data()` method.
    let router = Router::new();

    let response = router
        //Get all posts ordered by most recent
        //sorts the rev_timestamp -> post association
        
        //Get the top n keys on POSTS_TIMESTAMP
        .get_async("/posts/by_time/", get_recent_posts)
        //Get the actual file associated with the post
        .get_async("/posts/file/:username/:title/", get_posts_file)
        .get_async("/posts/by_user/:username/", get_user_posts)
        .post_async("/posts/", post_posts)
        .post_async("/posts/:username/:title/delete/", delete_post)
        .options(
            "/posts/:username/:title/delete/",
            |_, _| {
                let mut r = Response::ok("").unwrap();
                r.headers_mut().set("Allow", "POST").unwrap();
                r.headers_mut().set("Access-Control-Allow-Headers", "content-type").unwrap();
                Ok(r)
            }
        )
        //.get_async("/saved/check/:id/", |mut req, ctx| async move {
        //    //Takes a user id, and a list of posts in the query param
        //    //and returns the posts in that list that are saved
        //    
        //    //query SAVED_TIMESTAMP_HASH for a list of all posts saved by user
        //    //respond with a comma seperated list of title hashes
        //    todo!()
        //})
        //.get_async("/saved/:id/", |mut req, ctx| async move {
        //    //Takes a user ID and returns all posts in most recent saved order

        //    //query SAVED_TIMESTAMP_IDX, which returns a list of all saved title
        //    //hashes sorted by most to least recent

        //    //Query posts and posts_file for each hash to get the actual post
        //    todo!()
        //})
        //.post_async("/save/:uid/:pid/", |mut req, ctx| async move {
        //    //Mark user with uid as saving pid

        //    //Set SAVED and SAVED_TIMESTAMP_IDX with the appropriate values
        //    todo!()
        //})
        //.get_async("/comments/:pid/", |mut req, ctx| async move {
        //    //Return all comments on a post

        //    //list COMMENTS to get a sorted list of comments, then query again
        //    //to get the actual comments and user info
        //    todo!()
        //})
        //.post_async("/comment/:uid/:pid/", |mut req, ctx| async move {
        //    //Mark user with uid with commenting on pid with comment as a query param

        //    //Set COMMENTS and SAVED_TIMESTAMP_IDX with the appropriate value
        //    //for each key, query for the comment again
        //    todo!()
        //})
        .run(req, env).await;
    //set CORS header
    response.map(|mut r| {
        r.headers_mut().set("Access-Control-Allow-Origin", "http://127.0.0.1:4000").unwrap();
        r.headers_mut().set("Access-Control-Allow-Credentials", "true").unwrap();
        r
    })
}

//_ is used as a separator
//POSTS
//hash of title -> {title, description, user_id, timestamp, file}

//POSTS_FILE
//hash of title -> <img file>

//TIMESTAMP_INDEX
//rev timestamp_hash of title -> 0

//TIMESTAMP_USER_INDEX
//user id_timestamp_hash of title -> 0

//SAVED
//user id_hash of title -> 0

//SAVED_TIMESTAMP_IDX
//user id_rev timestamp_hash of title -> 0
