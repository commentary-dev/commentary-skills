import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  copyDirectory,
  readCatalogs,
  readPackageJson,
  repoPath,
  writeJson,
} from "./lib.mjs";

export function generateClaudePlugins() {
  const packageJson = readPackageJson();
  const { skills, plugins } = readCatalogs();
  const skillByName = new Map(skills.map((skill) => [skill.name, skill]));

  const marketplaceDescription = "Commentary agent skills and platform plugins.";
  const marketplacePlugins = plugins.map((plugin) => {
    const pluginRoot = `plugins/${plugin.name}`;
    fs.mkdirSync(repoPath(`${pluginRoot}/.claude-plugin`), { recursive: true });
    const mcpServers = Array.isArray(plugin.mcpServers) ? plugin.mcpServers : [];

    const pluginManifest = {
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      author: {
        name: "Commentary",
      },
      homepage: "https://github.com/commentary-dev/commentary-skills",
      repository: "https://github.com/commentary-dev/commentary-skills",
      license: packageJson.license,
      keywords: plugin.tags,
      category: plugin.category,
      tags: plugin.tags,
      skills: "./skills",
    };
    if (mcpServers.includes("commentary")) {
      pluginManifest.mcpServers = "./.mcp.json";
      writeJson(`${pluginRoot}/.mcp.json`, {
        mcpServers: {
          commentary: {
            type: "http",
            url: "https://commentary.dev/mcp",
          },
        },
      });
    } else {
      fs.rmSync(repoPath(`${pluginRoot}/.mcp.json`), { force: true });
    }

    writeJson(`${pluginRoot}/plugin.json`, pluginManifest);
    writeJson(`${pluginRoot}/.claude-plugin/plugin.json`, pluginManifest);

    const skillsRoot = repoPath(`${pluginRoot}/skills`);
    fs.rmSync(skillsRoot, { recursive: true, force: true });
    fs.mkdirSync(skillsRoot, { recursive: true });

    for (const skillName of plugin.skills) {
      const skill = skillByName.get(skillName);
      if (!skill) {
        throw new Error(`Plugin ${plugin.name} references unknown skill ${skillName}`);
      }

      copyDirectory(skill.source, path.posix.join(pluginRoot, "skills", skillName));
    }

    return {
      name: plugin.name,
      source: `./${pluginRoot}`,
      description: plugin.description,
      version: plugin.version,
      category: plugin.category,
      tags: plugin.tags,
      author: {
        name: "Commentary",
      },
      homepage: "https://github.com/commentary-dev/commentary-skills",
      repository: "https://github.com/commentary-dev/commentary-skills",
      license: packageJson.license,
    };
  });

  writeJson(".claude-plugin/marketplace.json", {
    name: "commentary-skills",
    owner: {
      name: "Commentary",
    },
    description: marketplaceDescription,
    metadata: {
      description: marketplaceDescription,
      version: packageJson.version,
    },
    version: packageJson.version,
    plugins: marketplacePlugins,
  });

  writeJson(".github/plugin/marketplace.json", {
    name: "commentary-skills",
    owner: {
      name: "Commentary",
    },
    metadata: {
      description: marketplaceDescription,
      version: packageJson.version,
    },
    plugins: marketplacePlugins,
  });
}

if (process.argv[1] && path.basename(fileURLToPath(import.meta.url)) === path.basename(process.argv[1])) {
  generateClaudePlugins();
}
