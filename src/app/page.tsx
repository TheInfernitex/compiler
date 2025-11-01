"use client";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Square,
  ChevronDown,
  Copy,
  RotateCcw,
  Check,
} from "lucide-react";

const LANGUAGES = [
  { id: "javascript", name: "JavaScript", version: "18.15.0" },
  { id: "python", name: "Python", version: "3.10.0" },
  { id: "java", name: "Java", version: "15.0.2" },
  { id: "cpp", name: "C++", version: "10.2.0" },
  { id: "c", name: "C", version: "10.2.0" },
  { id: "rust", name: "Rust", version: "1.68.2" },
  { id: "go", name: "Go", version: "1.16.2" },
  { id: "php", name: "PHP", version: "8.2.3" },
];

const DEFAULT_CODE = {
  javascript: `console.log("Hello, World!");
console.log("Enter your name:");
// You can use input in the right pane`,
  python: `print("Hello, World!")
name = input("Enter your name: ")
print(f"Hello, {name}!")`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  rust: `fn main() {
    println!("Hello, World!");
}`,
  go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
  php: `<?php
echo "Hello, World!\\n";
?>`,
};

// Monaco language mappings
const MONACO_LANGUAGE_MAP: { [key: string]: string } = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  rust: "rust",
  go: "go",
  php: "php",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
interface MonacoEditor {
  getValue: () => string;
  setValue: (value: string) => void;
  onDidChangeModelContent: (callback: () => void) => void;
  getModel: () => any;
  dispose: () => void;
}

interface MonacoInstance {
  editor: {
    create: (container: HTMLElement, options: any) => MonacoEditor;
    setTheme: (theme: string) => void;
    setModelLanguage: (model: any, language: string) => void;
  };
}

