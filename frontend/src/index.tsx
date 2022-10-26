import ReactDOM from "react-dom/client";
import App from "./App";
import { SocketProvider } from "./context/SocketContext";
import { AuthProvider } from "./context/AuthContext";
import { UsersProvider } from "./context/UserContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <AuthProvider>
    <SocketProvider>
      <UsersProvider>
        <App />
      </UsersProvider>
    </SocketProvider>
  </AuthProvider>
);
