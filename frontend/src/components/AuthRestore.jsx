import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useRefreshMutation } from "../app/api/userApiSlice";
import { login as loginAction } from "../app/slices/userSlice";

function dashboardPathForRole(role) {
  switch (role) {
    case "PATIENT":
      return "/patient";
    case "PRACTITIONER":
      return "/practitioner";
    case "DOCTOR":
      return "/doctor";
    default:
      return "/login";
  }
}

/**
 * Runs on app load: calls refresh-token API, restores user state, and redirects
 * from / or /login to the role-specific dashboard when session is recovered.
 * Must be rendered inside BrowserRouter.
 */
export default function AuthRestore({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await refresh();
        if (cancelled) return;
        const data = res?.data;
        if (!data?.access) return;

        dispatch(
          loginAction({
            access: data.access,
            name: data.name,
            role: data.role,
            phone: data.phone,
          })
        );

        const path = location.pathname ?? "";
        const isHomeOrLogin = path === "" || path === "/" || path === "/login";
        if (!isHomeOrLogin) return;

        const target = dashboardPathForRole(data.role);
        if (target !== "/login") navigate(target, { replace: true });
      } catch {
        if (!cancelled) {
          /* no session / invalid refresh — stay on current page */
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  return children;
}

export { dashboardPathForRole };
