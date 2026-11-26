import React from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from '../general';
import portfolio from '../../portfolio.config.json';

const VerticalNavbar: React.FC = () => {
    const { pathname } = useLocation();
    if (pathname === '/') return null;
    return (
        <nav className="portfolio-nav" aria-label="Portfolio navigation">
            <div className="portfolio-nav-header">
                <h1 className="portfolio-nav-name">{portfolio.profile.name}</h1>
                <h3>Portfolio</h3>
            </div>
            <div className="portfolio-nav-links">
                <Link containerStyle={styles.link} to="" text="HOME" />
                <Link containerStyle={styles.link} to="about" text="ABOUT" />
                <Link containerStyle={styles.link} to="experience" text="EXPERIENCE" />
                <Link containerStyle={styles.link} to="projects" text="PROJECTS" />
                <Link containerStyle={styles.link} to="contact" text="CONTACT" />
            </div>
        </nav>
    );
};
const styles: StyleSheetCSS = {
    link: { marginBottom: 32 },
};
export default VerticalNavbar;
