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
  const [isDarkMode, setIsDarkMode] = useState(false);
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
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen flex flex-col ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Header */}
      <header
        className={`border-b px-6 py-4 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center justify-between">
          <h1
            className={`text-2xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Code Editor
          </h1>
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                <span className="font-medium">{selectedLanguage.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {isDropdownOpen && (
                <div
                  className={`absolute top-full mt-2 right-0 border rounded-lg shadow-lg py-1 min-w-[160px] z-10 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang)}
                      className={`w-full text-left px-4 py-2 transition-colors duration-200 ${
                        selectedLanguage.id === lang.id
                          ? isDarkMode
                            ? "bg-blue-900 text-blue-300"
                            : "bg-blue-50 text-blue-700"
                          : isDarkMode
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Run/Stop Button */}
            <button
              onClick={isRunning ? stopExecution : runCode}
              disabled={!code.trim() && !isRunning}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                isRunning
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Pane - Code Editor */}
        <div
          className={`flex-1 flex flex-col border-r transition-colors duration-300 ${
            isDarkMode
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-200"
          }`}
        >
          <div
            className={`px-4 py-3 border-b transition-colors duration-300 ${
              isDarkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <h2
              className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Code Editor
            </h2>
          </div>
          <div className="flex-1 p-4">
            <textarea
              ref={codeTextareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`Write your ${selectedLanguage.name} code here...`}
              className={`w-full h-full resize-none border-0 outline-none font-mono text-sm leading-relaxed bg-transparent transition-colors duration-300 ${
                isDarkMode
                  ? "text-gray-100 placeholder-gray-500"
                  : "text-gray-800 placeholder-gray-400"
              }`}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Pane - Output and Input */}
        <div className="flex-1 flex flex-col">
          {/* Input Section */}
          <div
            className={`h-1/3 border-b flex flex-col transition-colors duration-300 ${
              isDarkMode
                ? "bg-gray-800 border-gray-600"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`px-4 py-3 border-b transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <h2
                className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Input
              </h2>
            </div>
            <div className="flex-1 p-4">
              <textarea
                ref={inputTextareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter program input here..."
                className={`w-full h-full resize-none border-0 outline-none font-mono text-sm leading-relaxed bg-transparent transition-colors duration-300 ${
                  isDarkMode
                    ? "text-gray-100 placeholder-gray-500"
                    : "text-gray-800 placeholder-gray-400"
                }`}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Output Section */}
          <div
            className={`flex-1 flex flex-col transition-colors duration-300 ${
              isDarkMode ? "bg-gray-900" : "bg-gray-100"
            }`}
          >
            <div
              className={`px-4 py-3 border-b transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-gray-200 border-gray-300"
              }`}
            >
              <h2
                className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Output
              </h2>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <pre
                className={`text-sm font-mono leading-relaxed whitespace-pre-wrap transition-colors duration-300 ${
                  output.startsWith("Error:") ||
                  output.startsWith("Network error:")
                    ? "text-red-400"
                    : isRunning
                      ? "text-yellow-400"
                      : isDarkMode
                        ? "text-green-400"
                        : "text-green-600"
                }`}
              >
                {output || `Output will appear here...`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
