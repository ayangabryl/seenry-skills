import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import './signup-experience.css';

const validate = (email, password) => ({
  email: !email.trim() ? 'Add your email address.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Use an address like you@example.com.' : '',
  password: password.length < 8 ? 'Use at least 8 characters.' : '',
});
export default function SignupExperience() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState('idle');
  const [fail, setFail] = useState(false);
  const form = useRef(null);
  const timer = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => () => clearTimeout(timer.current), []);
  function submit(event) {
    event.preventDefault();
    if (state === 'pending') return;
    const next = validate(email, password);
    setErrors(next);
    const first = Object.keys(next).find(key => next[key]);
    if (first) { setState('invalid'); form.current.elements.namedItem(first).focus(); return; }
    setState('pending');
    timer.current = setTimeout(() => { setState(fail ? 'failed' : 'complete'); }, 700);
  }
  function change(key, value) {
    (key === 'email' ? setEmail : setPassword)(value);
    if (errors[key]) setErrors(old => ({ ...old, [key]: validate(key === 'email' ? value : email, key === 'password' ? value : password)[key] }));
    if (state !== 'pending') setState('idle');
  }
  return <section className="signup-study" aria-labelledby="signup-study-title">
    <div className="signup-study-copy"><h3 id="signup-study-title">A form that helps you finish.</h3><p>Submit it empty. Fix one field. Try a failed request. Your input stays where you left it.</p>
      <label className="signup-scenario"><input type="checkbox" checked={fail} disabled={state === 'pending'} onChange={e => { setFail(e.target.checked); setState('idle'); }} /> Simulate a connection failure</label>
      <p className="signup-disclosure">Local interaction demo. Use made-up details; nothing is sent or saved. No account is created.</p>
    </div>
    <form className="signup-card" ref={form} onSubmit={submit} noValidate aria-label="Signup interaction demo" aria-busy={state === 'pending'}>
      <h4>Create an account</h4>
      {['email', 'password'].map(key => <div className="signup-field" key={key}>
        <label htmlFor={`signup-${key}`}>{key === 'email' ? 'Email' : 'Password'}</label>
        <motion.div className="signup-input" animate={{ x: errors[key] && !reduce ? [0, -3, 3, -2, 0] : 0 }} transition={{ duration: .22 }}>
          <input id={`signup-${key}`} name={key} type={key === 'email' ? 'email' : visible ? 'text' : 'password'} autoComplete={key === 'email' ? 'email' : 'new-password'} value={key === 'email' ? email : password} onChange={e => change(key, e.target.value)} required minLength={key === 'password' ? 8 : undefined} aria-invalid={!!errors[key]} aria-describedby={`signup-${key}-help`} readOnly={state === 'pending'} />
          {key === 'password' && <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
        </motion.div>
        <p id={`signup-${key}-help`} className={errors[key] ? 'signup-error' : ''}>{errors[key] || (key === 'password' ? 'At least 8 characters.' : 'Use a made-up email for this demo.')}</p>
      </div>)}
      <button className="signup-submit" disabled={state === 'pending' || state === 'complete'} type="submit"><span>{state === 'pending' ? 'Trying…' : state === 'complete' ? 'Demo complete' : state === 'failed' ? 'Try again' : 'Continue'}</span>{state === 'complete' ? <Check size={18} /> : <ArrowRight size={18} />}</button>
      <p className="signup-status" role="status">{state === 'failed' ? 'Connection failed. Your details are still here. Turn off the simulation and retry.' : state === 'complete' ? 'The demo finished. No account was created.' : state === 'invalid' ? 'Check the highlighted fields.' : '\u00a0'}</p>
    </form>
  </section>;
}
