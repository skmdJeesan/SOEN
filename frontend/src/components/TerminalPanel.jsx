import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const TerminalPanel = forwardRef(
  ({ webContainer, onFilesystemChange, onPreviewStop }, ref) => {
    const containerRef = useRef(null);
    const xtermRef = useRef(null);
    const shellProcessRef = useRef(null);
    const inputWriterRef = useRef(null);
    const pendingCommandsRef = useRef([]);
    const syncTimerRef = useRef(null);
    const onFilesystemChangeRef = useRef(onFilesystemChange);
    const onPreviewStopRef = useRef(onPreviewStop);

    onFilesystemChangeRef.current = onFilesystemChange;
    onPreviewStopRef.current = onPreviewStop;

    useImperativeHandle(ref, () => ({
      runCommand: (command) => {
        onPreviewStopRef.current?.();
        if (inputWriterRef.current) {
          inputWriterRef.current.write(command + "\n");
        } else {
          pendingCommandsRef.current.push(command);
        }
      },
    }));

    useEffect(() => {
      if (!webContainer || !containerRef.current) return;
      let disposed = false;

      const xterm = new XTerm({
        convertEol: true,
        fontSize: 14,
        theme: { background: "#0a0a0a" },
        cursorBlink: true,
      });
      const fitAddon = new FitAddon();
      xterm.loadAddon(fitAddon);
      xterm.open(containerRef.current);
      fitAddon.fit();
      xtermRef.current = xterm;

      const startShell = async () => {
        const shellProcess = await webContainer.spawn("jsh", {
          terminal: { cols: xterm.cols, rows: xterm.rows },
        });
        if (disposed) {
          shellProcess.kill();
          return;
        }
        shellProcessRef.current = shellProcess;
        shellProcess.exit.then(() => {
          if (!disposed) onPreviewStopRef.current?.();
        });

        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              xterm.write(data);
            },
          }),
        );

        const input = shellProcess.input.getWriter();
        inputWriterRef.current = input;
        pendingCommandsRef.current.forEach((command) => input.write(command + "\n"));
        pendingCommandsRef.current = [];
        xterm.onData((data) => {
          input.write(data);
          if (data.includes("\u0003")) onPreviewStopRef.current?.();
          if (data.includes("\r") || data.includes("\n")) {
            clearTimeout(syncTimerRef.current);
            syncTimerRef.current = setTimeout(
              () => onFilesystemChangeRef.current?.(),
              1000,
            );
          }
        });
      };

      startShell();

      const handleResize = () => {
        fitAddon.fit();
        shellProcessRef.current?.resize({ cols: xterm.cols, rows: xterm.rows });
      };
      window.addEventListener("resize", handleResize);

      return () => {
        disposed = true;
        window.removeEventListener("resize", handleResize);
        clearTimeout(syncTimerRef.current);
        inputWriterRef.current?.releaseLock();
        inputWriterRef.current = null;
        shellProcessRef.current?.kill();
        shellProcessRef.current = null;
        xterm.dispose();
      };
    }, [webContainer]);

    return <div ref={containerRef} className="h-screen w-full" />;
  },
);

export default TerminalPanel;
