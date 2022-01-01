import React, { useState } from "react"

import { get_random_string } from "./utils"

const padding = 64
const Header = () => {
    const [rand_strings] = useState([
        padding + 13 + padding, padding + 13 + padding, padding, 7 + padding,
        padding + 7, padding, padding + 13 + padding, padding + 13 + padding
    ].map(get_random_string))
    return <div style={{
        color: "var(--light-grey)",
        fontWeight: "bolder",
        fontSize: "32px",
        display: "flex",
        justifyContent: "center",
        width: "100%"
    }}>
        <div style={{
            whiteSpace: "nowrap"
        }}>
            {rand_strings[0]}<br />
            {rand_strings[1]}<br />
            {rand_strings[2]}
                <span style={{
                    color: "var(--orange)",
                    fontWeight: "bolder",
                }}>
                    LAMBDA
                </span>
                {rand_strings[3]}
            <br />
            {rand_strings[4]}
            <span style={{
                color: "var(--orange)",
                fontWeight: "bolder",
            }}>
                LOUNGE
            </span>
            {rand_strings[5]}<br />
            {rand_strings[6]}<br />
            {rand_strings[7]}
        </div>
    </div>
}
export default Header
