import React from "react"
import { IonContent, IonPage } from "@ionic/react"
import PostModal from "./components/post_modal"
import PostsScroll from "./components/posts_scroll"

const Main = () => <IonPage>
    <IonContent fullscreen>
        <PostModal />
        <PostsScroll />
    </IonContent>
</IonPage>

export default Main
