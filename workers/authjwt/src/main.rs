use std::env;
use std::time::Instant;
use std::fs;

use actix_web::{get, web, App, HttpRequest, HttpResponse, HttpServer, Responder};
use actix_web::dev::Service;
use actix_web::http::header;
use actix_web::http::header::HeaderValue;
use futures::future::FutureExt;

use mongodb::{
    options::{FindOneAndUpdateOptions, FindOneOptions},
    Client, Collection
};
use mongodb::bson::doc;

use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use serde::{Serialize, Deserialize};
use chrono::prelude::*;
use dotenv;


#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

//Handle creating the JWT of a user
#[get("/auth/{username}")]
async fn auth_username(
    data: web::Data<AppState>,
    path: web::Path<(String,)>
) -> impl Responder {
    let start = Instant::now();
    //Generate a JWT with the sub claim of the username url param
    let expiration = Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .unwrap()
        .timestamp();
    let username = path.into_inner().0;
    let claims = Claims {
        sub: username.clone(),
        exp: expiration as usize,
    };
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(env::var("PRIVATE_KEY").unwrap().as_bytes())
    ).unwrap();
    //Update MongoDB with the time it took to encode the JWT, creating
    //a new document and array if one does not already exist
    data.get_ref().accesses.find_one_and_update(
        doc! { "username": username },
        doc! { "$push": { "auth_times": start.elapsed().as_secs_f64() } },
        FindOneAndUpdateOptions::builder()
            .upsert(true)
            .build()
    ).await.unwrap();
    //Set the user's JWT cookie
    HttpResponse::Ok()
        .append_header(("Set-Cookie", format!(
            "token={}; HttpOnly; Path=/", token
        )))
        .body(env::var("PUBLIC_KEY").unwrap())
}

//Verify that the JWT is legitimate, returning the username if it is
#[get("/verify")]
async fn verify(req: HttpRequest, data: web::Data<AppState>) -> impl Responder {
    let start = Instant::now();
    match req.cookie("token") {
        Some(cookie) => {
            //Verify and decode the claims in the JWT cookie using our private key
            match decode::<Claims>(
                cookie.value(),
                &DecodingKey::from_secret(env::var("PRIVATE_KEY").unwrap().as_bytes()),
                &Validation::default()
            ) {
                Ok(claims) => {
                    //Push the time taken to decode the JWT to MongoDB under
                    //the user's access info document, creating if does not exist
                    data.get_ref().accesses.find_one_and_update(
                        doc! { "username": claims.claims.sub.clone() },
                        doc! { "$push": { "verify_times": start.elapsed().as_secs_f64() } },
                        FindOneAndUpdateOptions::builder()
                            .upsert(true)
                            .build()
                    ).await.unwrap();
                    HttpResponse::Ok()
                        .body(claims.claims.sub)
                },
                Err(_) => {
                    HttpResponse::BadRequest()
                        .reason("Invalid Token")
                        .body("")
                }
            }
        },
        None => {
            HttpResponse::BadRequest()
                .reason("No 'token' Cookie Found")
                .body("")
        }
    }
}

//Get stats about how long it took to encode and decode the JWTs
#[get("/stats")]
async fn stats(req: HttpRequest, data: web::Data<AppState>) -> impl Responder {
    match req.cookie("token") {
        Some(cookie) => {
            //Decode the JWT with our private key
            match decode::<Claims>(
                cookie.value(),
                &DecodingKey::from_secret(env::var("PRIVATE_KEY").unwrap().as_bytes()),
                &Validation::default()
            ) {
                Ok(claims) => {
                    //Query MongoDB for the access_info document
                    match data.get_ref().accesses.find_one(
                        doc!( "username": claims.claims.sub ),
                        FindOneOptions::default()
                    ).await.unwrap() {
                        Some(access_info) => {
                            //Set totals and ns to 0 if not present, otherwise sum and len
                            //of their respective vectors
                            let (total_verify, n_verifies) = match access_info.verify_times {
                                Some(vec) => (vec.iter().sum::<f64>(), vec.len()),
                                None => (0.0, 0)
                            };
                            let (total_auth, n_auths) = match access_info.auth_times {
                                Some(vec) => (vec.iter().sum::<f64>(), vec.len()),
                                None => (0.0, 0)
                            };

                            //Calculate the averages, or set to None if necessary
                            let avg_encode = if n_auths > 0 {
                                Some(total_auth / (n_auths as f64))
                            } else {
                                None
                            };
                            let avg_decode = if n_verifies > 0 {
                                Some(total_verify / (n_verifies as f64))
                            } else {
                                None
                            };
                            let avg_total = if (n_auths + n_verifies) > 0 {
                                Some(
                                    (total_verify + total_auth)
                                    / ((n_auths + n_verifies) as f64)
                                )
                            } else {
                                None
                            };

                            HttpResponse::Ok()
                                .json(PrettyAccessInfo {
                                    avg_auth_encode_seconds: avg_encode,
                                    avg_verify_decode_seconds: avg_decode,
                                    avg_total_ops_seconds: avg_total,
                                })
                        },
                        None => HttpResponse::BadRequest()
                            .reason("Username not found")
                            .body("")
                    }
                },
                Err(_) => {
                    HttpResponse::BadRequest()
                        .reason("Invalid Token")
                        .body("")
                }
            }
        },
        None => {
            HttpResponse::BadRequest()
                .reason("No 'token' Cookie Found")
                .body("")
        }
    }
}

//Serve the static README file
#[get("/README.txt")]
async fn readme(_req: HttpRequest) -> impl Responder {
    HttpResponse::Ok()
        .body(fs::read_to_string("README.txt").unwrap())
}

struct AppState {
    pub accesses: Collection<AccessInfo>,
}

//Represents the document stored in MongoDB
#[derive(Deserialize)]
struct AccessInfo {
    //username: String,
    #[serde(default)]
    auth_times: Option<Vec<f64>>,
    #[serde(default)]
    verify_times: Option<Vec<f64>>
}

//JSON structure returned by /stats
#[derive(Serialize)]
struct PrettyAccessInfo {
    avg_auth_encode_seconds: Option<f64>,
    avg_verify_decode_seconds: Option<f64>,
    avg_total_ops_seconds: Option<f64>
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().unwrap();

    let client_url = env::var("DB_STRING").unwrap();
    let client = Client::with_uri_str(client_url).await.unwrap();
    let accesses = client.database("authjwt").collection::<AccessInfo>("accesses");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(AppState {
                accesses: accesses.clone()
            }))
            .wrap_fn(|req, srv| {
                srv.call(req).map(|res| res.map(|mut r| {
                    r.headers_mut().append(
                        header::ACCESS_CONTROL_ALLOW_ORIGIN,
                        HeaderValue::from_str(&env::var("FRONTEND_URL").unwrap()).unwrap()
                    );
                    r.headers_mut().append(
                        header::ACCESS_CONTROL_ALLOW_CREDENTIALS,
                        HeaderValue::from_str("true").unwrap()
                    );
                    r
                }))
            })
            .service(readme)
            .service(auth_username)
            .service(verify)
            .service(stats)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
