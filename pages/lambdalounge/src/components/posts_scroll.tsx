import {IonCard, IonGrid, IonRow, IonText} from "@ionic/react"
import React, { useEffect } from "react"
import {useLLDispatch, useLLSelector} from "../hooks"
import {fetch_posts} from "../state/posts"
import URLS from "../urls"
import Masonry from "react-masonry-component"

export default () => {
    const dispatch = useLLDispatch()
    const posts = useLLSelector(s => s.posts.posts)

    useEffect(() => {
        dispatch(fetch_posts())
    }, [dispatch])

    return <Masonry>
        {posts.map(post => <div
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
                        <IonText class="subheader">{post.title}</IonText>
                    </IonRow>
                    <IonRow>
                        <IonText class="ion-margin-top">By {post.username}</IonText>
                    </IonRow>
                    <IonRow>
                    <img
                        className="ion-margin-top"
                        style={{
                            maxWidth: "100%"
                        }}
                        src={URLS.POST_FILE(post.title)}
                    />
                    </IonRow>
                    <IonRow>
                        <IonText class="ion-margin-top">{post.description}</IonText>
                    </IonRow>
                </IonGrid>
            </IonCard>
        </div>)}
    </Masonry>
}

