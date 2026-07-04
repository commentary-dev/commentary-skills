import fs from "node:fs";
import {
  assert,
  listDirectoryNames,
  parseFrontmatter,
  parseOpenAiYaml,
  pathExists,
  readCatalogs,
  readText,
} from "./lib.mjs";

const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const requiredTargets = ["codex", "copilot", "claude-code", "openclaw"];
const requiredPluginTargets = ["claude-code", "copilot", "codex"];
const supportedMcpServers = new Set(["commentary"]);

function pluginTargets(plugin) {
  return Array.isArray(plugin.targets) ? plugin.targets : [plugin.target].filter(Boolean);
}

function pluginHasTarget(plugin, target) {
  return pluginTargets(plugin).includes(target);
}

function validate() {
  const { skills, plugins } = readCatalogs();
  const skillNames = skills.map((skill) => skill.name);
  const skillNameSet = new Set(skillNames);

  assert(skillNames.length === skillNameSet.size, "catalog/skills.yaml has duplicate skill names");
  assert(plugins.length > 0, "catalog/plugins.yaml must define at least one plugin");

  const directories = listDirectoryNames("skills");
  assert(
    JSON.stringify(directories) === JSON.stringify([...skillNames].sort()),
    `skills/ directories must match catalog entries. Found ${directories.join(", ")}; catalog has ${skillNames.join(", ")}`,
  );

  for (const skill of skills) {
    validateSkill(skill);
  }

  for (const plugin of plugins) {
    validatePlugin(plugin, skillNameSet);
  }

  validateGeneratedMarketplaceMetadata(plugins);
}

function validateSkill(skill) {
  assert(namePattern.test(skill.name), `Invalid skill name: ${skill.name}`);
  assert(skill.source === `skills/${skill.name}`, `${skill.name} source must be skills/${skill.name}`);
  assert(pathExists(`${skill.source}/SKILL.md`), `${skill.name} is missing SKILL.md`);
  assert(pathExists(`${skill.source}/agents/openai.yaml`), `${skill.name} is missing agents/openai.yaml`);
  assert(Array.isArray(skill.targets), `${skill.name} targets must be an array`);

  for (const target of requiredTargets) {
    assert(skill.targets.includes(target), `${skill.name} must target ${target}`);
  }

  for (const field of ["displayName", "category", "version", "summary", "slug"]) {
    assert(typeof skill[field] === "string" && skill[field].length > 0, `${skill.name} missing ${field}`);
  }

  const { frontmatter, body } = parseFrontmatter(`${skill.source}/SKILL.md`);
  assert(frontmatter.name === skill.name, `${skill.name} frontmatter name must match folder`);
  assert(typeof frontmatter.description === "string", `${skill.name} needs frontmatter description`);
  assert(frontmatter.description.length >= 80, `${skill.name} description is too short for reliable triggering`);
  assert(body.trim().length > 0, `${skill.name} SKILL.md body is empty`);
  assert(
    JSON.stringify(Object.keys(frontmatter).sort()) === JSON.stringify(["description", "name"]),
    `${skill.name} SKILL.md frontmatter should contain only name and description`,
  );

  const openai = parseOpenAiYaml(`${skill.source}/agents/openai.yaml`);
  for (const field of ["display_name", "short_description", "default_prompt"]) {
    assert(typeof openai[field] === "string" && openai[field].length > 0, `${skill.name} openai.yaml missing ${field}`);
  }
}

function validatePlugin(plugin, skillNameSet) {
  assert(namePattern.test(plugin.name), `Invalid plugin name: ${plugin.name}`);
  assert(Array.isArray(plugin.targets), `${plugin.name} targets must be an array`);
  for (const target of requiredPluginTargets) {
    assert(plugin.targets.includes(target), `${plugin.name} must target ${target}`);
  }
  assert(Array.isArray(plugin.tags), `${plugin.name} tags must be an array`);
  assert(Array.isArray(plugin.skills), `${plugin.name} skills must be an array`);

  for (const field of ["displayName", "version", "description", "category"]) {
    assert(typeof plugin[field] === "string" && plugin[field].length > 0, `${plugin.name} missing ${field}`);
  }

  for (const skillName of plugin.skills) {
    assert(skillNameSet.has(skillName), `${plugin.name} references unknown skill ${skillName}`);
  }

  if (plugin.mcpServers !== undefined) {
    assert(Array.isArray(plugin.mcpServers), `${plugin.name} mcpServers must be an array`);
    for (const serverName of plugin.mcpServers) {
      assert(supportedMcpServers.has(serverName), `${plugin.name} references unsupported MCP server ${serverName}`);
    }
  }
}

function validateGeneratedMarketplaceMetadata(catalogPlugins) {
  if (!pathExists(".claude-plugin/marketplace.json")) {
    return;
  }

  validatePlatformMarketplace(".claude-plugin/marketplace.json", catalogPlugins, "claude-code", "claude");
  validatePlatformMarketplace(".github/plugin/marketplace.json", catalogPlugins, "copilot", "copilot");
  validateCodexMarketplace(".agents/plugins/marketplace.json", catalogPlugins);
}

