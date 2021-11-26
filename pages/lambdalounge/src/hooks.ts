import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "./state/store"

export const useLLDispatch = () => useDispatch<AppDispatch>()
export const useLLSelector: TypedUseSelectorHook<RootState> = useSelector
