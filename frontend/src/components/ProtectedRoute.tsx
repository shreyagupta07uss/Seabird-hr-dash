import { Navigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #e2e8f0",
            borderTop: "3px solid #1e3a5f",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}