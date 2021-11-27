use std::future::Future;
use futures::stream::FuturesUnordered;
use worker::*;
use worker::Response;
use std::collections::hash_map::DefaultHasher;
use std::hash::Hash;
use std::hash::Hasher;
use futures::{join};
use futures::future::select_all;
use chrono::prelude::*;
use worker_sys::console_log;
use futures::stream::{self, StreamExt};
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::rc::Rc;
extern crate base64;

mod utils;
use utils::{Post, ListPostsResponse};

async fn many<I, F>(iter: I) -> Vec<F::Output>
    where
        I: Iterator<Item=F>,
        F: Future
{
    let pinned_futs: Vec<_> = iter.into_iter().map(Box::pin).collect();
    let mut futs = pinned_futs;
    let mut ret = Vec::new();
    while !futs.is_empty() {
        let (r, _idx, remaining) = select_all(futs).await;
        ret.push(r);
        futs = remaining;
    }
    ret
}


pub async fn get_posts_file(_: Request, ctx: RouteContext<()>) -> Result<Response> {
    let post_files = ctx.kv("POST_FILES")?;
    match ctx.param("title") {
        Some(title) => {
            //Calculate hash of title
            let mut hasher = DefaultHasher::new();
            title.hash(&mut hasher);
            let hash = &hasher.finish().to_string();
            match post_files.get(hash).await? {
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
        None => {
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
        form.get("file")
    )  {
        //Ensure that data is a real field and file' is a real field
        (Some(FormEntry::Field(post_str)), Some(FormEntry::File(buf))) => {
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

                    let posts = ctx.kv("POSTS")?;
                    let post_files = ctx.kv("POST_FILES")?;
                    let timestamp_index = ctx.kv("TIMESTAMP_INDEX")?;
                    let timestamp_user_index = ctx.kv("TIMESTAMP_USER_INDEX")?;

                    //Calculate hash of title
                    let mut hasher = DefaultHasher::new();
                    post.title.hash(&mut hasher);
                    let hash = &hasher.finish().to_string();
                    
                    //Calculate datetime by reverse lexological order
                    let now = Utc::now();
                    post.timestamp = now.to_string();
                    let rev_timestamp = utils::get_lexicographic_datetime(now);

                    //Update POSTS and POST_FILES
                    join!(
                        posts.put(hash, serde_json::to_string(&post)?)?.execute(),
                        post_files.put(
                            hash, base64::encode(buf.bytes().await?)
                        )?.execute(),
                        timestamp_index.put(
                            &format!("{}_{}", rev_timestamp, hash), ""
                        )?.execute(),
                        timestamp_user_index.put(
                            &format!("{}_{}_{}", 0, rev_timestamp, hash), ""
                        )?.execute(),
                    );
                    Response::empty()
                },
                Err(_) => Response::error("Unable to deserialize data", 400),
            }
        },
        _ => Response::error(
            "Unable to deserialize 'data' or 'file' properly.", 400
        ),
    }
}


#[event(fetch, respond_with_errors)]
pub async fn main(req: Request, env: Env) -> Result<Response> {

    // Create an instance of the Router, which can use paramaters (/user/:name) or wildcard values
    // (/file/*pathname). Alternatively, use `Router::with_data(D)` and pass in arbitrary data for
    // routes to access and share using the `ctx.data()` method.
    let router = Router::new();

    let mut response = router
        //Get all posts ordered by most recent
        //sorts the rev_timestamp -> post association
        
        //Get the top n keys on POSTS_TIMESTAMP
        .get_async("/posts/by_time/", get_recent_posts)
        //Get the actual file associated with the post
        .get_async("/posts/file/:title/", get_posts_file)
        //.get_async("/posts/by_user_timestamp/:id/", |req, ctx| async move {
        //    //Get posts of a user orered by most recent
        //    //Query TIMESTAMP_USER_IDX for a list of 
        //    todo!()
        //})
        .post_async("/posts/", post_posts)
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
        r.headers_mut().set("Access-Control-Allow-Origin", "http://localhost:4000").unwrap();
        r
    })
}

//_ is used as a separator
//POSTS
//hash of title -> {title, description, user_id, timestamp, username file}

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

//USERS
//user id_username -> 0

//COMMENTS
//hash of title_rev timestamp_user id_username -> comment