declare global {
  interface Window {
    monaco: MonacoInstance;
    require: {
      config: (config: { paths: { vs: string } }) => void;
      (deps: string[], callback: () => void): void;
    };
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function CodeEditor() {
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(false);

  // Draggable panes state
  const [leftPaneWidth, setLeftPaneWidth] = useState(50); // percentage
  const [rightPaneInputHeight, setRightPaneInputHeight] = useState(33); // percentage of right pane
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);

  const codeEditorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<MonacoEditor | null>(null);
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add a ref to track if we're programmatically updating the editor
  const isUpdatingFromState = useRef(false);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [inputCopied, setInputCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // Handle client-side hydration and Monaco loading
  useEffect(() => {
    setIsClient(true);

    // Load Monaco Editor
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js";
    script.onload = () => {
      window.require.config({
        paths: {
          vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs",
        },
      });
      window.require(["vs/editor/editor.main"], () => {
        setIsMonacoLoaded(true);
      });
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize Monaco Editor
  useEffect(() => {
    if (
      isMonacoLoaded &&
      isClient &&
      codeEditorRef.current &&
      !monacoEditorRef.current
    ) {
      const editor = window.monaco.editor.create(codeEditorRef.current, {
        value: code,
        language: MONACO_LANGUAGE_MAP[selectedLanguage.id] || "javascript",
        theme: isDarkMode ? "vs-dark" : "vs",
        fontSize: 14,
        lineHeight: 24,
        fontFamily:
          '"SF Mono", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        lineNumbers: "on",
        folding: true,
        selectOnLineNumbers: true,
        matchBrackets: "always",
        autoIndent: "full",
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 2,
        insertSpaces: true,
      });

      editor.onDidChangeModelContent(() => {
        // Only update state if we're not programmatically updating
        if (!isUpdatingFromState.current) {
          setCode(editor.getValue());
        }
      });

      monacoEditorRef.current = editor;
    }
  }, [isMonacoLoaded, isClient]);

  // Update Monaco theme when dark mode changes
  useEffect(() => {
    if (monacoEditorRef.current) {
      window.monaco.editor.setTheme(isDarkMode ? "vs-dark" : "vs");
    }
  }, [isDarkMode]);

  // Update Monaco language when language changes (but NOT when code changes from typing)
  useEffect(() => {
    if (monacoEditorRef.current) {
      const model = monacoEditorRef.current.getModel();
      if (model) {
        window.monaco.editor.setModelLanguage(
          model,
          MONACO_LANGUAGE_MAP[selectedLanguage.id] || "javascript",
        );
      }
    }
  }, [selectedLanguage.id]); // Only depend on selectedLanguage.id, not code

  // Vertical drag handling (between left and right panes)
  const handleVerticalMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingVertical(true);
  }, []);

  const handleVerticalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingVertical || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPaneWidth(Math.max(20, Math.min(80, newLeftWidth)));
    },
    [isDraggingVertical],
  );

  const handleVerticalMouseUp = useCallback(() => {
    setIsDraggingVertical(false);
  }, []);

  // Horizontal drag handling (between input and output in right pane)
  const handleHorizontalMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingHorizontal(true);
  }, []);

  const handleHorizontalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingHorizontal || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const headerHeight = 72; // Approximate header height
      const rightPaneTop = rect.top + headerHeight;
      const rightPaneHeight = rect.height - headerHeight;
      const newInputHeight =
        ((e.clientY - rightPaneTop) / rightPaneHeight) * 100;
      setRightPaneInputHeight(Math.max(20, Math.min(80, newInputHeight)));
    },
    [isDraggingHorizontal],
  );

  const handleHorizontalMouseUp = useCallback(() => {
    setIsDraggingHorizontal(false);
  }, []);

  // Mouse event listeners
  useEffect(() => {
    if (isDraggingVertical) {
      document.addEventListener("mousemove", handleVerticalMouseMove);
      document.addEventListener("mouseup", handleVerticalMouseUp);
    }
    if (isDraggingHorizontal) {
      document.addEventListener("mousemove", handleHorizontalMouseMove);
      document.addEventListener("mouseup", handleHorizontalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleVerticalMouseMove);
      document.removeEventListener("mouseup", handleVerticalMouseUp);
      document.removeEventListener("mousemove", handleHorizontalMouseMove);
      document.removeEventListener("mouseup", handleHorizontalMouseUp);
    };
  }, [
    isDraggingVertical,
    isDraggingHorizontal,
    handleVerticalMouseMove,
    handleVerticalMouseUp,
    handleHorizontalMouseMove,
    handleHorizontalMouseUp,
  ]);

  const handleLanguageChange = (language: (typeof LANGUAGES)[0]) => {
    setSelectedLanguage(language);
    const newCode =
      DEFAULT_CODE[language.id as keyof typeof DEFAULT_CODE] || "";

    // Update the editor content programmatically
    if (monacoEditorRef.current) {
      isUpdatingFromState.current = true;
      monacoEditorRef.current.setValue(newCode);
      isUpdatingFromState.current = false;
    }

    setCode(newCode);
    setOutput("");
    setInput("");
    setIsDropdownOpen(false);
  };

  const runCode = async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    setOutput("Running...");

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: selectedLanguage.id,
          version: selectedLanguage.version,
          code: code,
          stdin: input,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOutput(result.output || "Program executed successfully (no output)");
      } else {
        setOutput(`Error: ${result.error}`);
      }
    } catch (error) {
      setOutput(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsRunning(false);
    }
  };

  const stopExecution = () => {
    setIsRunning(false);
    setOutput("Execution stopped");
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const resetCode = () => {
    const newCode = "";

    if (monacoEditorRef.current) {
      isUpdatingFromState.current = true;
      monacoEditorRef.current.setValue(newCode);
      isUpdatingFromState.current = false;
    }

    setCode(newCode);
    setOutput("");
  };

  const copyInput = async () => {
    try {
      await navigator.clipboard.writeText(input);
      setInputCopied(true);
      setTimeout(() => setInputCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy input:", err);
    }
  };

  const resetInput = () => {
    setInput("");
    if (inputTextareaRef.current) {
      inputTextareaRef.current.focus();
    }
  };

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setOutputCopied(true);
      setTimeout(() => setOutputCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy output:", err);
    }
  };

  const resetOutput = () => {
    setOutput("");
  };

  // Show a loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`h-screen flex flex-col ${isDarkMode ? "bg-black" : "bg-gray-50"} font-sans select-none`}
    >
      {/* Header */}
      <header
        className={`border-b px-6 py-4 ${isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"} shadow-sm`}
      >
        <div className="flex items-center justify-between max-w-full">
          <div className="flex items-center justify-center space-x-6 ml-10">
            <h1
              className={`text-1xl font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Coditor
            </h1>
          </div>

          <div className="flex items-center gap-x-2">
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullScreen}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm ${
                isDarkMode
                  ? "bg-neutral-800 hover:bg-neutral-700 text-gray-200 border border-neutral-700"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
              }`}
            >
              {isFullScreen ? "⛶" : "⛶"}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm ${
                isDarkMode
                  ? "bg-neutral-800 hover:bg-neutral-700 text-gray-200 border border-neutral-700"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
              }`}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            {/* Language Selector */}
            <div className="relative justify-center items-center">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center justify-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm min-w-[120px] ${
                  isDarkMode
                    ? "bg-neutral-800 hover:bg-neutral-700 text-gray-200 border border-neutral-700"
                    : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                }`}
              >
                <span>{selectedLanguage.name}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div
                  className={`absolute top-full mt-2 right-0 border rounded-lg shadow-xl py-2 min-w-[200px] z-20 ${
                    isDarkMode
                      ? "bg-neutral-900 border-neutral-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang)}
                      className={`w-full text-left px-4 py-3 transition-all duration-150 flex items-center justify-between ${
                        selectedLanguage.id === lang.id
                          ? isDarkMode
                            ? "bg-blue-900 text-blue-200"
                            : "bg-blue-50 text-blue-700"
                          : isDarkMode
                            ? "text-gray-300 hover:bg-neutral-800"
                            : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="font-medium">{lang.name}</span>
                      <span
                        className={`text-xs ${selectedLanguage.id === lang.id ? "opacity-70" : "opacity-50"}`}
                      >
                        {lang.version}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Run/Stop Button */}
            <button
              onClick={isRunning ? stopExecution : runCode}
              disabled={!code.trim() && !isRunning}
              className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm min-w-[110px] justify-center ${
                isRunning
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-red-200"
                  : "bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed shadow-green-200"
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Pane - Code Editor */}
        <div
          className={`flex flex-col transition-colors duration-300 ${
            isDarkMode ? "bg-neutral-900" : "bg-white"
          }`}
          style={{ width: `${leftPaneWidth}%` }}
        >
          <div
            className={`px-4 py-3 border-b transition-colors duration-300 flex items-center justify-between ${
              isDarkMode
                ? "bg-neutral-800 border-neutral-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <h2
              className={`text-sm font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              {selectedLanguage.name} {selectedLanguage.version}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={copyCode}
                className={`p-1.5 rounded transition-all duration-200 ${
                  isDarkMode
                    ? "hover:bg-neutral-700 text-gray-400 hover:text-gray-200"
                    : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                }`}
                title="Copy code"
              >
                {codeCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={resetCode}
                className={`p-1.5 rounded transition-all duration-200 ${
                  isDarkMode
                    ? "hover:bg-neutral-700 text-gray-400 hover:text-gray-200"
                    : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                }`}
                title="Reset to default"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            {!isMonacoLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Loading editor...
                </div>
              </div>
            ) : (
              <div
                ref={codeEditorRef}
                className="w-full h-full"
                style={{ minHeight: "100%" }}
              />
            )}
          </div>
        </div>

        {/* Vertical Resizer */}
        <div
          className={`w-1 cursor-col-resize transition-colors duration-200 hover:bg-blue-500 ${
            isDarkMode ? "bg-neutral-700" : "bg-gray-300"
          } ${isDraggingVertical ? "bg-blue-500" : ""}`}
          onMouseDown={handleVerticalMouseDown}
        />

        {/* Right Pane - Output and Input */}
        <div
          className="flex flex-col min-h-0"
          style={{ width: `${100 - leftPaneWidth}%` }}
        >
          {/* Input Section */}
          <div
            className={`flex flex-col border-b transition-colors duration-300 ${
              isDarkMode
                ? "bg-neutral-900 border-neutral-700"
                : "bg-white border-gray-200"
            }`}
            style={{ height: `${rightPaneInputHeight}%` }}
          >
            <div
              className={`px-4 py-3 border-b transition-colors duration-300 flex items-center justify-between ${
                isDarkMode
                  ? "bg-neutral-800 border-neutral-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <h2
                className={`text-sm font-semibold uppercase tracking-wider transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Program Input
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyInput}
                  className={`p-1.5 rounded transition-all duration-200 ${
                    isDarkMode
                      ? "hover:bg-neutral-700 text-gray-400 hover:text-gray-200"
                      : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                  }`}
                  title="Copy input"
                >
                  {inputCopied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={resetInput}
                  className={`p-1.5 rounded transition-all duration-200 ${
                    isDarkMode
                      ? "hover:bg-neutral-700 text-gray-400 hover:text-gray-200"
                      : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                  }`}
                  title="Clear input"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-0">
              <textarea
                ref={inputTextareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter program input here..."
                className={`w-full h-full resize-none border-0 outline-none font-mono text-sm leading-6 p-4 bg-transparent transition-colors duration-300 ${
                  isDarkMode
                    ? "text-gray-100 placeholder-gray-500"
                    : "text-gray-800 placeholder-gray-400"
                }`}
                style={{
                  fontFamily:
                    '"SF Mono", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace',
                  letterSpacing: "0.025em",
                }}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Horizontal Resizer */}
          <div
            className={`h-1 cursor-row-resize transition-colors duration-200 hover:bg-blue-500 ${
              isDarkMode ? "bg-neutral-700" : "bg-gray-300"
            } ${isDraggingHorizontal ? "bg-blue-500" : ""}`}
            onMouseDown={handleHorizontalMouseDown}
          />

          {/* Output Section */}
          <div
            className={`flex flex-col transition-colors duration-300 ${
              isDarkMode ? "bg-[#0d0d0d]" : "bg-gray-50"
            }`}
            style={{ height: `${100 - rightPaneInputHeight}%` }}
          >
            <div
              className={`px-4 py-3 border-b transition-colors duration-300 flex items-center justify-between ${
                isDarkMode
                  ? "bg-neutral-900 border-neutral-800"
                  : "bg-gray-100 border-gray-200"
              }`}
            >
              <div>
                <h2
                  className={`text-sm font-semibold uppercase tracking-wider transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Program Output
                </h2>
                <p
                  className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Results from your program execution
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyOutput}
                  disabled={!output}
                  className={`p-1.5 rounded transition-all duration-200 ${
                    isDarkMode
                      ? "hover:bg-neutral-800 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      : "hover:bg-gray-200 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                  title="Copy output"
                >
                  {outputCopied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={resetOutput}
                  disabled={!output}
                  className={`p-1.5 rounded transition-all duration-200 ${
                    isDarkMode
                      ? "hover:bg-neutral-800 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      : "hover:bg-gray-200 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                  title="Clear output"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <pre
                className={`text-sm font-mono leading-6 whitespace-pre-wrap transition-colors duration-300 ${
                  output.startsWith("Error:") ||
                  output.startsWith("Network error:")
                    ? isDarkMode
                      ? "text-red-400"
                      : "text-red-600"
                    : isRunning
                      ? isDarkMode
                        ? "text-amber-400"
                        : "text-amber-600"
                      : isDarkMode
                        ? "text-green-400"
                        : "text-green-700"
                }`}
                style={{
                  fontFamily:
                    '"SF Mono", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace',
                  letterSpacing: "0.025em",
                }}
              >
                {output}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
