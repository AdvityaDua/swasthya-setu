import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react'
import {setToken, logout, removeToken} from '../slices/userSlice'

const baseQuery = fetchBaseQuery({
    baseUrl: 'http://127.0.0.1:8000/api/',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        const token = getState().user.token;
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        headers.set('Content-Type', 'application/json');
        return headers;
    }
})

const baseQueryWithRefresh = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    if (result.error && result.error.status === 401 && (result.error.data?.detail === "Authentication credentials were not provided." || result.error.data?.code === "token_not_valid")) {
        console.log("Token expired, refreshing...");
        api.dispatch(removeToken());

        const refreshResult = await baseQuery({
            url: '/auth/refresh-token/',
            method: 'POST',
            credentials: 'include'
        },
            api,
            extraOptions);
        
        if (refreshResult.data){
            console.log("Token refreshed");
            api.dispatch(setToken(refreshResult.data));
            result = await baseQuery(args, api, extraOptions);
        }
        else{
            console.error('Token Refresh Failed. Logging Out.');
            api.dispatch(logout());
        }

    }
    return result;
}

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithRefresh,
    tagTypes: ["User", "Order", "Inventory", "Medicine", "Sale"],
    endpoints: (builder) => ({
    })
})
