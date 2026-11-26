import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Easing } from '../general/Animation';

const ANSWER = 'THANH';
type LetterState = 'absent' | 'present' | 'correct';

// Score exact matches first, then allocate the remaining letters. This is
// important for THANH, which contains two Hs.
export const scoreGuess = (guess: string, word: string): LetterState[] => {
    const result: LetterState[] = Array(guess.length).fill('absent');
    const remaining: Record<string, number> = {};
    for (let i = 0; i < word.length; i++) {
        if (guess[i] === word[i]) result[i] = 'correct';
        else remaining[word[i]] = (remaining[word[i]] || 0) + 1;
    }
    for (let i = 0; i < guess.length; i++) {
        if (result[i] !== 'correct' && remaining[guess[i]] > 0) {
            result[i] = 'present';
            remaining[guess[i]]--;
        }
    }
    return result;
};

// Allow five-letter guesses even when they are names or are not in an English dictionary.
export const isValidGuess = (guess: string, word: string) =>
    guess.length === word.length && /^[A-Z]+$/.test(guess);

export interface KeyboardLetterProps {
    letter: string;
    word: string;
    guesses: string[];
    gameOver: boolean;
    onKey: (letter: string) => void;
}

const KeyboardLetter: React.FC<KeyboardLetterProps> = ({
    letter,
    guesses,
    word,
    gameOver,
    onKey,
}) => {
    const states = guesses.flatMap((guess) =>
        scoreGuess(guess, word).filter((_, index) => guess[index] === letter)
    );
    const isInPlace = states.includes('correct');
    const isInWord = states.includes('present');
    const notInWord = states.length > 0 && !isInPlace && !isInWord;

    return (
        <button
            type="button"
            onClick={() => onKey(letter)}
            disabled={gameOver}
            aria-label={letter === 'RET' ? 'Enter' : letter === 'DEL' ? 'Delete' : letter}
            className="site-button"
            style={Object.assign(
                {},
                styles.letterBox,
                isInWord && { backgroundColor: 'yellow' },
                isInPlace && { backgroundColor: 'lightgreen' },
                notInWord && { backgroundColor: 'gray' }
            )}
        >
            <p>{letter}</p>
        </button>
    );
};

export interface GuessLetterProps {
    letter: string;
    word: string;
    guess: string;
    guessed: boolean;
    index: number;
}

const GuessLetter: React.FC<GuessLetterProps> = ({
    guessed,
    letter,
    guess,
    word,
    index,
}) => {
    const state = guessed ? scoreGuess(guess, word)[index] : undefined;

    return (
        <div
            className="button-border"
            aria-label={letter === ' ' ? 'Empty' : `${letter.toUpperCase()}${guessed ? `, ${state === 'correct' ? 'correct position' : state === 'present' ? 'in the word, wrong position' : 'not matched'}` : ', not submitted'}`}
            style={Object.assign(
                {},
                styles.guessLetterBox,
                state === 'present' && { backgroundColor: 'yellow' },
                state === 'correct' && { backgroundColor: 'lightgreen' },
                state === 'absent' && letter !== ' ' && { backgroundColor: '#999', color: '#111' },
                !guessed && { backgroundColor: 'white' },
                letter === ' ' && styles.emptyBox
            )}
        >
            <h3>
                <b>{letter.toUpperCase()}</b>
            </h3>
        </div>
    );
};

export interface GuessWordProps {
    guess: string;
    word: string;
    guessed: boolean;
}

const GuessWord: React.FC<GuessWordProps> = ({
    guess,
    word,
    guessed,
}) => {
    return (
        <div style={styles.guessWordRow} data-testid="guess-row">
            {guess.split('').map((letter, index) => (
                <GuessLetter
                    guessed={guessed}
                    key={index}
                    index={index}
                    letter={letter}
                    guess={guess}
                    word={word}
                />
            ))}
            {[...Array(word.length - guess.length)].map((e, i) => (
                <GuessLetter
                    guessed={false}
                    key={`empty-${i}`}
                    index={guess.length + i}
                    letter={' '}
                    guess={guess}
                    word={word}
                />
            ))}
        </div>
    );
};

