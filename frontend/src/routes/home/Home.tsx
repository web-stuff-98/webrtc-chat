import classes from "./Home.module.scss";

export default function Home() {
  return (
    <div className={classes.container}>
      <div className={classes.text}>
      <h1>Welcome</h1>
      <p>
        This is my WebRTC group video chat app. You can log in to different tabs to try it out, there are 4 example accounts named test1-4 and the password is test. You can also send file attachments, watch video attachments in your browser and see upload progress.
      </p>
      <p>
        When all clients connected to a room leave, attachments are deleted for that room. Messages are not stored. New accounts and rooms will be deleted automatically after 20 minutes, regardless of if you are logged in.
      </p>
      </div>
      <div className={classes.icons}>
        <img alt="Socket-IO" src="./moduleIcons/socket-io-icon.png"/>
        <img alt="Redis" src="./moduleIcons/redis-icon.png"/>
        <img alt="WebRTC" src="./moduleIcons/webrtc.png"/>
        <img alt="React" src="./moduleIcons/react-icon.png"/>
        <img alt="AWS Cloudfront" src="./moduleIcons/aws-cloudfront.png"/>
        <img alt="AWS S3" src="./moduleIcons/aws-s3.png"/>
      </div>
    </div>
  );
}
