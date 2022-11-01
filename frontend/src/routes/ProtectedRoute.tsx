import { IUser } from "../interfaces/interfaces";
import { Navigate } from "react-router-dom";

export type ProtectedRouteProps = {
  user?: IUser;
  redirectPath: string;
  outlet: JSX.Element;
};

const ProtectedRoute = ({
  user,
  redirectPath = "/",
  outlet,
}: ProtectedRouteProps) => {
  if (!user) {
    return <Navigate to={{ pathname: redirectPath }} />;
  }
  return outlet;
};

export default ProtectedRoute;
