import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    token: null,
    fullName: null,
    phone: null,
    role: null
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        login: (state, action) => {
            state.fullName = action.payload.name
            state.token = action.payload.access
            state.phone = action.payload.phone
            state.role = action.payload.role
        },
        logout: (state) => {
            state.fullName = null
            state.token = null
            state.phone = null
            state.role = null
        },
        setToken: (state, action) => {
            state.token = action.payload.access
        },
        removeToken: (state) => {
            state.token = null
        },
    }
})

export const { login, logout, setToken, removeToken} = userSlice.actions;

export default userSlice.reducer

export const selectUserName = (state) => state.user.name