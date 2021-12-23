import sample from "lodash/sample"

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const get_random_string = (length: number) =>
    Array.from({ length }).map(_ => sample(characters)).join("")

export { get_random_string } 
