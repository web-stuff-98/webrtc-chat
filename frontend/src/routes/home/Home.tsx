import classes from './Home.module.scss';

export default function Home() {
  return (
    <div className={classes.container}>
      <h1>Welcome</h1>
      <p>This is my simple WebRTC group video chat app. You can open a couple of tabs and login to seperate accounts in each tab to try it out. The usernames are test1 to test4 and the password is test. Its main components are Simple-peer, React, Typescript, Socket.io and Redis.</p>
    </div>
  );
}
