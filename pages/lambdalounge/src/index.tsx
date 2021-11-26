import React from "react";
import ReactDOM from "react-dom";

import { Provider } from "react-redux"
import store from "./state/store"

import Main from "./main"

ReactDOM.render(
    <Provider store={store}>
        <Main />
    </Provider>,
    document.querySelector('#root')
);
