use cfg_if::cfg_if;
use worker::*;
use serde::{Deserialize, Serialize};
use chrono::prelude::*;
use std::char::from_digit;
use std::collections::hash_map::DefaultHasher;
use std::hash::Hash;
use std::hash::Hasher;

cfg_if! {
    // https://github.com/rustwasm/console_error_panic_hook#readme
    if #[cfg(feature = "console_error_panic_hook")] {
        extern crate console_error_panic_hook;
        pub use self::console_error_panic_hook::set_once as set_panic_hook;
    } else {
        #[inline]
        pub fn set_panic_hook() {}
    }
}

cfg_if! {
    // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
    // allocator.
    if #[cfg(feature = "wee_alloc")] {
        extern crate wee_alloc;
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

//Get the 9-complement of datetime
pub fn get_lexicographic_datetime(now: DateTime<Utc>) -> String {
    now.to_string().chars()
        .filter_map(|c| match c.to_digit(10) {
            Some(d) => from_digit(9 - d, 10),
            None => Some(c)
        })
        .collect::<String>()
}

//Calculate the hash of a post that is used as the post id
pub fn calculate_hash(username: &String, title: &String) -> String {
    let mut hasher = DefaultHasher::new();
    username.hash(&mut hasher);
    title.hash(&mut hasher);
    hasher.finish().to_string()
}

//Get the cursor query param from a request
pub fn get_cursor(req: &Request) -> Option<String> {
    req.url().ok().and_then(|url| url.query_pairs()
        .into_iter()
        .find(|pair| pair.0 == "cursor")
        .map(|(_, value)| value.into()))
}

#[derive(Deserialize, Serialize)]
pub struct Post {
    pub title: String,
    pub description: String,
    #[serde(default)]
    pub username: String,
    #[serde(default)]
    pub timestamp: String,
    #[serde(default)]
    pub saved: Option<bool>,
    #[serde(default)]
    pub saved_timestamp: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct ListPostsResponse {
    pub posts: Vec<Post>,
    pub cursor: String,
}

impl ListPostsResponse {
    pub fn new(posts: Vec<Post>, cursor: &str) -> Self {
        ListPostsResponse {
            posts,
            cursor: cursor.to_string(),
        }
    }
}
