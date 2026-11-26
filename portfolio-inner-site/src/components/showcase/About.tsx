import React from 'react';
import { Link } from 'react-router-dom';
import portfolio from '../../portfolio.config.json';
import ResumeDownload from './ResumeDownload';
import './About.css';

type AboutImage = { src: string; caption: string; alt?: string };
type ProfileWithImages = typeof portfolio.profile & { aboutImages?: AboutImage[] };

const About: React.FC = () => {
    const profile = portfolio.profile as ProfileWithImages;
    const images = profile.aboutImages || [];
    const image = (index: number) => {
        const item = images[index];
        if (!item || !item.src) return null;
        const src = item.src.startsWith('/') ? process.env.PUBLIC_URL + item.src : item.src;
        return (
            <div className={`captioned-image about-photo ${index === 0 ? 'about-photo--landscape' : 'about-photo--portrait'}`}>
                <img
                    src={src}
                    alt={item.alt || item.caption}
                    loading="lazy"
                    style={{ height: 'auto', width: '100%' }}
                />
                <p><sub><b>Figure {index + 1}:</b> {item.caption}</sub></p>
            </div>
        );
    };

    return (
        <div className="site-page-content">
            <h1 style={{ marginLeft: -16 }}>Welcome</h1>
            <h3>I'm {profile.name}</h3>
            <br />
            <div className="text-block">
                <p>
                    I'm a software engineer based in Ho Chi Minh City, building web and mobile products
                    that bring interfaces, APIs, data and operational workflows together. My work spans
                    full-stack development, automation and real-time applications.
                </p>
                <br />
                <p>
                    Thank you for visiting my portfolio! Here you can explore some of the projects I've
                    worked on and learn more about my background. If you have a question or would like
                    to get in touch, visit the <Link to="/contact">contact page</Link> or email me at{' '}
                    <a href={`mailto:${profile.email}`}>{profile.email}</a>.
                </p>
            </div>
            <ResumeDownload />
            <div className="text-block">
                <h3>About Me</h3>
                <br />
                <p>
                    I studied Software Engineering at FPT University, where I completed my bachelor's
                    degree between 2021 and 2025. My background has given me the opportunity to work
                    across the different pieces of a product, from the screens people use to the
                    services and databases that support them.
                </p>
                <br />
                {image(0)}
                <p>
                    During my software engineering internship at FPT Software in Ho Chi Minh City,
                    I worked with MongoDB data models, CRUD operations and REST APIs. That experience
                    introduced me to building the data and service layers behind an application and
                    working within a professional development team.
                </p>
                <br />
                <p>
                    At DElements Media, I work on software for day-to-day operations. My work includes
                    a livestream operations platform that brings together scheduling, availability,
                    payroll and live coordination, along with automation for workflows such as
                    recruitment, contracts and payroll. I've also contributed to the Blog and Account
                    interfaces for the Root Rotation e-commerce website.
                </p>
                <br />
                <div className="about-side-story">
                    <div className="about-side-copy">
                        <h3>Tools &amp; Projects</h3>
                        <br />
                        <p>
                            On the frontend, I work with React, Next.js, TypeScript and JavaScript, as well as
                            React Native and Expo for mobile experiences. For backend work, my toolkit includes
                            Java, Spring Boot and Node.js, with REST APIs, WebSocket and JWT used where a project
                            calls for them. I've also worked with SQL Server, MongoDB and MySQL, alongside Docker,
                            CI/CD, Vercel and Railway for delivery.
                        </p>
                        <br />
                        <p>
                            My projects cover different kinds of problems: auction experiences, operational
                            tools and workflow automation. They are a chance to connect product requirements
                            with practical implementation, whether that means real-time interactions, scheduling
                            or a clearer way to manage everyday work. You can find descriptions and links on
                            the <Link to="/projects">Projects</Link> page.
                        </p>
                    </div>
                    {image(1)}
                </div>
                <br />
                <p>
                    Thanks for taking the time to read about me. I hope you enjoy exploring the rest of
                    the portfolio. If you'd like to discuss a project or simply say hello, you can
                    reach me through the <Link to="/contact">contact page</Link> or find me on{' '}
                    <a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a> and{' '}
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>.
                </p>
            </div>
        </div>
    );
};

export default About;
