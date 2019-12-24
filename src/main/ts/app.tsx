import * as React from "react";
import * as ReactDOM from "react-dom";

import {normalize, setupPage} from "csstips";

import {Game} from "./game";

// CSS resets (https://typestyle.github.io/#/page)
normalize();
setupPage("#root");

// render root element
ReactDOM.render(
    <Game />,
    document.getElementById("root"),
);
