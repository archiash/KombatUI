import { Minion } from "./minion";

export interface Game {
    turn: number
    minions: Minion[]
    budget: number
    settings: Record<string, number>
    grid: number[][]
}
