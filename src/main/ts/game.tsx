import * as React from "react";

import wordListUrl from "../resources/words.txt";
import "./game.scss";

const roundSeconds = 150;

const regularDice = [
    ["A", "A", "A", "E", "E", "E"],
    ["A", "A", "A", "E", "E", "E"],
    ["B", "H", "I", "K", "R", "T"],
    ["F", "H", "I", "R", "S", "U"],
    ["G", "I", "M", "R", "S", "U"],
    ["E", "J", "Q", "V", "X", "Z"],
    ["F", "I", "N", "P", "T", "U"],
    ["C", "M", "O", "O", "P", "W"],
    ["D", "L", "N", "O", "R", "T"],
    ["B", "L", "O", "O", "W", "Y"],
];

const extraDice = [
    ["Q", "S", "S", "V", "W", "Y"],
    ["B", "F", "H", "L", "N", "P"],
    ["C", "D", "G", "J", "K", "M"],
];

type Phase = "idle" | "playing" | "ended";

interface IRoll {
    regular: string[];
    extras: string[];
}

function randomElement<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function roll(): IRoll {
    return {
        extras: shuffle([...extraDice]).map(randomElement),
        regular: shuffle([...regularDice]).map(randomElement),
    };
}

let wordListPromise: Promise<string[]> | undefined;

