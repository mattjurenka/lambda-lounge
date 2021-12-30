import React, { useState } from "react"
import {
    IonButton, IonInput, IonItem, IonItemDivider, IonList,
    IonModal, IonTextarea, IonTitle, IonText, IonGrid, IonRow, IonCol, IonRouterLink
} from "@ionic/react"
import {useLLDispatch, useLLSelector} from "../hooks"
import {close_modal, fetch_saved_posts, fetch_user_posts, open_modal, upload_post} from "../state/posts"
import {register} from "../state/user"

const ShowError = (props: {error: string}) =>
    props.error !== "" ? 
        <IonRow><IonCol><IonText color="danger">
            {props.error}
        </IonText></IonCol></IonRow> : <></>

export default () => {
    const dispatch = useLLDispatch()

    const [title, set_title] = useState<string>("")
    const [description, set_description] = useState<string>("")
    const [file, set_file] = useState<File | null>(null)
    const errors = useLLSelector(state => state.posts.post_validation_errors)
    const is_open = useLLSelector(state => state.posts.post_modal_open)

    const username = useLLSelector(state => state.user.username)
    const [new_username, set_new_username] = useState("")

    const label_ref = React.useRef<HTMLLabelElement>(null)

    return <>
        <IonGrid>
            <IonRow>
                <IonCol style={{
                    display: "flex",
                    alignItems: "center"
                }}>
                {username == "" ?
                [
                    <IonInput
                        key={0}
                        value={new_username}
                        onIonChange={e => set_new_username(e.detail.value || "")}
                    />,
                    <IonButton
                        key={1}
                        color="primary"
                        onClick={_ => dispatch(register(new_username))}
                    >
                        LOGIN
                    </IonButton>
                ] :
                [
                    <IonText key={0} color="secondary">
                        Logged in as
                        <IonText
                            class="ion-margin-top"
                            color="secondary"
                            style={{marginLeft: "0.5em", marginRight: "0.5em"}}
                        >
                            <IonRouterLink
                                onClick={_ => dispatch(fetch_user_posts(username))}
                            >
                                {username}
                            </IonRouterLink>
                        </IonText>
                        |
                        <IonText
                            class="ion-margin-top"
                            color="secondary"
                            style={{marginLeft: "0.5em", marginRight: "0.5em"}}
                        >
                            <IonRouterLink
                                onClick={_ => dispatch(fetch_saved_posts())}
                            >
                                Saved Posts
                            </IonRouterLink>
                        </IonText>

                    </IonText>,
                    <IonButton
                        key={1}
                        expand="block"
                        color="primary"
                        onClick={_ => dispatch(open_modal())}
                        style={{
                            marginLeft: "auto",
                            width: "256px"
                        }}
                    >
                        POST
                    </IonButton>
                ]
                }
                </IonCol>
            </IonRow>
        </IonGrid>
        <IonModal isOpen={is_open} onDidDismiss={_ => dispatch(close_modal())}>
            <IonGrid class="ion-padding" style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}>
                <IonRow>
                    <IonCol>
                        <IonText
                            color="secondary"
                            class="subheader"
                        >Share your creation</IonText>
                    </IonCol>
                </IonRow>
                <IonRow>
                    <IonCol>
                        <IonInput
                            value={title}
                            placeholder="Title"
                            onIonChange={e => set_title(e.detail.value || "")}
                            maxlength={120}
                        />
                    </IonCol>
                </IonRow>
                <ShowError error={errors.title} />
                <IonRow>
                    <IonCol>
                        <IonTextarea
                            value={description}
                            placeholder="Description"
                            onIonChange={e => set_description(e.detail.value || "")}
                            maxlength={1028}
                            rows={8}
                        />
                    </IonCol>
                </IonRow>
                <ShowError error={errors.description} />
                <IonRow>
                    <IonCol>
                        <input
                            type="file"
                            name="file"
                            id="fileInput"
                            onChange={e => set_file(e.target.files?.item(0) || null)}
                            style={{
                                display: "none"
                            }}
                        />
                        <label
                            htmlFor="fileInput"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1em"
                            }}
                            ref={label_ref}
                        >
                            <IonButton
                                color="primary"
                                onClick={_ => label_ref.current?.click()}
                            >
                                UPLOAD
                            </IonButton>
                            <IonText color="secondary">{file?.name || "Select A File"}</IonText>
                        </label>
                    </IonCol>
                </IonRow>
                <ShowError error={errors.file} />
                <IonRow style={{
                    marginTop: "auto"
                }}>
                    <IonCol>
                        <IonText color="secondary">
                            It could take up to a minute to see your post
                            appear in your feed.
                        </IonText>
                    </IonCol>
                </IonRow>
                <IonRow>
                    <IonCol size="4">
                        <IonButton
                            color="danger"
                            onClick={_ => dispatch(close_modal())}
                            style={{width: "100%"}}
                        >
                            CANCEL
                        </IonButton>
                    </IonCol>
                    <IonCol size="8">
                        <IonButton
                            color="primary"
                            style={{width: "100%"}}
                            onClick={_ => {
                                dispatch(upload_post({
                                    title, description, file
                                }))
                            }}
                        >
                            POST
                        </IonButton>
                    </IonCol>
                </IonRow>
            </IonGrid>
        </IonModal>
    </>
}
