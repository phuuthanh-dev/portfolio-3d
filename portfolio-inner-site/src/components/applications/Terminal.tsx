import React, { useEffect, useRef, useState } from 'react';
import portfolio from '../../portfolio.config.json';
import Window from '../os/Window';

type Entry = { id: number; command: string; result: React.ReactNode };

const commandResult = (command: string): React.ReactNode => {
    const { profile, projects } = portfolio;
    switch (command.toLowerCase()) {
        case 'help':
            return 'Commands: help, about, skills, projects, contact, clear. Use ↑ and ↓ for command history.';
        case 'about':
            return <>{profile.name} — {profile.title}<br />{profile.about}</>;
        case 'skills':
            return <>{profile.skills.map(skill => <div key={skill.category}>{skill.category}: {skill.items.join(', ')}</div>)}</>;
        case 'projects':
            return <>{projects.map(project => <div key={project.name}>{project.name} — {project.description}</div>)}<div>Open Projects Explorer on the desktop to see more.</div></>;
        case 'contact':
            return <><div>Email: <a style={{ color: '#b6ffb0' }} href={`mailto:${profile.email}`}>{profile.email}</a></div><div>GitHub: <a style={{ color: '#b6ffb0' }} href={profile.github} target="_blank" rel="noopener noreferrer">{profile.github}</a></div><div>LinkedIn: <a style={{ color: '#b6ffb0' }} href={profile.linkedin} target="_blank" rel="noopener noreferrer">{profile.linkedin}</a></div></>;
        default:
            return <>Unknown command: {command}. Type <strong>help</strong> to see available commands.</>;
    }
};

const Terminal: React.FC<WindowAppProps> = ({ onClose, onInteract, onMinimize, isForeground }) => {
    const [input, setInput] = useState('');
    const [entries, setEntries] = useState<Entry[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const nextId = useRef(0);

    useEffect(() => {
        if (isForeground) inputRef.current?.focus();
    }, [isForeground]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [entries]);

    const run = (event: React.FormEvent) => {
        event.preventDefault();
        const command = input.trim();
        if (!command) return;
        const updatedHistory = [...history, command];
        setHistory(updatedHistory);
        setHistoryIndex(updatedHistory.length);
        setInput('');
        if (command.toLowerCase() === 'clear') {
            setEntries([]);
        } else {
            setEntries(previous => [...previous, { id: nextId.current++, command, result: commandResult(command) }]);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        const index = event.key === 'ArrowUp' ? Math.max(0, historyIndex - 1) : Math.min(history.length, historyIndex + 1);
        setHistoryIndex(index);
        setInput(index < history.length ? history[index] : '');
    };

    const width = Math.max(280, Math.min(760, window.innerWidth - 24));
    const height = Math.max(240, Math.min(510, window.innerHeight - 64));
    return <Window top={24} left={Math.max(8, Math.min(120, window.innerWidth - width - 8))}
        width={width} height={height} windowTitle="Thanh Terminal" windowBarIcon="terminalIcon"
        closeWindow={onClose} onInteract={onInteract} minimizeWindow={onMinimize} bottomLeftText="Ready">
        <div className="portfolio-terminal" style={styles.terminal} onClick={(event) => {
            if ((event.target as HTMLElement).closest('a, input, button')) return;
            inputRef.current?.focus();
        }}>
            <div ref={scrollRef} style={styles.scroll}>
                <div>Thanh Terminal [Version 1.0]</div>
                <div>Welcome! Type <strong>help</strong> to explore this portfolio.</div>
                <div role="log" aria-label="Terminal output" aria-live="polite">
                    {entries.map(entry => <div key={entry.id} style={styles.entry}>
                        <div><span style={styles.prompt}>C:\THANH&gt;</span> {entry.command}</div>
                        <div style={styles.result}>{entry.result}</div>
                    </div>)}
                </div>
                <form onSubmit={run} style={styles.form}>
                    <label htmlFor="terminal-command" style={styles.prompt}>C:\THANH&gt;</label>
                    <input id="terminal-command" ref={inputRef} value={input} onChange={event => setInput(event.target.value)}
                        onKeyDown={handleKeyDown} aria-label="Terminal command" autoComplete="off" autoCapitalize="none"
                        spellCheck={false} style={styles.input} />
                    <button type="submit" style={styles.run}>Run</button>
                </form>
            </div>
        </div>
    </Window>;
};

const styles: Record<string, React.CSSProperties> = {
    terminal: { display: 'flex', flex: 1, minHeight: 0, background: '#101812', color: '#e5f5dd', fontFamily: 'Consolas, monospace', fontSize: 15, lineHeight: 1.5, cursor: 'text' },
    scroll: { display: 'block', width: '100%', overflowY: 'auto', padding: 16, overflowWrap: 'anywhere' },
    prompt: { color: '#9def9b', whiteSpace: 'nowrap' },
    entry: { display: 'block', marginTop: 14 },
    result: { display: 'block', marginTop: 4, whiteSpace: 'pre-wrap' },
    form: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 },
    input: { flex: 1, minWidth: 0, border: 0, background: 'transparent', color: '#fff', font: 'inherit' },
    run: { border: '1px solid #9def9b', color: '#e5f5dd', background: '#26392a', padding: '2px 8px', font: 'inherit', cursor: 'pointer' },
};

export default Terminal;