export interface WordleProps {
    isForeground?: boolean;
}

const TOP_ROW = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const MIDDLE_ROW = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const BOTTOM_ROW = ['RET', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'];
const ROWS = [TOP_ROW, MIDDLE_ROW, BOTTOM_ROW];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const Wordle: React.FC<WordleProps> = ({ isForeground = true }) => {
    const word = ANSWER;
    const gameRef = useRef<HTMLDivElement>(null);
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [message, setMessage] = useState('');
    const won = guesses.includes(word);
    const gameOver = won || guesses.length >= 6;

    // Focus the active game, including when it is restored from the taskbar.
    useEffect(() => {
        if (!isForeground) {
            gameRef.current?.blur();
            return;
        }
        gameRef.current?.focus({ preventScroll: true });
        // A taskbar mouse event can still be bubbling when React applies the
        // foreground update; restore focus once that event has completed.
        const focusAfterTaskbar = window.setTimeout(() => {
            gameRef.current?.focus({ preventScroll: true });
        }, 0);
        return () => window.clearTimeout(focusAfterTaskbar);
    }, [isForeground]);

    // Do not let a minimized or background game consume keystrokes intended
    // for other desktop windows. Clicking the game again restores focus.
    useEffect(() => {
        const onOutsideMouseDown = (event: MouseEvent) => {
            if (gameRef.current && event.target instanceof Node && !gameRef.current.contains(event.target)) {
                gameRef.current.blur();
            }
        };
        document.addEventListener('mousedown', onOutsideMouseDown);
        return () => document.removeEventListener('mousedown', onOutsideMouseDown);
    }, []);

    const restart = () => {
        setGuesses([]);
        setCurrentGuess('');
        setMessage('');
        gameRef.current?.focus({ preventScroll: true });
    };

    const handleKey = useCallback((key: string) => {
        if (gameOver) return;
        if (key === 'RET') {
            if (!isValidGuess(currentGuess, word)) {
                setMessage('Enter five letters before submitting your guess.');
                return;
            }
            setGuesses([...guesses, currentGuess]);
            setCurrentGuess('');
            setMessage('');
        } else if (key === 'DEL') {
            setCurrentGuess(currentGuess.slice(0, -1));
            setMessage('');
        } else if (ALPHABET.includes(key) && key.length === 1 && currentGuess.length < word.length) {
            setCurrentGuess(currentGuess + key);
            setMessage('');
        }
    }, [gameOver, currentGuess, word, guesses]);

    // listen to keyboard events
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (gameOver || !isForeground) return;
            if (!gameRef.current?.contains(document.activeElement)) return;
            const target = event.target as HTMLElement | null;
            if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || '') || (target?.tagName === 'BUTTON' && (event.key === 'Enter' || event.key === ' ')) || event.ctrlKey || event.metaKey || event.altKey) return;
            if (event.key === 'Backspace') {
                event.preventDefault();
                handleKey('DEL');
            } else if (event.key === 'Enter') {
                event.preventDefault();
                handleKey('RET');
            } else if (
                event.key.length === 1 &&
                ALPHABET.includes(event.key.toUpperCase())
            ) {
                handleKey(event.key.toUpperCase());
            }
        };
        // add listener
        window.addEventListener('keydown', handleKeyDown);
        // cleanup listener
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gameOver, handleKey, isForeground]);

    return (
        <div ref={gameRef} role="region" aria-label="Pixel Word game" tabIndex={0} style={styles.container}
            onMouseDown={(event) => {
                if (!(event.target as HTMLElement).closest('button')) {
                    gameRef.current?.focus({ preventScroll: true });
                }
            }}>
            <div style={styles.header}>
                <h2>Pixel Word</h2>
                <p style={styles.instruction}>Type five letters and press Enter; each guess fills the next row.</p>
                <p style={styles.instruction}><span style={{ color: '#256b28' }}>Green</span>: correct spot · <span style={{ color: '#8a6500' }}>Yellow</span>: wrong spot · <span style={{ color: '#666' }}>Gray</span>: not matched.</p>
                <p style={styles.instruction}>Any five letters are accepted. Six attempts.</p>
                <p role="status" aria-live="polite" style={styles.instruction}>{message}</p>
            </div>
            {gameOver && <motion.div
                variants={gameOverAnimations}
                animate={gameOver ? 'show' : 'hidden'}
                initial={false}
                style={Object.assign(
                    {},
                    styles.gameOverContainer,
                    gameOver && { zIndex: 1000 }
                )}
            >
                <h2>{won ? 'You win!' : 'Game Over'}</h2>
                <p>Thanks for playing! The word was {word}.</p>
                <br />
                <GuessWord
                    key={'winning-guess'}
                    guess={word}
                    word={word}
                    guessed={true}
                />
                <br />
                <div className="site-button" onMouseDown={restart}>
                    Restart Game
                </div>
            </motion.div>}
            <motion.div
                variants={gameAnimations}
                animate={!gameOver ? 'show' : 'hidden'}
                initial={false}
                style={styles.gameContainer}
            >
                <div style={styles.playArea}>
                    {[...Array(6)].map((e, i) => (
                        <GuessWord
                            key={i}
                            guess={guesses[i] || (i === guesses.length ? currentGuess : '')}
                            word={word}
                            guessed={i < guesses.length}
                        />
                    ))}
                </div>
                <div style={styles.keyboardContainer}>
                    {ROWS.map((row) => (
                        <div style={styles.keyboardRow} key={`row-${row[0]}`}>
                            {row.map((letter) => (
                                <KeyboardLetter
                                    key={letter}
                                    word={word}
                                    guesses={guesses}
                                    letter={letter}
                                    gameOver={gameOver}
                                    onKey={(key) => {
                                        handleKey(key);
                                        // Clicking a virtual key otherwise leaves that button
                                        // focused, so physical Enter activates it again instead
                                        // of submitting the current guess.
                                        gameRef.current?.focus({ preventScroll: true });
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

const gameAnimations = {
    hidden: {
        opacity: 0,
        y: -12,
        transition: {
            duration: 0.5,
        },
    },
    show: {
        y: 0,
        opacity: 1,
        transition: {
            delay: 0.5,
            duration: 0.5,
        },
    },
};

const gameOverAnimations = {
    hidden: {
        opacity: 0,
        y: 32,
        transition: {
            duration: 0.5,
        },
    },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            delay: 0.4,
            duration: 0.5,
            ease: Easing.expOut,
        },
    },
};

const styles: StyleSheetCSS = {
    container: {
        flex: 1,
        flexDirection: 'column',
        overflowY: 'scroll',
    },
    gameContainer: {
        flex: 1,
        flexDirection: 'column',
    },
    gameOverContainer: {
        zIndex: -1000,
        textAlign: 'center',
        width: '100%',
        height: '100%',
        position: 'absolute',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        flexShrink: 1,
        padding: '8px 16px 0',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instruction: { fontSize: 15, lineHeight: 1.2, textAlign: 'center' },
    keyboardContainer: {
        flexShrink: 1,

        paddingBottom: 6,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playArea: {
        flex: 1,
        flexDirection: 'column',

        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 4,
    },
    letterBox: {
        padding: '4px 7px',
        minWidth: 34,

        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
    },
    keyboardRow: {},
    guessLetterBox: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',

        margin: 2,
    },
    guessWordRow: {},
    emptyBox: {
        border: '2px solid gray',
        backgroundColor: 'white',
        boxShadow: 'none',
    },
};

export default Wordle;
