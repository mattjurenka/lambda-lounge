import React, {useEffect} from "react"
import { IonContent, IonPage, IonApp, IonText } from "@ionic/react"
import PostModal from "./components/post_modal"
import PostsScroll from "./components/posts_scroll"
import Header from "./header"
import {useLLDispatch} from "./hooks"
import {check_logged_in} from "./state/user"

const Main = () => {
    const dispatch = useLLDispatch()
    useEffect(() => {
        dispatch(check_logged_in())
    }, [dispatch])

    return <IonApp>
        <IonPage>
            <IonContent fullscreen>
                <Header />
                <PostModal />
                <PostsScroll />
            </IonContent>
        </IonPage>
    </IonApp>
}

export default Main
