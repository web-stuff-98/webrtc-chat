import { useNavigate } from "react-router-dom";
import { IUser } from "../../../../server/src/interfaces/interfaces";
import useAuth from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import useUsers from "../../context/UserContext";
import classes from "./Nav.module.scss";

export default function Nav() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const { findUserData } = useUsers()
  const navigate = useNavigate();

  const renderUserInfo = (userData: IUser) => {
    return (
      <>
      {userData && userData.name}
      </>
    )
  }

  return (
    <nav className={classes.container}>
      <div className={classes.navLinks}>
        <div onClick={() => navigate("/")} className={classes.link}>
          Home
        </div>
        {user && (
          <div onClick={() => navigate("/rooms")} className={classes.link}>
            Rooms
          </div>
        )}
                {user && (
          <div onClick={() => navigate("/settings")} className={classes.link}>
            Settings
          </div>
        )}
        {user && (
          <div onClick={() => logout()} className={classes.link}>
            Logout
          </div>
        )}
        {!user && (
          <div onClick={() => navigate("/login")} className={classes.link}>
            Login
          </div>
        )}
        {!user && (
          <div onClick={() => navigate("/register")} className={classes.link}>
            Register
          </div>
        )}
      </div>
      {user && (
        <div className={classes.accInfo}>
          {user && renderUserInfo(findUserData(user.id)!)}
        </div>
      )}
    </nav>
  );
}
