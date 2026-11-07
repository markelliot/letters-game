import * as React from "react";

import wordListUrl from "../resources/words.txt";
import "./game.scss";

const roundSeconds = 150;
const rollMs = 3000;

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

type Phase = "idle" | "rolling" | "playing" | "ended";

interface ITile {
    final: string;
    // Faces shown while rolling, paired with the elapsed ms at which each appears.
    faces: string[];
    times: number[];
}

interface IRoll {
    regular: ITile[];
    extras: ITile[];
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

function rollTile(die: string[], settleAt: number): ITile {
    const final = randomElement(die);
    const faces: string[] = [];
    const times: number[] = [];
    let t = 0;
    let gap = 70;
    let previous = "";
    while (t < settleAt) {
        const options = die.filter((face) => face !== previous);
        const face = randomElement(options.length > 0 ? options : die);
        faces.push(face);
        times.push(t);
        previous = face;
        t += gap;
        if (t > settleAt * 0.6) {
            gap *= 1.18;
        }
    }
    faces.push(final);
    times.push(settleAt);
    return { faces, final, times };
}

function roll(): IRoll {
    const dice = [...shuffle([...regularDice]), ...shuffle([...extraDice])];
    const tiles = dice.map((die) => rollTile(die, rollMs - 700 + Math.random() * 700));
    return { extras: tiles.slice(regularDice.length), regular: tiles.slice(0, regularDice.length) };
}

function faceIndex(tile: ITile, elapsed: number): number {
    let index = 0;
    while (index + 1 < tile.times.length && tile.times[index + 1] <= elapsed) {
        index++;
    }
    return index;
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

function letterCounts(letters: string): Int8Array {
    const counts = new Int8Array(26);
    for (let i = 0; i < letters.length; i++) {
        counts[letters.charCodeAt(i) - 97]++;
    }
    return counts;
}

function spellable(words: string[], letters: string[]): string[] {
    const available = letterCounts(letters.join("").toLowerCase());
    const counts = new Int8Array(26);
    return words.filter((word) => {
        if (word.length > letters.length) {
            return false;
        }
        counts.set(available);
        for (let i = 0; i < word.length; i++) {
            if (--counts[word.charCodeAt(i) - 97] < 0) {
                return false;
            }
        }
        return true;
    });
}

interface ISolutions {
    black: string[];
    all: string[];
}

export function Game() {
    const [phase, setPhase] = React.useState<Phase>("idle");
    const [current, setCurrent] = React.useState<IRoll | undefined>();
    const [elapsed, setElapsed] = React.useState(0);
    const [remaining, setRemaining] = React.useState(roundSeconds);
    const [solutions, setSolutions] = React.useState<ISolutions | "loading" | "error" | undefined>();

    React.useEffect(() => {
        if (phase !== "rolling") {
            return;
        }
        const start = performance.now();
        let frame = requestAnimationFrame(function tick() {
            const ms = performance.now() - start;
            if (ms >= rollMs) {
                setElapsed(rollMs);
                setPhase("playing");
                return;
            }
            setElapsed(ms);
            frame = requestAnimationFrame(tick);
        });
        return () => cancelAnimationFrame(frame);
    }, [phase, current]);

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
                const black = current.regular.map((tile) => tile.final);
                const all = [...black, ...current.extras.map((tile) => tile.final)];
                setSolutions({
                    all: spellable(words, all).filter((word) => word.length >= 4),
                    black: spellable(words, black),
                });
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
        setElapsed(0);
        setRemaining(roundSeconds);
        setCurrent(roll());
        setPhase("rolling");
    };

    let header: React.ReactNode;
    if (phase === "idle") {
        header = <button className="action" onClick={start}>Start</button>;
    } else if (phase === "ended") {
        header = <button className="action" onClick={start}>Reset</button>;
    } else {
        header = <span className="time">{remaining}</span>;
    }

    const renderTiles = (tiles: ITile[] | undefined, count: number) => {
        if (!tiles) {
            return Array.from({ length: count }, (_, index) => <div className="tile blank" key={index} />);
        }
        return tiles.map((tile, index) => {
            const face = phase === "rolling" ? faceIndex(tile, elapsed) : tile.faces.length - 1;
            const settled = face === tile.faces.length - 1;
            return (
                <div className="tile" key={index}>
                    <span className={settled ? "face settled" : "face"} key={face}>
                        {tile.faces[face]}
                    </span>
                </div>
            );
        });
    };

    return (
        <div className="game">
            <div className="header">{header}</div>
            <div className={phase === "ended" ? "tiles compact" : "tiles"}>
                <div className="board">{renderTiles(current?.regular, regularDice.length)}</div>
                <div className="board extra-die">{renderTiles(current?.extras, extraDice.length)}</div>
            </div>
            <Scorecard />
            {phase === "ended" && <Solutions solutions={solutions} />}
        </div>
    );
}

function WordList(props: { title: string; words: string[]; highlight?: Set<string> }) {
    const byLength = new Map<number, string[]>();
    for (const word of props.words) {
        const group = byLength.get(word.length) ?? [];
        group.push(word);
        byLength.set(word.length, group);
    }
    const lengths = [...byLength.keys()].sort((a, b) => b - a);
    return (
        <section className="word-list">
            <h2>
                {props.title} <span className="count">({props.words.length})</span>
            </h2>
            {lengths.length === 0 && <p>No words found.</p>}
            {lengths.map((length) => (
                <div className="word-group" key={length}>
                    <h3>
                        {length} letters <span className="count">({byLength.get(length)!.length})</span>
                    </h3>
                    <ul>
                        {byLength.get(length)!.map((word) => (
                            <li className={props.highlight?.has(word) ? "uses-red" : undefined} key={word}>
                                <a href={`https://www.merriam-webster.com/dictionary/${word}`} rel="noreferrer" target="_blank">
                                    {word}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </section>
    );
}

function Solutions(props: { solutions: ISolutions | "loading" | "error" | undefined }) {
    const { solutions } = props;
    const needsRed = React.useMemo(() => {
        if (typeof solutions !== "object") {
            return new Set<string>();
        }
        const black = new Set(solutions.black);
        return new Set(solutions.all.filter((word) => !black.has(word)));
    }, [solutions]);

    if (solutions === undefined || solutions === "loading") {
        return <div className="solutions">Finding words…</div>;
    }
    if (solutions === "error") {
        return <div className="solutions">Couldn't load the word list.</div>;
    }
    return (
        <div className="solutions">
            <WordList title="Black letters" words={solutions.black} />
            <WordList highlight={needsRed} title="Black and red letters" words={solutions.all} />
        </div>
    );
}

const Scorecard = React.memo(function Scorecard() {
    return (
        <div className="scorecard">
            <table>
                <tbody>
                    <tr>
                        <th></th>
                        <th>3</th>
                        <th>4</th>
                        <th>5</th>
                        <th>6</th>
                        <th>7</th>
                        <th>8</th>
                        <th>9</th>
                        <th>10</th>
                    </tr>
                    <tr>
                        <th>One</th>
                        <td>60</td>
                        <td>120</td>
                        <td>200</td>
                        <td>300</td>
                        <td>500</td>
                        <td>750</td>
                        <td>1000</td>
                        <td>1500</td>
                    </tr>
                    <tr>
                        <th>Two</th>
                        <td>70</td>
                        <td>140</td>
                        <td>250</td>
                        <td>400</td>
                        <td>650</td>
                        <td>1000</td>
                        <td>1500</td>
                        <td>3000</td>
                    </tr>
                    <tr>
                        <th>Three</th>
                        <td>80</td>
                        <td>160</td>
                        <td>300</td>
                        <td>500</td>
                        <td>800</td>
                        <td>1250</td>
                        <td>2000</td>
                        <td>5000</td>
                    </tr>
                    <tr>
                        <th>Four</th>
                        <td>90</td>
                        <td>180</td>
                        <td>350</td>
                        <td>600</td>
                        <td>950</td>
                        <td>1500</td>
                        <td>2500</td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <th>Five</th>
                        <td>100</td>
                        <td>200</td>
                        <td>400</td>
                        <td>700</td>
                        <td>1100</td>
                        <td>1750</td>
                        <td>3000</td>
                        <td>-</td>
                    </tr>
                </tbody>
            </table>
            <table>
                <tbody>
                    <tr>
                        <th>Combo</th>
                        <th>Bonus</th>
                    </tr>
                    <tr>
                        <td>3 &amp; 4</td>
                        <td>300</td>
                    </tr>
                    <tr>
                        <td>4 &amp; 5</td>
                        <td>500</td>
                    </tr>
                    <tr>
                        <td>5 &amp; 6</td>
                        <td>800</td>
                    </tr>
                    <tr>
                        <td>6 &amp; 7</td>
                        <td>1200</td>
                    </tr>
                    <tr>
                        <td>7 &amp; 8</td>
                        <td>1850</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
});
