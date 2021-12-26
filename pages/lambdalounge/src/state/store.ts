import { configureStore, combineReducers } from '@reduxjs/toolkit'
import posts_reducer, {upload_post} from "./posts"
import user_reducer from "./user"
import { createEpicMiddleware, combineEpics } from "redux-observable"
import {
    fetch_posts_epic, upload_posts_epic, register_epic, check_logged_in_epic,
    delete_post_epic, fetch_user_posts_epic
} from './epics'
import {MyEpic} from './types'
import {catchError, EMPTY} from 'rxjs'


const reducer = combineReducers({
    posts: posts_reducer,
    user: user_reducer
})

const error_handler = (epic: MyEpic): MyEpic => {
    return (action$, state) => epic(action$, state, {}).pipe(
        catchError(err => {
            console.log(err)
            return EMPTY
        })
    )
}

const rootEpic = combineEpics(
    ...[
        upload_posts_epic, fetch_posts_epic, register_epic, check_logged_in_epic,
        delete_post_epic, fetch_user_posts_epic
    ].map(error_handler)
)
const epicMiddleware = createEpicMiddleware()

export const store = configureStore({
    reducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware({
        thunk: false,
        serializableCheck: {
            ignoredActions: [
                upload_post.type
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
