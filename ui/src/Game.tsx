import { FunctionComponent, h } from "preact";
import { MutableRef, useEffect, useState } from "preact/hooks";
import { Text } from "preact-localization";
import Sockette from "sockette";

import {
  Board,
  computeDrop,
  computeMove,
  computeReset,
  computeUndo,
  emptyBoard,
  Message,
  WINNING_POSITIONS,
} from "teeko-cc-common/src/model";

import { BoardView } from "./BoardView";
import { OnlineStatus } from "./App.tsx";
import { wsUrl } from "./env.ts";

export const Game: FunctionComponent<{
  initial: Board;
  pill: string;
  roomPath?: string;
  showHelp: () => void;
  setPop: (count: number | undefined) => void;
  setOnlineStatus: (status: OnlineStatus) => void;
  resetBoard: MutableRef<() => void | undefined>;
}> = ({
  initial,
  roomPath,
  pill,
  showHelp,
  setPop,
  setOnlineStatus,
  resetBoard,
}) => {
  const [board, setBoard] = useState(initial);
  const [ws, setWs] = useState<Sockette | undefined>(undefined);

  resetBoard.current = () => setBoard(emptyBoard());

  function offline() {
    setOnlineStatus(OnlineStatus.OFFLINE);
    setPop(undefined);
  }

  useEffect(() => {
    if (roomPath) {
      const url = wsUrl(`room/${roomPath}`, pill);
      const sockette = new Sockette(url, {
        onopen: () => setOnlineStatus(OnlineStatus.ONLINE),
        onreconnect: offline,
        onclose: offline,
        onmessage: (evt: MessageEvent) => {
          const msg = JSON.parse(evt.data) as Message;
          if (msg.st === null) {
            ws?.send(JSON.stringify({ st: { board } } as Message));
          }
          if (msg.st?.board) {
            moveToBoard(msg.st.board, false);
          }
          if (msg.pop !== undefined) {
            setPop(msg.pop);
          }
        },
      });
      setWs(sockette);
      return () => {
        sockette.close();
        setWs(undefined);
      };
    }
  }, [roomPath]);

  function moveToBoard(board: Board, propagate = true) {
    setBoard(board);
    localStorage.setItem("board", JSON.stringify(board));
    if (propagate && ws) {
      ws.send(JSON.stringify({ st: { board } } as Message));
    }
  }

  function move(from: number, to: number) {
    const after = computeMove(board, from, to);
    if (roomPath) after.p = false;
    if (after) moveToBoard(after);
  }

  function drop(pos: number) {
    const after = computeDrop(board, pos);
    if (roomPath) after.p = false;
    if (after) moveToBoard(after);
  }

  function undo() {
    const after = computeUndo(board);
    if (roomPath) after.p = false;
    if (after) moveToBoard(after);
  }

  return (
    <>
      <BoardView
        board={board}
        drop={drop}
        move={move}
        klass="full"
        showStatus={true}
      />
      <p class="buttons">
        <button onClick={undo} disabled={board.m.length === 0}>
          <Text id="game.undo" />
        </button>
        <button
          onClick={() => moveToBoard(computeReset(board))}
          disabled={board.a === 0}
        >
          <Text id="game.reset" />
        </button>
        <button
          onClick={() => window.open("https://discord.gg/KEj9brTRS6", "_blank")}
        >
          <Text id="game.discord" />
        </button>
        <button onClick={showHelp}>
          <Text id="game.help" />
        </button>
      </p>
    </>
  );
};
