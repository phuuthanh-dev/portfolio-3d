import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Wordle, { isValidGuess, scoreGuess } from './Wordle';

jest.mock('framer-motion', () => {
    const React = require('react');
    return {
        motion: { div: ({ children, animate, variants, initial, ...props }: any) => React.createElement('div', { ...props }, children) },
    };
});

const typeGuess = (word: string) => {
    for (const key of word) fireEvent.keyDown(window, { key });
    fireEvent.keyDown(window, { key: 'Enter' });
};

it('scores repeated letters after allocating correct positions', () => {
    expect(scoreGuess('HHHHH', 'THANH')).toEqual(['absent', 'correct', 'absent', 'absent', 'correct']);
    expect(scoreGuess('THINK', 'THANH')).toEqual(['correct', 'correct', 'absent', 'correct', 'absent']);
    expect(isValidGuess('ZZZZZ', 'THANH')).toBe(true);
    expect(isValidGuess('ABC', 'THANH')).toBe(false);
});

it('keeps each guess in its row and shows green, yellow and gray feedback', () => {
    render(<Wordle />);
    expect(screen.queryByText(/The word was/)).not.toBeInTheDocument();
    typeGuess('hello');
    const rows = screen.getAllByTestId('guess-row');
    expect(rows[0]).toHaveTextContent('HELLO');
    expect(within(rows[0]).getByLabelText('H, in the word, wrong position')).toHaveStyle({ backgroundColor: 'yellow' });
    expect(within(rows[0]).getByLabelText('E, not matched')).toHaveStyle({ backgroundColor: '#999' });
    typeGuess('think');
    expect(rows[0]).toHaveTextContent('HELLO');
    expect(rows[1]).toHaveTextContent('THINK');
    expect(within(rows[1]).getByLabelText('T, correct position')).toHaveStyle({ backgroundColor: 'lightgreen' });
});

it('explains an incomplete guess and accepts a win with restart', () => {
    render(<Wordle />);
    typeGuess('th');
    expect(screen.getByRole('status')).toHaveTextContent('Enter five letters');
    for (const key of 'anh') fireEvent.keyDown(window, { key });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByText('You win!')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText('Restart Game'));
    expect(screen.queryByText(/The word was/)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('guess-row')[0]).toHaveTextContent('');
});

it('accepts the on-screen keyboard and prevents input after six guesses', () => {
    render(<><input aria-label="other input" /><Wordle /></>);
    const input = screen.getByLabelText('other input');
    for (const key of 'thanh') fireEvent.keyDown(input, { key });
    expect(screen.getAllByTestId('guess-row')[0]).toHaveTextContent('');
    for (let i = 0; i < 6; i++) {
        for (const key of ['A', 'P', 'P', 'L', 'E']) fireEvent.click(screen.getByRole('button', { name: key }));
        fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
    }
    expect(screen.getByText('Game Over')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'A' })).toBeDisabled();
});

it('focuses the embedded game and accepts physical Enter after virtual keyboard input', () => {
    render(<Wordle />);
    const game = screen.getByRole('region', { name: 'Thanh-dle game' });
    expect(game).toHaveFocus();
    const firstKey = screen.getByRole('button', { name: 'H' });
    firstKey.focus();
    fireEvent.click(firstKey);
    expect(game).toHaveFocus();
    for (const key of 'ello') fireEvent.keyDown(game, { key });
    fireEvent.keyDown(game, { key: 'Enter' });
    const firstRow = screen.getAllByTestId('guess-row')[0];
    expect(firstRow).toHaveTextContent('HELLO');
    expect(within(firstRow).getByLabelText('H, in the word, wrong position')).toHaveStyle({ backgroundColor: 'yellow' });
    expect(within(firstRow).getByLabelText('E, not matched')).toHaveStyle({ backgroundColor: '#999' });
});

it('stops listening when the player interacts with another window and resumes on game click', () => {
    render(<><button>Another window</button><Wordle /></>);
    const game = screen.getByRole('region', { name: 'Thanh-dle game' });
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Another window' }));
    fireEvent.keyDown(window, { key: 'h' });
    expect(screen.getAllByTestId('guess-row')[0]).toHaveTextContent('');
    fireEvent.mouseDown(game);
    expect(game).toHaveFocus();
    fireEvent.keyDown(game, { key: 'h' });
    expect(screen.getAllByTestId('guess-row')[0]).toHaveTextContent('H');
});

it('does not intercept keys while minimized and restores focus when foregrounded', () => {
    const { rerender } = render(<Wordle isForeground />);
    const game = screen.getByRole('region', { name: 'Thanh-dle game' });
    expect(game).toHaveFocus();
    rerender(<Wordle isForeground={false} />);
    expect(game).not.toHaveFocus();
    fireEvent.keyDown(window, { key: 'h' });
    expect(screen.getAllByTestId('guess-row')[0]).toHaveTextContent('');
    rerender(<Wordle isForeground />);
    expect(game).toHaveFocus();
    fireEvent.keyDown(game, { key: 'h' });
    expect(screen.getAllByTestId('guess-row')[0]).toHaveTextContent('H');
});
