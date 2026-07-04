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

const SUPPORTED_PLUGIN_TARGETS = ["claude-code", "copilot", "codex"];

function pluginTargets(plugin) {
  const targets = Array.isArray(plugin.targets) ? plugin.targets : [plugin.target ?? "claude-code"];
  return targets.filter((target) => SUPPORTED_PLUGIN_TARGETS.includes(target));
}

function pluginHasTarget(plugin, target) {
  return pluginTargets(plugin).includes(target);
}

function commonManifest(plugin, packageJson) {
  const mcpServers = Array.isArray(plugin.mcpServers) ? plugin.mcpServers : [];
  const manifest = {
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
    manifest.mcpServers = "./.mcp.json";
  }

  return manifest;
}

function codexShortDescription(plugin) {
  if (plugin.name === "commentary-review") {
    return "Review docs and app previews";
  }
  if (plugin.name === "commentary-forms") {
    return "Create and analyze Forms";
  }
  return plugin.displayName;
}

function codexDefaultPrompt(plugin) {
  if (plugin.name === "commentary-review") {
    return "Use $commentary-draft-review to review a Commentary draft.";
  }
  if (plugin.name === "commentary-forms") {
    return "Use $commentary-form-creation to create a Commentary form.";
  }
  return `Use $${plugin.skills[0]} for this Commentary workflow.`;
}

function codexManifest(plugin, packageJson) {
  const manifest = commonManifest(plugin, packageJson);
  return {
    ...manifest,
    interface: {
      displayName: plugin.displayName,
      shortDescription: codexShortDescription(plugin),
      longDescription: plugin.description,
      developerName: "Commentary",
      category: plugin.category,
      capabilities: ["Skills", "MCP"],
      websiteURL: "https://commentary.dev",
      privacyPolicyURL: "https://commentary.dev/privacy",
      termsOfServiceURL: "https://commentary.dev/terms",
      defaultPrompt: [
        codexDefaultPrompt(plugin),
      ],
      brandColor: "#2563EB",
    },
  };
}

function marketplaceEntry(plugin, packageJson) {
  return {
    name: plugin.name,
    source: `./plugins/${plugin.name}`,
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
}

function codexMarketplaceEntry(plugin) {
  return {
    name: plugin.name,
    source: {
      source: "local",
      path: `./plugins/${plugin.name}`,
    },
    policy: {
      installation: "AVAILABLE",
      authentication: "ON_INSTALL",
    },
    category: plugin.category,
  };
}

function syncPluginFiles(plugin, packageJson, skillByName) {
  const pluginRoot = `plugins/${plugin.name}`;
  fs.mkdirSync(repoPath(pluginRoot), { recursive: true });

  const mcpServers = Array.isArray(plugin.mcpServers) ? plugin.mcpServers : [];
  if (mcpServers.includes("commentary")) {
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

  const manifest = commonManifest(plugin, packageJson);
  if (pluginHasTarget(plugin, "copilot")) {
    writeJson(`${pluginRoot}/plugin.json`, manifest);
  } else {
    fs.rmSync(repoPath(`${pluginRoot}/plugin.json`), { force: true });
  }

  if (pluginHasTarget(plugin, "claude-code")) {
    fs.mkdirSync(repoPath(`${pluginRoot}/.claude-plugin`), { recursive: true });
    writeJson(`${pluginRoot}/.claude-plugin/plugin.json`, manifest);
  } else {
    fs.rmSync(repoPath(`${pluginRoot}/.claude-plugin`), { recursive: true, force: true });
  }

  if (pluginHasTarget(plugin, "codex")) {
    fs.mkdirSync(repoPath(`${pluginRoot}/.codex-plugin`), { recursive: true });
    writeJson(`${pluginRoot}/.codex-plugin/plugin.json`, codexManifest(plugin, packageJson));
  } else {
    fs.rmSync(repoPath(`${pluginRoot}/.codex-plugin`), { recursive: true, force: true });
  }

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
}

export function generateClaudePlugins() {
  const packageJson = readPackageJson();
  const { skills, plugins } = readCatalogs();
  const skillByName = new Map(skills.map((skill) => [skill.name, skill]));

  for (const plugin of plugins) {
    syncPluginFiles(plugin, packageJson, skillByName);
  }

  const marketplaceDescription = "Commentary agent skills and platform plugins.";
  const claudePlugins = plugins.filter((plugin) => pluginHasTarget(plugin, "claude-code")).map((plugin) => marketplaceEntry(plugin, packageJson));
  const copilotPlugins = plugins.filter((plugin) => pluginHasTarget(plugin, "copilot")).map((plugin) => marketplaceEntry(plugin, packageJson));
  const codexPlugins = plugins.filter((plugin) => pluginHasTarget(plugin, "codex")).map(codexMarketplaceEntry);

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
    plugins: claudePlugins,
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
    plugins: copilotPlugins,
  });

  writeJson(".agents/plugins/marketplace.json", {
    name: "commentary-skills",
    interface: {
      displayName: "Commentary Skills",
    },
    plugins: codexPlugins,
  });
}

if (process.argv[1] && path.basename(fileURLToPath(import.meta.url)) === path.basename(process.argv[1])) {
  generateClaudePlugins();
}
