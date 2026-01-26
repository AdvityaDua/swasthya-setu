import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function RequireAuthAsPractitioner() {
    const role = useSelector((state) => state.user.role)
    if (role !== "DOCTOR") {
        return <Navigate to="/login" />
    }
    return <Outlet />
}

export default RequireAuthAsPractitioner;