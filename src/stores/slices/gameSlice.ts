import { RootState } from "../store";
import {Game} from "@/types/game"
import {Minion} from "@/types/minion"
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { range } from "d3";

const initialState: { game: Game } = {
  game: {
    turn: 0,
    minions: [],
    budget: 0,
    settings: {},
    grid: range(8).map((i) => range(8).map((j) => 0))
  },
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setGame(state, action: PayloadAction<Game>) {
      state.game = action.payload;
    },
    addMinionToGame(state, action: PayloadAction<Minion>) {
      state.game.minions.push(action.payload);
    },
    nextTurn(state){
      state.game.turn += 1
    },
    receiveBudget(state, action: PayloadAction<number>){
      state.game.budget += action.payload
    },
    setSettings(state, action: PayloadAction<Record<string, number>>){
      state.game.settings = action.payload
    },
    setGridCellOwner(state, action: PayloadAction<{row:number, col:number, owner: number}>){
      state.game.grid[action.payload.row][action.payload.col] = action.payload.owner
    }
  },
});

export const { setGridCellOwner, setGame, addMinionToGame, nextTurn, receiveBudget, setSettings} = gameSlice.actions;
export const selectGame = (state: RootState) => state.game.game;
export default gameSlice.reducer;
