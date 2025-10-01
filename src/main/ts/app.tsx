import * as React from "react";
import * as ReactDOM from "react-dom/client";

import {normalize, setupPage} from "csstips";

import {Game} from "./game";

// CSS resets (https://typestyle.github.io/#/page)
normalize();
setupPage("#root");

// render root element
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Game />);
