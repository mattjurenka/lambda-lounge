import {IonCard, IonGrid, IonRow, IonText, IonCol, IonIcon, useIonAlert, IonRouterLink} from "@ionic/react"
import {trashOutline, bookmarkOutline, bookmark} from "ionicons/icons"
import React, { useEffect, useState } from "react"
import {useLLDispatch, useLLSelector} from "../hooks"
import {
    delete_post, fetch_posts, fetch_user_posts, save_post, unsave_post
} from "../state/posts"
import URLS from "../urls"
import Masonry from "react-masonry-component"

const ReadMore = (props: { description: string }) => {
    const [collapsed, set_collapsed] = useState(true)
    return <IonText
        color="secondary"
        class="ion-margin-top"
    >
        {collapsed ? 
        <>
            {props.description.slice(0, 128)}...
            <br />
            <br />
            {props.description.length > 128 ? <IonText
                class="ion-margin-top"
                color="primary"
            >
                <IonRouterLink onClick={_ => set_collapsed(false)}>
                    Read More
                </IonRouterLink>
            </IonText> : ""}
        </> :
        props.description}
    </IonText>
}

export default () => {
    const dispatch = useLLDispatch()
    const posts = useLLSelector(s => s.posts.posts)
    const my_username = useLLSelector(s => s.user.username)
    const viewing_mode = useLLSelector(s => s.posts.viewing_mode)

    const [present] = useIonAlert()

    useEffect(() => {
        dispatch(fetch_posts())
    }, [dispatch])

    return <>
        {viewing_mode[0] === "user" ?
        <IonGrid>
            <IonRow>
                <IonCol>
                    <IonText color="secondary">Viewing posts by {viewing_mode[1]}.</IonText>
                </IonCol>
                <IonCol style={{
                    textAlign: "right"
                }}>
                    <IonRouterLink
                        onClick={_ => dispatch(fetch_posts())}
                    >Reset</IonRouterLink>
                </IonCol>
            </IonRow>
        </IonGrid> : <></>}
        {viewing_mode[0] === "saved" ?
        <IonGrid>
            <IonRow>
                <IonCol>
                    <IonText color="secondary">Viewing your saved posts.</IonText>
                </IonCol>
                <IonCol style={{
                    textAlign: "right"
                }}>
                    <IonRouterLink
                        onClick={_ => dispatch(fetch_posts())}
                    >Reset</IonRouterLink>
                </IonCol>
            </IonRow>
        </IonGrid> : <></>}
        {(posts === undefined || posts.length <= 0) ?
        <IonGrid>
            <IonRow>
                <IonCol style={{
                    textAlign: "center",
                    paddingTop: "4em",
                }}>
                    <IonText color="secondary">No Posts Found :(</IonText>
                </IonCol>
            </IonRow>
        </IonGrid> :
        <Masonry>
            {posts.map(({title, description, username, saved}, idx) => <div
                key={idx}
                style={{
                    width: "50%",
                    margin: "0px"
                }}
            >
                <IonCard style={{
                    backgroundColor: "var(--light-grey)",
                    padding: "1.5em"
                }}>
                    <IonGrid>
                        <IonRow>
                            <IonCol>
                                <IonText
                                    class="subheader"
                                    color="secondary"
                                >{title}</IonText>
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol size="9">
                                <IonText
                                    class="ion-margin-top"
                                    color="secondary"
                                >
                                    <IonRouterLink
                                        onClick={_ => dispatch(fetch_user_posts(username))}
                                    >
                                        By {username}
                                    </IonRouterLink>
                                </IonText>
                            </IonCol>
                            <IonCol size="3" style={{textAlign: "right"}}>
                                {username == my_username ? 
                                <IonIcon
                                    style={{
                                        cursor: "pointer",
                                        color: "var(--danger)"
                                    }}
                                    icon={trashOutline}
                                    onClick={_ => present(
                                        "Do you really want to delete this post? \
                                            This cannot be undone.",
                                        [
                                            {text: "Cancel"},
                                            {
                                                text: "Ok",
                                                handler: _ => dispatch(delete_post(title))
                                            },
                                        ]
                                    )}
                                /> : saved === true ?
                                <IonIcon
                                    icon={bookmark}
                                    style={{
                                        cursor: "pointer"
                                    }}
                                    onClick={_ => present(
                                        "Do you really want to unsave this post?",
                                        [
                                            {text: "Cancel"},
                                            {
                                                text: "Ok",
                                                handler: _ => dispatch(unsave_post({
                                                    title, username
                                                }))
                                            },
                                        ]
                                    )}
                                /> :
                                <IonIcon
                                    icon={bookmarkOutline}
                                    style={{
                                        cursor: "pointer"
                                    }}
                                    onClick={_ => dispatch(save_post({
                                        username, title
                                    }))}
                                />}
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                                <img
                                    className="ion-margin-top"
                                    style={{
                                        maxWidth: "100%"
                                    }}
                                    src={URLS.POST_FILE(username, title)}
                                />
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                                <ReadMore description={description} />
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonCard>
            </div>)}
        </Masonry>}
    </>
}

