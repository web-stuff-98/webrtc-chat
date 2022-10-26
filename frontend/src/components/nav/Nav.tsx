import { useNavigate } from "react-router-dom";
import useAuth from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import classes from "./Nav.module.scss";

export default function Nav() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

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
          {user && user.id}
          <br />
          {socket && socket.id}
        </div>
      )}
    </nav>
  );
}
