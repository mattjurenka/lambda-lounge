import { configureStore, combineReducers } from '@reduxjs/toolkit'
import posts_reducer, {fetch_next_page, upload_post} from "./posts"
import user_reducer, {show_notification} from "./user"
import { createEpicMiddleware, combineEpics } from "redux-observable"
import {
    fetch_posts_epic, upload_posts_epic, register_epic, check_logged_in_epic,
    delete_post_epic, fetch_user_posts_epic, fetch_saved_posts_epic, save_post_epic,
    unsave_post_epic,
    fetch_next_page_epic
} from './epics'
import {MyEpic} from './types'
import {catchError, EMPTY, of} from 'rxjs'
import {error_notification} from '../components/notifications'


const reducer = combineReducers({
    posts: posts_reducer,
    user: user_reducer
})

const error_handler = (epic: MyEpic): MyEpic => {
    return (action$, state) => epic(action$, state, {}).pipe(
        catchError(err => {
            console.log(err)
            return of(error_notification("Error"))
        })
    )
}

const rootEpic = combineEpics(
    ...[
        upload_posts_epic, fetch_posts_epic, register_epic, check_logged_in_epic,
        delete_post_epic, fetch_user_posts_epic, fetch_saved_posts_epic, save_post_epic,
        unsave_post_epic, fetch_next_page_epic
    ].map(error_handler)
)
const epicMiddleware = createEpicMiddleware()

export const store = configureStore({
    reducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware({
        thunk: false,
        serializableCheck: {
            ignoredActions: [
                upload_post.type, fetch_next_page.type
            ]
        }
    }).concat(epicMiddleware)
})

epicMiddleware.run(rootEpic)

const dependencies = {}

export type RootState = ReturnType<typeof store.getState>
export type MyState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type Dependencies = typeof dependencies
export default store
