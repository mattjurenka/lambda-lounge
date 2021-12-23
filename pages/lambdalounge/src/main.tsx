import React from "react"
import { IonContent, IonPage, IonApp, IonText } from "@ionic/react"
import PostModal from "./components/post_modal"
import PostsScroll from "./components/posts_scroll"
import Header from "./header"

const Main = () => <IonApp>
    <IonPage>
        <IonContent fullscreen>
            <Header />
            <PostModal />
            <PostsScroll />
        </IonContent>
    </IonPage>
</IonApp>

export default Main
