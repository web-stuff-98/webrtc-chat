import classes from "./Settings.module.scss";
import formClasses from "../../FormClasses.module.scss";
import { IResMsg, IUser } from "../../../../server/src/interfaces/interfaces";

import { useEffect, useRef, ChangeEvent, useState } from "react";

import { BiUser } from "react-icons/bi";
import useAuth from "../../context/AuthContext";
import useUsers from "../../context/UserContext";

export default function Settings() {
  const { user } = useAuth();
  const { findUserData, cacheUserData } = useUsers();

  useEffect(() => {
    cacheUserData(user.id);
  }, [user]);

  const [resMsg, setResMsg] = useState<IResMsg>({
    msg: "",
    err: false,
    pen: false,
  });

  const [base64pfp, setBase64pfp] = useState("");
  const handlePfpInput = (e: ChangeEvent<HTMLInputElement>) => {
    //@ts-ignore
    const file = e.target.files[0];
    if (!file) return;
    const fr = new FileReader();
    fr.readAsDataURL(file);
    fr.onloadend = () => {
      setBase64pfp(String(fr.result));
      updatePfp(String(fr.result));
    };
  };

  const updatePfp = async (base64pfp: string) => {
    setResMsg({ msg: "Updating pfp", err: false, pen: true });
    const res = await fetch(`http://localhost:5000/users/`, {
      method: "POST",
      body: JSON.stringify({ base64pfp }),
      headers: {
        "Content-type": "application/json;charset=UTF-8",
        authorization: `Bearer ${user.token}`,
      },
    });
    if (res.ok) {
      return setResMsg({ msg: "Updated pfp", err: false, pen: false });
    }
    const msg = (await res.json()).msg;
    setResMsg({ msg, err: true, pen: false });
  };

  const renderUserPfp = (userData: IUser | undefined) => {
    return userData ? (
      <>
        <div
          onClick={() => hiddenPfpInput.current?.click()}
          style={base64pfp ? { backgroundImage: `url(${base64pfp})` } : {}}
          className={classes.pfp}
        >
          {!userData.pfp && !base64pfp && <BiUser />}
        </div>
        <div className={classes.text}>
          <div className={classes.name}>{userData.name}</div>
          <div className={classes.hint}>
            Click on your pic to upload a new one. It will be automatically
            updated without requiring confirmation.
          </div>
        </div>
      </>
    ) : (
      <></>
    );
  };

  const hiddenPfpInput = useRef<HTMLInputElement>(null);
  return (
    <div className={classes.container}>
      <div className={classes.pfpContainer}>
        <input
          onChange={handlePfpInput}
          ref={hiddenPfpInput}
          style={{ display: "none" }}
          type="file"
          required
        />
        {renderUserPfp(findUserData(user.id))}
      </div>
      {resMsg.msg}
    </div>
  );
}