function loadWordList(): Promise<string[]> {
    if (!wordListPromise) {
        wordListPromise = fetch(wordListUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load word list: ${response.status}`);
                }
                return response.text();
            })
            .then((text) => text.split("\n").filter((word) => word.length > 0));
        wordListPromise.catch(() => {
            wordListPromise = undefined;
        });
    }
    return wordListPromise;
}

function letterCounts(letters: string[]): Int8Array {
    const counts = new Int8Array(26);
    for (const letter of letters) {
        counts[letter.toLowerCase().charCodeAt(0) - 97]++;
    }
    return counts;
}

interface ISolution {
    word: string;
    red: boolean[];
}

// Black tiles are used before red ones; words that need a red tile must be 4+ letters.
function solve(words: string[], black: string[], red: string[]): ISolution[] {
    const blackAvailable = letterCounts(black);
    const redAvailable = letterCounts(red);
    const blackCounts = new Int8Array(26);
    const redCounts = new Int8Array(26);
    const solutions: ISolution[] = [];
    for (const word of words) {
        if (word.length > black.length + red.length) {
            continue;
        }
        blackCounts.set(blackAvailable);
        redCounts.set(redAvailable);
        const usesRed: boolean[] = [];
        let ok = true;
        for (let i = 0; i < word.length && ok; i++) {
            const c = word.charCodeAt(i) - 97;
            if (blackCounts[c] > 0) {
                blackCounts[c]--;
                usesRed.push(false);
            } else if (redCounts[c] > 0) {
                redCounts[c]--;
                usesRed.push(true);
            } else {
                ok = false;
            }
        }
        if (ok && (word.length >= 4 || !usesRed.includes(true))) {
            solutions.push({ red: usesRed, word });
        }
    }
    return solutions;
}

export function Game() {
    const [phase, setPhase] = React.useState<Phase>("idle");
    const [current, setCurrent] = React.useState<IRoll | undefined>();
    const [remaining, setRemaining] = React.useState(roundSeconds);
    const [solutions, setSolutions] = React.useState<ISolution[] | "loading" | "error" | undefined>();
    const [showReds, setShowReds] = React.useState(false);

    React.useEffect(() => {
        if (phase !== "playing") {
            return;
        }
        const end = Date.now() + roundSeconds * 1000;
        setRemaining(roundSeconds);
        const interval = setInterval(() => {
            const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
            setRemaining(left);
            if (left === 0) {
                setPhase("ended");
            }
        }, 200);
        return () => clearInterval(interval);
    }, [phase]);

    React.useEffect(() => {
        if (phase !== "ended" || !current) {
            return;
        }
        let cancelled = false;
        setSolutions("loading");
        loadWordList().then(
            (words) => {
                if (cancelled) {
                    return;
                }
                setSolutions(
                    solve(
                        words,
                        current.regular,
                        current.extras,
                    ),
                );
            },
            () => {
                if (!cancelled) {
                    setSolutions("error");
                }
            },
        );
        return () => {
            cancelled = true;
        };
    }, [phase, current]);

    const start = () => {
        loadWordList().catch(() => undefined);
        setSolutions(undefined);
        setRemaining(roundSeconds);
        setCurrent(roll());
        setPhase("playing");
    };

    let header: React.ReactNode;
    if (phase === "idle") {
        header = <button className="action" onClick={start}>Start</button>;
    } else if (phase === "ended") {
        header = <button className="action" onClick={start}>Reset</button>;
    } else {
        header = <span className="time">{remaining}</span>;
    }

    const renderTiles = (tiles: string[] | undefined, count: number) => {
        if (!tiles) {
            return Array.from({ length: count }, (_, index) => <div className="tile blank" key={index} />);
        }
        return tiles.map((letter, index) => (
            <div className="tile" key={index}>
                {letter}
            </div>
        ));
    };

    return (
        <div className="game">
            <div className="header">{header}</div>
            <div className="tiles">
                <div className="board">{renderTiles(current?.regular, regularDice.length)}</div>
                <div className="board extra-die">{renderTiles(current?.extras, extraDice.length)}</div>
            </div>
            <Scorecard />
            {phase === "ended" && <Solutions onShowRedsChange={setShowReds} showReds={showReds} solutions={solutions} />}
        </div>
    );
}

function Solutions(props: {
    solutions: ISolution[] | "loading" | "error" | undefined;
    showReds: boolean;
    onShowRedsChange: (showReds: boolean) => void;
}) {
    const { showReds } = props;
    const solutions =
        typeof props.solutions === "object" && !showReds
            ? props.solutions.filter((solution) => !solution.red.includes(true))
            : props.solutions;
    if (solutions === undefined || solutions === "loading") {
        return <div className="solutions">Finding words…</div>;
    }
    if (solutions === "error") {
        return <div className="solutions">Couldn't load the word list.</div>;
    }

    const byLength = new Map<number, ISolution[]>();
    for (const solution of solutions) {
        const group = byLength.get(solution.word.length) ?? [];
        group.push(solution);
        byLength.set(solution.word.length, group);
    }
    const lengths = [...byLength.keys()].sort((a, b) => b - a);
    return (
        <div className="solutions">
            <section className="word-list">
                <h2>
                    <span>
                        Words <span className="count">({solutions.length})</span>
                    </span>
                    <label className="toggle">
                        <input checked={showReds} onChange={(event) => props.onShowRedsChange(event.target.checked)} type="checkbox" />
                        <span className="switch" />
                        Show reds
                    </label>
                </h2>
                {lengths.length === 0 && <p>No words found.</p>}
                {lengths.map((length) => (
                    <div className="word-group" key={length}>
                        <h3>
                            {length} letters <span className="count">({byLength.get(length)!.length})</span>
                        </h3>
                        <ul>
                            {byLength.get(length)!.map(({ word, red }) => (
                                <li key={word}>
                                    <a href={`https://www.merriam-webster.com/dictionary/${word}`} rel="noreferrer" target="_blank">
                                        {[...word].map((letter, index) => (
                                            <span className={red[index] ? "red" : undefined} key={index}>
                                                {letter}
                                            </span>
                                        ))}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>
        </div>
    );
}

const wordLengths = [3, 4, 5, 6, 7, 8, 9, 10];

const scores: [string, string[]][] = [
    ["One", ["60", "120", "200", "300", "500", "750", "1000", "1500"]],
    ["Two", ["70", "140", "250", "400", "650", "1000", "1500", "3000"]],
    ["Three", ["80", "160", "300", "500", "800", "1250", "2000", "5000"]],
    ["Four", ["90", "180", "350", "600", "950", "1500", "2500", "-"]],
    ["Five", ["100", "200", "400", "700", "1100", "1750", "3000", "-"]],
];

// Bonus for words of two consecutive lengths, starting at 3 & 4.
const comboBonuses = ["300", "500", "800", "1200", "1850"];

// Each length column is two half-columns so combo cells can straddle column boundaries.
const Scorecard = React.memo(function Scorecard() {
    return (
        <div className="scorecard">
            <table>
                <colgroup>
                    <col className="label" />
                    {wordLengths.flatMap((length) => [<col key={`${length}a`} />, <col key={`${length}b`} />])}
                </colgroup>
                <tbody>
                    <tr>
                        <th></th>
                        {wordLengths.map((length) => (
                            <th colSpan={2} key={length}>
                                {length}
                            </th>
                        ))}
                    </tr>
                    {scores.map(([label, values]) => (
                        <tr key={label}>
                            <th>{label}</th>
                            {values.map((value, index) => (
                                <td colSpan={2} key={index}>
                                    {value}
                                </td>
                            ))}
                        </tr>
                    ))}
                    <tr className="combo">
                        <th>Combo</th>
                        <td className="gap" />
                        {comboBonuses.map((bonus, index) => (
                            <td colSpan={2} key={index}>
                                {bonus}
                            </td>
                        ))}
                        <td className="gap" colSpan={2 * wordLengths.length - 1 - 2 * comboBonuses.length} />
                    </tr>
                </tbody>
            </table>
        </div>
    );
});
