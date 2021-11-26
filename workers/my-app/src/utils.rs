use cfg_if::cfg_if;
use worker::*;
use serde::{Deserialize, Serialize};
use chrono::prelude::*;
use std::char::from_digit;

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

#[derive(Deserialize, Serialize)]
pub struct Post {
    pub title: String,
    pub description: String,
    pub user_id: u64,
    pub username: String,
    #[serde(default)]
    pub timestamp: String,
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
