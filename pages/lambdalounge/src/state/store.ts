import { configureStore, combineReducers } from '@reduxjs/toolkit'
import posts_reducer from "./posts"
import { createEpicMiddleware, combineEpics } from "redux-observable"


const reducer = combineReducers({
    posts: posts_reducer
})


const rootEpic = combineEpics()
const epicMiddleware = createEpicMiddleware()

export const store = configureStore({
    reducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(epicMiddleware)
})

epicMiddleware.run(rootEpic)

const dependencies = {}

export type RootState = ReturnType<typeof store.getState>
export type MyState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type Dependencies = typeof dependencies
export default store
