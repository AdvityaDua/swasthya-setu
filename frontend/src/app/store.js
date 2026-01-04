import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'
import { apiSlice } from './api'
const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        user: userReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
    devTools: true
})

export default store;