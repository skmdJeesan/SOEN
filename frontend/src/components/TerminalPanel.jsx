import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const TerminalPanel = forwardRef(
  ({ webContainer, onFilesystemChange }, ref) => {
    const containerRef = useRef(null);
    const xtermRef = useRef(null);
    const shellProcessRef = useRef(null);
    const inputWriterRef = useRef(null);
    const syncTimerRef = useRef(null);

    useImperativeHandle(ref, () => ({
      runCommand: (command) => {
        if (inputWriterRef.current) {
          inputWriterRef.current.write(command + "\n");
        }
      },
    }));

    useEffect(() => {
      if (!webContainer || !containerRef.current) return;

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
        shellProcessRef.current = shellProcess;

        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              xterm.write(data);
            },
          }),
        );

        const input = shellProcess.input.getWriter();
        inputWriterRef.current = input;
        xterm.onData((data) => {
          input.write(data);
          if (data.includes("\r") || data.includes("\n")) {
            clearTimeout(syncTimerRef.current);
            syncTimerRef.current = setTimeout(
              () => onFilesystemChange?.(),
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
        window.removeEventListener("resize", handleResize);
        clearTimeout(syncTimerRef.current);
        inputWriterRef.current?.releaseLock();
        inputWriterRef.current = null;
        shellProcessRef.current?.kill();
        xterm.dispose();
      };
    }, [webContainer]);

    return <div ref={containerRef} className="h-full w-full" />;
  },
);

export default TerminalPanel;
