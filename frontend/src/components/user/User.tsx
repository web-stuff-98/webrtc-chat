import { IUser } from "../../../../server/src/interfaces/interfaces";

import classes from "./User.module.scss";

import { BiUser } from "react-icons/bi";

export default function User({
  userData,
  customDate,
}: {
  userData: IUser | undefined;
  customDate?: Date;
}) {
  return (
    <div className={classes.container}>
      {userData ? (
        <>
          <div
            style={{ backgroundImage: `url(${userData.pfp})` }}
            className={classes.pfp}
          >
            {userData.pfp ? <></> : <BiUser />}
          </div>
          <div className={classes.text}>
            <div className={classes.name}>{userData.name}</div>
            <div className={classes.dateTime}>
              {customDate && (
                <>
                  {`${("0" + customDate.getHours()).slice(-2)}:${(
                    "0" + customDate.getMinutes()
                  ).slice(-2)}:${("0" + customDate.getSeconds()).slice(-2)}`}
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
