use worker::*;
use std::collections::hash_map::DefaultHasher;
use std::hash::Hash;
use std::hash::Hasher;
use futures::join;
use futures::future::join_all;
use chrono::prelude::*;

mod utils;
use utils::{Post, ListPostsResponse};


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
    let post_responses = join_all(
        posts_list.keys.iter().map(|key| posts.get(&key.name))
    ).await;
    let posts: Vec<Post> = post_responses.into_iter()
        .filter_map(|res| res.ok())
        .filter_map(|opt| opt)
        .filter_map(|value| value.as_json::<Post>().ok())
        .collect();
    let response = ListPostsResponse::new(posts, &posts_list.cursor.unwrap_or("".to_string()));
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
                        posts.put(hash, post_str)?.execute(),
                        post_files.put(hash, buf.bytes().await?)?.execute(),
                        timestamp_index.put(
                            &format!("{}:{}", rev_timestamp, hash), ""
                        )?.execute(),
                        timestamp_user_index.put(
                            &format!("{}:{}:{}", 0, rev_timestamp, hash), ""
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

    router
        .get_async("/posts/by_time/", |_req, _ctx| async move {
            //Get all posts ordered by most recent
            //sorts the rev_timestamp -> post association
            
            //Get the top n keys on POSTS_TIMESTAMP
            //Make paginated

            Response::ok("Hello World")
        })
        .get_async("/posts/file/:id/", |req, ctx| async move {
            //Get the actual file associated with the post
            todo!()
        })
        .get_async("/posts/by_user_timestamp/:id/", |req, ctx| async move {
            //Get posts of a user orered by most recent
            //Query TIMESTAMP_USER_IDX for a list of 
            todo!()
        })
        .post_async("/posts/", post_posts)
        .get_async("/saved/check/:id/", |mut req, ctx| async move {
            //Takes a user id, and a list of posts in the query param
            //and returns the posts in that list that are saved
            
            //query SAVED_TIMESTAMP_HASH for a list of all posts saved by user
            //respond with a comma seperated list of title hashes
            todo!()
        })
        .get_async("/saved/:id/", |mut req, ctx| async move {
            //Takes a user ID and returns all posts in most recent saved order

            //query SAVED_TIMESTAMP_IDX, which returns a list of all saved title
            //hashes sorted by most to least recent

            //Query posts and posts_file for each hash to get the actual post
            todo!()
        })
        .post_async("/save/:uid/:pid/", |mut req, ctx| async move {
            //Mark user with uid as saving pid

            //Set SAVED and SAVED_TIMESTAMP_IDX with the appropriate values
            todo!()
        })
        .get_async("/comments/:pid/", |mut req, ctx| async move {
            //Return all comments on a post

            //list COMMENTS to get a sorted list of comments, then query again
            //to get the actual comments and user info
            todo!()
        })
        .post_async("/comment/:uid/:pid/", |mut req, ctx| async move {
            //Mark user with uid with commenting on pid with comment as a query param

            //Set COMMENTS and SAVED_TIMESTAMP_IDX with the appropriate value
            //for each key, query for the comment again
            todo!()
        })
        .run(req, env).await
}

//POSTS
//hash_of_title -> 
//hash_of_title -> {title, description, user_id, timestamp, username file}
//ex.

//POSTS_FILE
//hash_of_title -> <img file>

//TIMESTAMP_INDEX
//rev_timestamp:hash_of_title -> 0

//TIMESTAMP_USER_INDEX
//user_id:timestamp:hash_of_title -> 0

//SAVED
//user_id:hash_of_title -> 0

//SAVED_TIMESTAMP_IDX
//user_id:rev_timestamp:hash_of_title -> 0

//USERS
//user_id:username -> 0

//COMMENTS
//hash_of_title:rev_timestamp:user_id:username -> comment
