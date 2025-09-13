"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Square, ChevronDown } from "lucide-react";

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

export default function CodeEditor() {
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLanguageChange = (language: (typeof LANGUAGES)[0]) => {
    setSelectedLanguage(language);
    setCode(DEFAULT_CODE[language.id as keyof typeof DEFAULT_CODE] || "");
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
      className={`h-screen flex flex-col ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} font-sans`}
    >
      {/* Header */}
      <header
        className={`border-b px-8 py-5 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} shadow-sm`}
      >
        <div className="flex items-center justify-between max-w-full">
          <div className="flex items-center space-x-3">
            <h1
              className={`text-2xl font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Code-itor
            </h1>
          </div>

          <div className="flex items-center space-x-40">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`px-6 py-2.5 mr-20 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
              }`}
            >
              {isDarkMode ? "☀️ Light" : "🌙 Dark"}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center space-x-3 px-5 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm shadow-sm min-w-[140px] ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
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
                      ? "bg-gray-800 border-gray-600"
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
                            ? "text-gray-300 hover:bg-gray-700"
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
              className={`flex items-center space-x-2.5 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm min-w-[100px] justify-center ${
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
          className={`flex-1 flex flex-col border-r transition-colors duration-300 ${
            isDarkMode
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-200"
          }`}
        >
          <div
            className={`px-6 py-4 border-b transition-colors duration-300 ${
              isDarkMode
                ? "bg-gray-750 border-gray-600"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <h2
              className={`text-sm font-semibold mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              {selectedLanguage.name} {selectedLanguage.version}
            </h2>
          </div>
          <div className="flex-1 p-0">
            <textarea
              ref={codeTextareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`Write your ${selectedLanguage.name} code here...`}
              className={`w-full h-full resize-none border-0 outline-none font-mono text-sm leading-7 p-6 bg-transparent transition-colors duration-300 ${
                isDarkMode
                  ? "text-gray-100 placeholder-gray-500"
                  : "text-gray-800 placeholder-gray-400"
              }`}
              style={{
                fontFamily:
                  '"SF Mono", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace',
                letterSpacing: "0.025em",
                tabSize: 2,
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Pane - Output and Input */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Input Section */}
          <div
            className={`h-1/3 border-b flex flex-col transition-colors duration-300 ${
              isDarkMode
                ? "bg-gray-800 border-gray-600"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`px-6 py-4 border-b transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gray-750 border-gray-600"
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
            </div>
            <div className="flex-1 p-0">
              <textarea
                ref={inputTextareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter program input here..."
                className={`w-full h-full resize-none border-0 outline-none font-mono text-sm leading-6 p-6 bg-transparent transition-colors duration-300 ${
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

          {/* Output Section */}
          <div
            className={`flex-1 flex flex-col transition-colors duration-300 ${
              isDarkMode ? "bg-gray-900" : "bg-gray-50"
            }`}
          >
            <div
              className={`px-6 py-4 border-b transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-gray-100 border-gray-200"
              }`}
            >
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
            <div className="flex-1 p-6 overflow-auto">
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
                {output || (
                  <span
                    className={`italic ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                  >
                    Output will appear here after running your code...
                  </span>
                )}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
