import * as css from "csstips";
import * as React from "react";

import { flex } from "csstips";
import {style} from "typestyle";

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

function randomElement(die: string[]): string {
    return die[Math.floor(Math.random() * die.length)];
}

function shuffle(array: string[]): string[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

const game = style(css.margin(0, "auto"), css.width("400px"));
const timerStyle = style(
    css.width("400px"),
    {
        fontSize: "50px",
        textAlign: "center",
    },
);
const board = style({textAlign: "center"});
const regularDie = style(
    css.padding("10px"),
    css.width("92px"),
    css.fontWeightBold,
    {
        border: "1px solid #999",
        color: "#000",
        display: "inline-block",
        fontSize: "70px",
        lineHeight: "70px",
        margin: "10px",
        textAlign: "center",
    });
const extraDie = style(
    css.padding("10px"),
    css.width("92px"),
    css.fontWeightBold,
    {
        border: "1px solid #999",
        color: "#f00",
        display: "inline-block",
        fontSize: "70px",
        lineHeight: "70px",
        margin: "10px",
        textAlign: "center",
    });

interface IGameState {
    timer: number;
    regular: string[];
    extras: string[];
}

export class Game extends React.Component<{}, IGameState> {
    public componentWillMount() {
        const regular = shuffle(regularDice.map((die) => randomElement(die)));
        const extras = shuffle(extraDice.map((die) => randomElement(die)));
        this.setState({ timer: 120, extras, regular });
        const interval = setInterval(() => {
            this.setState({ timer: Math.max(0, this.state.timer - 1) });
            if (this.state.timer === 0) {
                clearInterval(interval);
            }
        }, 1000);
    }

    public render() {
        return (
            <div className={game}>
                <div className={timerStyle}>{this.state.timer}</div>
                <div className={board}>
                    {this.state.regular.map((letter, index) => <div key={index} className={regularDie}>{letter}</div>)}
                </div>
                <div className={board}>
                    {this.state.extras.map((letter, index) => <div key={index} className={extraDie}>{letter}</div>)}
                </div>
            </div>
        );
    }
}
