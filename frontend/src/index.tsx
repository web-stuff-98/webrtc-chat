import ReactDOM from "react-dom/client";
import App from "./App";
import React from "react";
import { SocketProvider } from "./context/SocketContext";
import { AuthProvider } from "./context/AuthContext";
import { UsersProvider } from "./context/UserContext";
import { ModalProvider } from "./context/ModalContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <UsersProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </UsersProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
