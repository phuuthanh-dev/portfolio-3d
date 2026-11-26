import React, { useState } from 'react';
import portfolio from '../../portfolio.config.json';
import ResumeDownload from './ResumeDownload';

const Contact: React.FC = () => {
    const { profile } = portfolio;
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const openEmail = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const sender = name.trim();
        const senderEmail = email.trim();
        const text = message.trim();
        if (!sender || !senderEmail || !text) {
            setError('Please enter your name, email address and message.');
            return;
        }
        setError('');
        const emailSubject = subject.trim() || `Portfolio message from ${sender}`;
        const emailBody = `Name: ${sender}\nEmail: ${senderEmail}\n\n${text}`;
        window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    };

    return (
        <div className="site-page-content">
            <h1>Contact</h1>
            <div className="text-block">
                <p>If you have a question, project or opportunity to discuss, I would love to hear from you. You can contact me by email, find me on social media or use the form below.</p>
                <br />
                <p><b>Email: </b><a href={`mailto:${profile.email}`}>{profile.email}</a></p>
                <br />
                <p>
                    <a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>{' · '}
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>{' · '}
                    <a href={profile.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
                </p>
                <form onSubmit={openEmail} style={styles.form}>
                    <label htmlFor="contact-name"><p><b>Your name <span aria-hidden="true">*</span></b></p></label>
                    <input id="contact-name" name="name" autoComplete="name" type="text" placeholder="Name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} style={styles.formItem} />

                    <label htmlFor="contact-email"><p><b>Email <span aria-hidden="true">*</span></b></p></label>
                    <input id="contact-email" name="email" autoComplete="email" type="email" placeholder="Email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} style={styles.formItem} />

                    <label htmlFor="contact-subject"><p><b>Subject (optional)</b></p></label>
                    <input id="contact-subject" name="subject" type="text" placeholder="Subject" maxLength={150} value={subject} onChange={(event) => setSubject(event.target.value)} style={styles.formItem} />

                    <label htmlFor="contact-message"><p><b>Message <span aria-hidden="true">*</span></b></p></label>
                    <textarea id="contact-message" name="message" placeholder="Message" required maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} style={styles.formItem} />

                    {error && <p role="alert" style={styles.error}>{error}</p>}
                    <button className="site-button" type="submit" style={styles.button}>Open email draft</button>
                    <p style={styles.note}><sub>* Required. This opens your email app with a draft; review it and send it from there. No message is sent automatically.</sub></p>
                    <p style={styles.note}><sub>If no email app opens, email me directly at <a href={`mailto:${profile.email}`}>{profile.email}</a>.</sub></p>
                </form>
                <div style={styles.resume}><ResumeDownload /></div>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    form: { display: 'flex', flexDirection: 'column', marginTop: 32, width: '100%', textAlign: 'left' },
    formItem: { marginTop: 4, marginBottom: 16 },
    error: { color: '#a40000', marginBottom: 12 },
    button: { minHeight: 32, alignSelf: 'flex-start' },
    note: { marginTop: 12 },
    resume: { display: 'block', marginTop: 24 },
};

export default Contact;