function validatePlatformMarketplace(marketplacePath, catalogPlugins, target, platform) {
  assert(pathExists(marketplacePath), `${marketplacePath} is missing`);
  const marketplace = JSON.parse(readText(marketplacePath));
  assert(marketplace.name === "commentary-skills", `${marketplacePath} name must be commentary-skills`);
  assert(marketplace.owner?.name === "Commentary", `${marketplacePath} owner must be Commentary`);
  assert(marketplace.metadata?.description, `${marketplacePath} must set metadata.description`);
  assert(Array.isArray(marketplace.plugins), `${marketplacePath} plugins must be an array`);

  const expectedNames = catalogPlugins.filter((plugin) => pluginHasTarget(plugin, target)).map((plugin) => plugin.name).sort();
  assert(
    JSON.stringify(marketplace.plugins.map((plugin) => plugin.name).sort()) === JSON.stringify(expectedNames),
    `${marketplacePath} plugins must match catalog ${target} plugins`,
  );

  for (const plugin of marketplace.plugins) {
    assert(plugin.source?.startsWith("./plugins/"), `${plugin.name} must use a relative plugin source`);
    assert(plugin.version, `${plugin.name} marketplace entry must set version`);

    const pluginRoot = plugin.source.slice(2);
    const manifestPath = platform === "claude" ? `${pluginRoot}/.claude-plugin/plugin.json` : `${pluginRoot}/plugin.json`;
    validatePluginManifest(plugin.name, manifestPath, pluginRoot, false);
  }
}

function validateCodexMarketplace(marketplacePath, catalogPlugins) {
  assert(pathExists(marketplacePath), `${marketplacePath} is missing`);
  const marketplace = JSON.parse(readText(marketplacePath));
  assert(marketplace.name === "commentary-skills", `${marketplacePath} name must be commentary-skills`);
  assert(marketplace.interface?.displayName, `${marketplacePath} must set interface.displayName`);
  assert(Array.isArray(marketplace.plugins), `${marketplacePath} plugins must be an array`);

  const expectedNames = catalogPlugins.filter((plugin) => pluginHasTarget(plugin, "codex")).map((plugin) => plugin.name).sort();
  assert(
    JSON.stringify(marketplace.plugins.map((plugin) => plugin.name).sort()) === JSON.stringify(expectedNames),
    `${marketplacePath} plugins must match catalog codex plugins`,
  );

  for (const plugin of marketplace.plugins) {
    assert(plugin.source?.source === "local", `${plugin.name} Codex marketplace source must be local`);
    assert(plugin.source?.path?.startsWith("./plugins/"), `${plugin.name} must use a relative plugin source path`);
    assert(plugin.policy?.installation, `${plugin.name} must set Codex installation policy`);
    assert(plugin.policy?.authentication, `${plugin.name} must set Codex authentication policy`);
    assert(plugin.category, `${plugin.name} must set Codex category`);

    const pluginRoot = plugin.source.path.slice(2);
    validatePluginManifest(plugin.name, `${pluginRoot}/.codex-plugin/plugin.json`, pluginRoot, true);
  }
}

function validatePluginManifest(pluginName, manifestPath, pluginRoot, requireInterface) {
  assert(fs.existsSync(manifestPath), `${pluginName} plugin manifest is missing at ${manifestPath}`);
  const manifest = JSON.parse(readText(manifestPath));
  assert(manifest.name === pluginName, `${pluginName} manifest name mismatch at ${manifestPath}`);
  assert(manifest.version, `${pluginName} manifest must set version at ${manifestPath}`);
  assert(manifest.skills === "./skills", `${pluginName} manifest must point skills to ./skills at ${manifestPath}`);
  if (requireInterface) {
    assert(manifest.interface?.displayName, `${pluginName} Codex manifest must set interface.displayName`);
    assert(manifest.interface?.shortDescription, `${pluginName} Codex manifest must set interface.shortDescription`);
  }
  if (manifest.mcpServers) {
    assert(manifest.mcpServers === "./.mcp.json", `${pluginName} manifest must point mcpServers to ./.mcp.json at ${manifestPath}`);
    assert(fs.existsSync(`${pluginRoot}/.mcp.json`), `${pluginName} MCP config is missing at ${pluginRoot}/.mcp.json`);
    const mcp = JSON.parse(readText(`${pluginRoot}/.mcp.json`));
    assert(mcp.mcpServers?.commentary?.type === "http", `${pluginName} MCP config must define commentary as an HTTP server`);
    assert(mcp.mcpServers?.commentary?.url === "https://commentary.dev/mcp", `${pluginName} MCP config must point to Commentary MCP`);
  }
}

try {
  validate();
  console.log("Skill validation passed");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
