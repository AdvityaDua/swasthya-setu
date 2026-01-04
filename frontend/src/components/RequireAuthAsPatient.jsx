import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function RequireAuthAsPatient() {
    const role = useSelector((state) => state.user.role)
    if (role !== "PATIENT") {
        return <Navigate to="/login" />
    }
    return <Outlet />
}

export default RequireAuthAsPatient;