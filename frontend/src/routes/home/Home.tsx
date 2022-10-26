import { useNavigate } from 'react-router-dom';
import useAuth from '../../context/AuthContext';
import classes from './Home.module.scss';

export default function Home() {
  const { user } = useAuth();

  const navigate = useNavigate()

  return (
    <div className={classes.container}>
      <h1>Welcome</h1>
      <p>This is my WebRTC group video chat app. You can open a couple of tabs and login to seperate accounts in each tab to try it out. The usernames are test1 to test4 and the password is test. Its main components are Simple-peer, React, Typescript, Socket.io and Busboy for file upload streams with progress updates.</p>
    </div>
  );
}
