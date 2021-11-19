import * as React from "react";

import "./game.scss";

const counterDuration = 150;

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

interface IGameState {
    timer: number;
    regular: string[];
    extras: string[];
}

export class Game extends React.Component<{}, IGameState> {
    public componentWillMount() {
        this.reset();
        const interval = setInterval(() => {
            this.setState({ timer: Math.max(0, this.state.timer - 1) });
        }, 1000);
    }

    public render() {
        let timerElement = <>{this.state.timer}</>;
        if (this.state.timer === 0) {
            timerElement = <button className="reset" onClick={this.reset}>reset</button>;
        }

        return (
            <div className="game">
                <div className="timer">{timerElement}</div>
                <div className="board">
                    {this.state.regular.map((letter, index) => <div key={index}>{letter}</div>)}
                </div>
                <div className="board extra-die">
                    {this.state.extras.map((letter, index) => <div key={index}>{letter}</div>)}
                </div>
                {this.scorecard()}
            </div>
        );
    }

    private scorecard = () => {
        return (
            <div className="scorecard">
                <table>
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
                </table>
                <table>
                    <tr>
                        <th>Combo</th>
                        <th>Bonus</th>
                    </tr>
                    <tr>
                        <td>
                            3 &amp; 4
                        </td>
                        <td>
                            300
                        </td>
                    </tr>
                    <tr>
                        <td>
                            4 &amp; 5
                        </td>
                        <td>
                            500
                        </td>
                    </tr>
                    <tr>
                        <td>
                            5 &amp; 6
                        </td>
                        <td>
                            800
                        </td>
                    </tr>
                    <tr>
                        <td>
                            6 &amp; 7
                        </td>
                        <td>
                            1200
                        </td>
                    </tr>
                    <tr>
                        <td>
                            7 &amp; 8
                        </td>
                        <td>
                            1850
                        </td>
                    </tr>
                </table></div>);
    }

    private reset = () => {
        const regular = shuffle(regularDice.map((die) => randomElement(die)));
        const extras = shuffle(extraDice.map((die) => randomElement(die)));
        this.setState({ timer: counterDuration, extras, regular });
    }

}
