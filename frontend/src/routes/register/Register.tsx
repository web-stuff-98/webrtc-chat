import { ChangeEvent, FormEvent, useState, useEffect } from 'react';

import classes from '../LoginRegister.module.scss';
import formClasses from '../../FormClasses.module.scss';

import useAuth from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { register, resMsg, clrMsg } = useAuth();

  const location = useLocation();
  useEffect(() => {
    clrMsg();
  }, [location]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await register(username, password);
    } catch (error) {
      console.error(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={classes.container}>
      <div className={formClasses.inputLabelWrapper}>
        <label htmlFor="username">Username</label>
        <input
          value={username}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setUsername(e.target.value)
          }
          type="text"
          id="username"
          name="username"
          required
        />
      </div>
      <div className={formClasses.inputLabelWrapper}>
        <label htmlFor="password">Password</label>
        <input
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          type="password"
          id="password"
          name="password"
          required
        />
      </div>
      <button type="submit">Create account</button>
      {resMsg.msg && <div className={classes.resMsg}>{resMsg.msg}</div>}
    </form>
  );
}
