import React, { useState } from "react"
import {
    IonButton, IonInput, IonItem, IonItemDivider, IonList,
    IonModal, IonTextarea, IonTitle, IonText
} from "@ionic/react"
import {useLLDispatch} from "../hooks"
import {upload_post} from "../state/posts"
import { useImmer } from "use-immer"

const default_validation = {
    title: "",
    description: "",
    file: ""
}

interface ShowErrorProps {
    errors: {[field: string]: string | undefined},
    field: string
}
const ShowError = ({ errors, field }: ShowErrorProps) =>
    (errors[field] || "") != "" ? <IonText color="danger">{errors[field]}</IonText> : <></>

export default () => {
    const dispatch = useLLDispatch()
    const [is_open, set_is_open] = useState(false)
    const [title, set_title] = useState<string>("")
    const [description, set_description] = useState<string>("")
    const [file, set_file] = useState<File | null>(null)
    const [errors, update_errors] = useImmer(default_validation)
    return <>
        <IonButton
            expand="block"
            onClick={_ => set_is_open(true)}
        >
            POST
        </IonButton>
        <IonModal isOpen={is_open} onDidDismiss={_ => set_is_open(false)}>
            <IonItem>
                <IonInput
                    value={title}
                    placeholder="Title"
                    onIonChange={e => set_title(e.detail.value || "")}
                    maxlength={120}
                />
                <ShowError errors={errors} field="title" />
            </IonItem>
            <IonItem>
                <IonTextarea
                    autoGrow
                    value={description}
                    placeholder="Description"
                    onIonChange={e => set_description(e.detail.value || "")}
                    maxlength={1028}
                />
                <ShowError errors={errors} field="description" />
            </IonItem>
            <IonItem>
                <input
                    type="file"
                    name="file"
                    onChange={e => set_file(e.target.files?.item(0) || null)}
                />
                <ShowError errors={errors} field="file" />
            </IonItem>
            <IonButton color="danger" onClick={_ => set_is_open(false)}>CANCEL</IonButton>
            <IonButton onClick={_ => {
                if (file == null) {
                    update_errors(errors => {errors.file = "No File Uploaded"})
                } else if (file.size > 5000000) {
                    update_errors(errors => {errors.file = "File cannot be over 5 MB"})
                }
                if (title.length > 120) {
                    update_errors(errors =>
                        {errors.title = "Title cannot exceed 120 characters"})
                } else if (title.length <= 0) {
                    update_errors(errors => {errors.title = "Title cannot be empty"})
                }
                if (description.length > 1028) {
                    update_errors(errors =>
                        {errors.description = "Description cannot exceed 1028 characters"})
                } else if (description.length <= 0) {
                    update_errors(errors =>
                        {errors.description = "Description cannot be empty"})
                }


                console.log("clicked")
                console.log(errors)
                if (errors.file == "" && errors.description == "" && errors.title == "") {
                    console.log("dispatched")
                    dispatch(upload_post({
                        title, description,
                        file: (file as File)
                    }))
                    set_is_open(false)
                }
            }}>POST</IonButton>
        </IonModal>
    </>
}
