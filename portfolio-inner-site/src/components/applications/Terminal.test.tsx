import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Terminal from './Terminal';

jest.mock('../os/Window', () => ({ children }: { children: React.ReactNode }) => <div>{children}</div>);
const controls = { onClose: jest.fn(), onInteract: jest.fn(), onMinimize: jest.fn() };
const run = (command: string) => {
    fireEvent.change(screen.getByLabelText('Terminal command'), { target: { value: command } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
};

test('terminal shows configured information, errors and clears output', () => {
    render(<Terminal {...controls} />);
    run('about');
    expect(screen.getByRole('log')).toHaveTextContent('Thanh Phung');
    run('projects');
    expect(screen.getByRole('log')).toHaveTextContent('Fluxora');
    run('contact');
    expect(within(screen.getByRole('log')).getByRole('link', { name: /phuuthanh2003@gmail.com/i })).toHaveAttribute('href', 'mailto:phuuthanh2003@gmail.com');
    run('unknown');
    expect(screen.getByRole('log')).toHaveTextContent('Unknown command: unknown');
    run('clear');
    expect(screen.getByRole('log')).toBeEmptyDOMElement();
});

test('terminal supports case-insensitive commands and command history', () => {
    render(<Terminal {...controls} />);
    run('HELP');
    expect(screen.getByRole('log')).toHaveTextContent('Commands: help');
    const input = screen.getByLabelText('Terminal command');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveValue('HELP');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveValue('');
});
