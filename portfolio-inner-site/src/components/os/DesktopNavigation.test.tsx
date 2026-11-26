import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Desktop from './Desktop';

jest.mock('../applications/ShowcaseExplorer', () => ({ onClose }: WindowAppProps) => <div>Showcase window<button onClick={onClose}>Close showcase</button></div>);
jest.mock('../applications/Doom', () => () => null);
jest.mock('../applications/OregonTrail', () => () => null);
jest.mock('../applications/Henordle', () => () => null);
jest.mock('../applications/Scrabble', () => () => null);
jest.mock('../applications/Credits', () => () => null);
jest.mock('../applications/Terminal', () => () => null);
jest.mock('../applications/ProjectsExplorer', () => () => null);
jest.mock('../applications/ProjectLauncher', () => ({ MyPortfolio: () => null, VietAuction: () => null, Fluxora: () => null, RrLivestream: () => null }));
jest.mock('./Toolbar', () => () => null);
jest.mock('./ShutdownSequence', () => () => null);
jest.mock('./DesktopShortcut', () => ({ shortcutName, onOpen }: { shortcutName: string; onOpen: () => void }) => <button onClick={onOpen}>{shortcutName}</button>);

test('a trusted scene message opens the closed showcase on the requested page', () => {
    jest.useFakeTimers();
    const parentFrame = document.createElement('iframe');
    document.body.appendChild(parentFrame);
    const parent = parentFrame.contentWindow!;
    const oldParent = Object.getOwnPropertyDescriptor(window, 'parent')!;
    const oldReferrer = Object.getOwnPropertyDescriptor(document, 'referrer');
    Object.defineProperty(window, 'parent', { configurable: true, value: parent });
    Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://scene.example/' });
    const view = render(<Desktop />);
    fireEvent.click(screen.getByText('Close showcase'));
    act(() => { jest.advanceTimersByTime(101); });
    expect(screen.queryByText('Showcase window')).not.toBeInTheDocument();
    act(() => { window.dispatchEvent(new MessageEvent('message', {
        source: parent, origin: 'https://scene.example', data: { type: 'portfolio:navigate', path: '/experience' },
    })); });
    expect(screen.getByText('Showcase window')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/experience');
    view.unmount();
    Object.defineProperty(window, 'parent', oldParent);
    if (oldReferrer) Object.defineProperty(document, 'referrer', oldReferrer); else delete (document as any).referrer;
    document.body.removeChild(parentFrame);
    window.history.replaceState({}, '', '/');
    jest.useRealTimers();
});
