import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function RequireAuthAsPractitioner() {
    const role = useSelector((state) => state.user.role)
    if (role !== "PRACTITIONER") {
        return <Navigate to="/login" />
    }
    return <Outlet />
}

export default RequireAuthAsPractitioner;