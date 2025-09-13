// app/api/execute/route.ts
import { NextRequest, NextResponse } from "next/server";

const PISTON_API_URL = "https://emkc.org/api/v2/piston";

interface ExecuteRequest {
  language: string;
  version: string;
  code: string;
  stdin?: string;
}

interface PistonResponse {
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
  };
}

export async function POST(request: NextRequest) {
  try {
    const {
      language,
      version,
      code,
      stdin = "",
    }: ExecuteRequest = await request.json();

    if (!language || !version || !code) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: language, version, or code",
        },
        { status: 400 },
      );
    }

    const pistonPayload = {
      language,
      version,
      files: [
        {
          name: getFileName(language),
          content: code,
        },
      ],
      stdin: stdin || "",
      args: [],
      compile_timeout: 10000,
      run_timeout: 3000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    };

    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pistonPayload),
    });

    if (!response.ok) {
      throw new Error(`Piston API responded with status: ${response.status}`);
    }

    const result: PistonResponse = await response.json();

    let output = "";

    if (result.run.stdout) {
      output += result.run.stdout;
    }

    if (result.run.stderr) {
      if (output) output += "\n";
      output += result.run.stderr;
    }

    // Check if the program had a non-zero exit code
    if (result.run.code !== 0) {
      return NextResponse.json({
        success: false,
        error: output || `Program exited with code ${result.run.code}`,
      });
    }

    return NextResponse.json({
      success: true,
      output: output || "Program executed successfully (no output)",
      exitCode: result.run.code,
    });
  } catch (error) {
    console.error("Error executing code:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

function getFileName(language: string): string {
  const fileExtensions: Record<string, string> = {
    javascript: "main.js",
    python: "main.py",
    java: "Main.java",
    cpp: "main.cpp",
    c: "main.c",
    rust: "main.rs",
    go: "main.go",
    php: "main.php",
  };

  return fileExtensions[language] || "main.txt";
}
