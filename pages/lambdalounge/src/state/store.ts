import { configureStore, combineReducers } from '@reduxjs/toolkit'
import posts_reducer, {upload_post} from "./posts"
import { createEpicMiddleware, combineEpics } from "redux-observable"
import {fetch_posts_epic, upload_posts_epic} from './epics'


const reducer = combineReducers({
    posts: posts_reducer
})


const rootEpic = combineEpics(
    upload_posts_epic, fetch_posts_epic
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
