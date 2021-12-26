import {IonCard, IonGrid, IonRow, IonText, IonCol, IonIcon, useIonAlert, IonRouterLink} from "@ionic/react"
import {trashOutline} from "ionicons/icons"
import React, { useEffect } from "react"
import {useLLDispatch, useLLSelector} from "../hooks"
import {delete_post, fetch_posts, fetch_user_posts} from "../state/posts"
import URLS from "../urls"
import Masonry from "react-masonry-component"

export default () => {
    const dispatch = useLLDispatch()
    const posts = useLLSelector(s => s.posts.posts)
    const my_username = useLLSelector(s => s.user.username)
    const viewing_user = useLLSelector(s => s.posts.viewing_user)

    const [present] = useIonAlert()

    useEffect(() => {
        dispatch(fetch_posts())
    }, [dispatch])

    return <>
        {viewing_user !== "" ?
        <IonGrid>
            <IonRow>
                <IonCol>
                    <IonText color="secondary">Viewing posts of {viewing_user}.</IonText>
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
        <Masonry>
            {posts.map(({title, description, username}, idx) => <div
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
                            {username == my_username ? 
                            <IonCol size="3" style={{textAlign: "right"}}>
                                <IonIcon
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
                                />
                            </IonCol> : <></>}
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
                                <IonText color="secondary" class="ion-margin-top">
                                    {description}
                                </IonText>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonCard>
            </div>)}
        </Masonry>
    </>
}

