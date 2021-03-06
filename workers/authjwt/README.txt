Lambda Lounge is a social mini-blog platform made for coding enthusiasts to
share code snippets, design patterns, and other ideas related to functional
programming. The main feature is the ability for users to post an image along
with a short description. Users can view the post history of others, save posts
to be easily found later, and delete their own posts in case they change their
mind about an idea.

The frontend is focused around a Pinterest-like Masonry layout that infinitely
scrolls by triggering loading more posts when the user scrolls to the bottom of
the screen. The page starts with a header of the words "Lambda Lounge" in orange,
surrounded by a wall of randomly-generated grey text. Next is the posts modal,
which handles authentication, controlling the view of posts, and of course post
upload. The color pallet was created by starting with the Cloudflare orange and
adding dark greys until I had a nice dark theme.

The first major problem I ran into was figuring out how to store posts using the
KV store, specifically of how to retrieve posts in such a way that they could be
retrieved both newest first and newest first of a specific user. I solved this
problem by maintaining two "Index" KV namespaces, TIMESTAMP_INDEX and
TIMESTAMP_USER_INDEX. TIMESTAMP_INDEX has strings of the format
{timestamp}_{posthash}. This way, using a list operation of TIMESTAMP_INDEX
returns each posthash in most-recent order. The posthash is generated by hashing
the author's username followed by the post title, and is used as a key for the
POSTS namespace, which has the actual post data as its value. 
TIMESTAMP_USER_INDEX has keys of the form {username}_{timestamp}_{postshash},
which allows listing posts of a specific user newest first by adding the username
as a prefix filter to the list operator. SAVED_TIMESTAMP_INDEX works in the same
way to list saved posts.

One important detail is that we don't actually store the timestamp in the key.
Because timestamps are oldest to newest in lexicographical order, this would
result in the wrong ordering by the list query. Instead, we store the 9's
complement of the timestamp, where you replace each numeric character of the
timestamp x with 9 - x. For example, 48:103 becomes 51:896. This has the effect
of reversing the topography of the set of timestamps under the lexicographic
less than operation, reversing the order at which keys are retrieved.

Initially I wanted to write the auth server using Cloudflare Workers so I could 
have a fully functional demo without needing to have my laptop on. One problem 
I ran into is that Workers places heavy restrictions on the timing APIs in order 
to prevent timing attacks. For instance, while trying to use the auth_jwt library
I got a performance.now is not defined error. I eventually figured out that you
could use the Reflect library in js-sys, allowing me to polyfill performance.now
with Date.now. The above screenshot shows this code as a solution to the
stackoverflow post I made, which at time of writing is the number one Google
search result for ???webassembly polyfill rust???. I had to abandon this and switch
to Actix when I realized that the timing attack restrictions on Date.now accuracy
meant I couldn???t use it to correctly collect info for the /stats endpoint.

I still wanted to be able to have it run when I turned off my computer, so I
am currently hosting the auth on Ubuntu, on the cheapest Vultr cloud box
available. It uses MongoDB to store the timing information for /stats,
hosted on the free tier of MongoDB Atlas. Previously I had reservations about
MongoDB not having an enforced data scheme, but now I believe that scheme is
better enforced as typing on the driver library. MongoDB easily has the best
native query language of any DB I've used, way better than SQL.

New Frameworks/Technologies Used:
worker-rs
cloudflared tunnel
  -- I used ngrok for this in the past, but cloudflared is better
Actix
Rust compiled to WASM
Ion Framework
  -- I have always used Material UI, and will probably continue to use MUI in
     the future. I dislike that Ionic doesn't normal HTML elements, which
     hurts accessibility. I also prefer the MUI theming and documentation.

I spent a significant amount of time on this project, probably way more than I
really needed to. I started at the beginning of thanksgiving break, and kept
working on it intermittently until today, Jan 3rd. Even if I don't end up at
Cloudflare, I'm happy I did this project to the level of quality I did, I
learned a ton about a bunch of different topics, from distributed design to
WASM to the semantics of cookies and CORS. Even though I do reasonably well
in school, the vast majority of my learning comes from personal projects like
this one, and lambda lounge is no exception.
