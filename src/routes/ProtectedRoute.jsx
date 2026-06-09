import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ allowedRoles }) => {
  const { token, role } = useSelector((s) => s.auth);

  // Check for token presence - if we have a token, user is authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/portfolio" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;