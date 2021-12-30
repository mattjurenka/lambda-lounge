import React, {useEffect} from "react"
import { IonContent, IonPage, IonApp, IonText } from "@ionic/react"
import PostModal from "./components/post_modal"
import PostsScroll from "./components/posts_scroll"
import Notifications from "./components/notifications"

import Header from "./header"
import {useLLDispatch} from "./hooks"
import {check_logged_in} from "./state/user"
import {SnackbarProvider} from "notistack"

const Main = () => {
    const dispatch = useLLDispatch()
    useEffect(() => {
        dispatch(check_logged_in())
    }, [dispatch])

    return <SnackbarProvider
        classes={{
            variantSuccess: "notistack-success",
            variantError: "notistack-error"
        }}
    >
        <IonApp>
            <IonPage>
                <Notifications/>
                <IonContent fullscreen>
                    <Header />
                    <PostModal />
                    <PostsScroll />
                </IonContent>
            </IonPage>
        </IonApp>
    </SnackbarProvider>
}

export default Main
