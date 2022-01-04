import {IonCard, IonGrid, IonRow, IonText, IonCol, IonIcon, useIonAlert, IonRouterLink, useIonModal, IonButton, IonInfiniteScroll, IonInfiniteScrollContent} from "@ionic/react"
import {trash, bookmarkOutline, bookmark} from "ionicons/icons"
import React, { useEffect, useState } from "react"
import useWindowDimensions, {useLLDispatch, useLLSelector} from "../hooks"
import {
    delete_post, fetch_next_page, fetch_posts, fetch_user_posts, save_post, unsave_post
} from "../state/posts"
import URLS from "../urls"
import Masonry from "react-masonry-component"
import {InfiniteScrollCustomEvent} from "../types"

const ImageModal: React.FC<{
    url: string,
    close: () => void
}> = ({ url, close }) => <IonGrid style={{
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "center",
    alignItems: "end"
}}>
    <IonRow>
        <IonCol>
            <img
                src={url}
                style={{objectFit: "contain"}}
            />
        </IonCol>
    </IonRow>
    <IonRow>
        <IonCol>
            <IonButton onClick={_ => close()} color="primary">CLOSE</IonButton>
        </IonCol>
    </IonRow>
</IonGrid>

export default () => {
    const { width } = useWindowDimensions()

    const dispatch = useLLDispatch()
    const posts = useLLSelector(s => s.posts.posts)
    const my_username = useLLSelector(s => s.user.username)
    const viewing_mode = useLLSelector(s => s.posts.viewing_mode)

    const [modal_image, set_modal_image] = useState("")

    const [present] = useIonAlert()

    const handleDismiss = () => dismissViewer()
    const [presentViewer, dismissViewer] = useIonModal(ImageModal, {
        url: modal_image,
        close: handleDismiss
    })

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
            {posts.map(({title, description, username, saved, timestamp}, idx) => <div
                key={idx}
                style={{
                    width: width >= 1200 ? "33%" :
                        width >= 720 ? "50%" : "100%",
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
                            <IonCol size="11">
                                <IonText
                                    class="ion-margin-top"
                                    color="secondary"
                                >
                                    By 
                                    <IonRouterLink
                                        onClick={_ => dispatch(fetch_user_posts(username))}
                                        style={{marginLeft: "0.5em"}}
                                    >
                                        {username}
                                    </IonRouterLink>
                                    <span style={{marginLeft: "0.5em"}}>
                                    | {(timestamp as string).split(" ")[0]}
                                    </span>
                                </IonText>
                            </IonCol>
                            <IonCol size="1" style={{textAlign: "right"}}>
                                {username == my_username ? 
                                <IonIcon
                                    style={{
                                        cursor: "pointer",
                                        color: "var(--danger)"
                                    }}
                                    icon={trash}
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
                                    style={{
                                        maxWidth: "100%",
                                        cursor: "pointer"
                                    }}
                                    src={URLS.POST_FILE(username, title)}
                                    onClick={_ => {
                                        set_modal_image(URLS.POST_FILE(username, title))
                                        presentViewer({
                                            cssClass: "image-modal"
                                        })
                                    }}
                                />
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                               <IonText
                                    color="secondary"
                                    class="ion-margin-top"
                                >
                                    {description}
                                </IonText>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonCard>
            </div>)}
        </Masonry>}
        <IonInfiniteScroll
            onIonInfinite={e => dispatch(fetch_next_page(e as InfiniteScrollCustomEvent))}
        >
            <IonInfiniteScrollContent />
        </IonInfiniteScroll>
    </>
}

