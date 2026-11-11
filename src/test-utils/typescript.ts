import { readdirSync } from "fs";
import { resolve } from "path";
import { API } from "typescript/unstable/sync";

function getDiagnostics(code: string): string[] {
  const allCode = `
  import { mock, spy, callsOf, returns, throws, resolves, rejects } from "./index";
  type Human = {
    name: string;
    birthDate: Date;
    getAge: () => number;
    getAgeAsync: () => Promise<number>;
    setName: (name: string) => void;
    setNameAsync: ()=>Promise<void>;
    mother: Human;
    father: Human;
  };
  ${code}
  `;
  const virtualFileName = resolve("src/__typecheck__.ts");
  const sourceDirectory = resolve("src");
  const configPath = resolve("tsconfig.json");
  const isVirtualFile = (fileName: string) =>
    resolve(fileName) === virtualFileName;
  const api = new API({
    cwd: process.cwd(),
    fs: {
      fileExists: (fileName) => isVirtualFile(fileName) || undefined,
      readFile: (fileName) => isVirtualFile(fileName) ? allCode : undefined,
      getAccessibleEntries: (directoryName) => {
        if (resolve(directoryName) !== sourceDirectory) {
          return undefined;
        }

        const entries = readdirSync(sourceDirectory, { withFileTypes: true });
        return {
          files: [
            ...entries.filter((entry) => entry.isFile()).map((entry) => entry.name),
            "__typecheck__.ts",
          ],
          directories: entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name),
        };
      },
    },
  });

  try {
    const snapshot = api.updateSnapshot({
      openProjects: [configPath],
      openFiles: [virtualFileName],
      fileChanges: { created: [virtualFileName] },
    });
    const project = snapshot.getProject(configPath);
    if (!project) {
      throw new Error(`TypeScript project not found: ${configPath}`);
    }

    return [
      ...project.program.getSyntacticDiagnostics(virtualFileName),
      ...project.program.getBindDiagnostics(virtualFileName),
      ...project.program.getSemanticDiagnostics(virtualFileName),
    ].map((diagnostic) => diagnostic.text);
  } finally {
    api.close();
  }
}

export function doesNotCompile(code: string, message: string) {
  expect(getDiagnostics(code).join("\n")).toContain(message);
}

export function doesCompile(code: string) {
  expect(getDiagnostics(code)).toEqual([]);
}