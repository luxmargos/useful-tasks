# Useful Tasks

Useful Tasks is a flexible CLI task runner that executes tasks defined in JSON or JSON5 configuration files. It was created to simplify workspace setup, automate repetitive steps, and manage complex dependencies—especially when working with multiple repositories or advanced file operations. Tasks are processed sequentially, and the tool supports a variety of built-in actions.

## Support

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/luxmargos)

## Installation

Install Useful Tasks globally or as a dev dependency in your project:

- **Globally:**
  ```sh
  npm install -g useful-tasks
  ```
- **Locally (per project, as dependency):**
  ```sh
  npm install useful-tasks
  ```
- **Locally (per project, as dev dependency):**
  ```sh
  npm install useful-tasks --save-dev
  ```

## CLI Options

```sh
useful-tasks --help
```

## Supported Tasks

Useful Tasks supports a variety of actions, each defined as a task type in your configuration:

- `cmd`: Run shell commands
- `output`: Output text to console or file
- `set-var`: Define variables for use in later tasks. It supports glob patterns to match files.
- `env-var`: Set environment variables for task execution. It supports glob patterns to match files.
- `fs-symlink`: Create symbolic links
- `fs-copy`: Copy files or directories. It supports glob patterns to match files.
- `fs-del`: Delete files or directories. It supports glob patterns to match files.
- `fs-mkdir`: Create directories
- `fs-touch`: Create empty file
- `git-setup`: Set up a Git repository as desired, e.g., reset to the last commit or check out a specific branch; also supports a specific `startPoint` option.
- `sub-tasks`: Run another Useful Tasks configuration as a sub-process
- `content-replace`: Find and replace content in files. It supports glob patterns to match files.

## How to Use

Useful Tasks is operated via CLI. Run the following for help:

```sh
useful-tasks --help
```

### Basic Usage

```sh
useful-tasks --script=my_tasks.json
```

### Include or Exclude Tasks by ID or Tag

```sh
useful-tasks --script=my_tasks.json --include=task1,task2
useful-tasks --script=my_tasks.json --exclude=task3
```

### Pass Variables and Environment Variables

```sh
useful-tasks --script=my_tasks.json --var-my-key=VALUE
useful-tasks --script=my_tasks.json --env-MY_ENV=VALUE
```

### Additional Options

- `--cwd <dir>`: Set working directory
- `--camel-keys <bool>`: Use camelCase for variable keys (default: true)
- `--cwd-mode <restore|keep>`: Restore or keep working directory after each task
- `--log-level <none|info|debug>`: Set logging verbosity

## Scripting

Tasks are defined in a JSON or JSON5 file. Tasks are executed in the order they appear.

### Task Object Structure

Each task can have the following properties:

- `type` (string, required): Task type (see Supported Tasks)
- `id` (string, optional): Unique identifier for referencing
- `tags` (string or array, optional): Tags for filtering tasks (can be a single string or array of strings)
- `enabled` (boolean, optional): If false, task is skipped (default: true)
- `cwd` (string, optional): Working directory for the task
- `when` (object, optional): Conditional execution based on platform, architecture, or machine.
  - `platform` (string, optional): Target platform (e.g., 'darwin', 'win32', 'linux', '!win32')
  - `architecture` (string, optional): Target architecture (e.g., 'x64', 'arm64', '!arm64')
  - `machine` (string, optional): Target machine (e.g., 'x86_64', 'arm64', '!arm64')
- `comment` (string, optional): Description or note
- `onError` (string, optional): Error handling strategy ('skip', 'throw', or 'warn', default: 'throw')

### Examples

Minimal:

```json
{
  "name": "Sample",
  "tasks": [{ "type": "output", "text": "Hello world!" }]
}
```

With various options:

```json
{
  "name": "Sample",
  "tasks": [
    {
      "type": "output",
      "text": "Hello macos!",
      "comment": "This is a comment",
      "enabled": true,
      "when": {
        "platform": "darwin"
      }
    },
    {
      "type": "output",
      "text": "Hello non windows!",
      "comment": "This is a comment",
      "enabled": true,
      "when": {
        "platform": "!win32"
      }
    },
    {
      "type": "output",
      "text": "Hello linux!",
      "comment": "This is a comment",
      "enabled": true,
      "when": {
        "platform": "linux"
      }
    }
  ]
}
```

### Environment and Global Options

```json
{
  "name": "Sample",
  "env": {
    "logLevel": "info", // 'info', 'debug', or 'none' // Default: 'info'
    // To replace variable literal in text properties of tasks. This Regex lets you replace `${variable.path}` with the value of the variable.
    "varReplaceRegex": "(?<!\\\\)\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}",
    // To replace environment variable literal in text properties of tasks. This Regex lets you replace `${variable.path}` with the value of the environment variable.
    "envVarReplaceRegex": "(?<!\\\\)\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}"
  },
  "tasks": []
}
```

## Tasks

### cmd

Runs shell commands with optional shell specification. Supports both single commands and arrays of commands that will run sequentially.

```json
{
  "type": "cmd",
  "cmd": "echo 'Hello World'",
  "shell": "/bin/bash" // Optional, defaults to system shell
}
```

Examples:

```json
// Simple command
{
  "type": "cmd",
  "cmd": "npm install"
}

// Multiple commands (executed sequentially)
{
  "type": "cmd",
  "cmd": [
    "npm install",
    "npm run build",
    "npm test"
  ]
}

// With working directory specified
{
  "type": "cmd",
  "cmd": "ls -la",
  "cwd": "./src"
}

// With conditional execution
{
  "type": "cmd",
  "cmd": "brew update",
  "when": {
    "platform": "darwin"
  }
}
```

### output

Outputs text to the console or a file.

```json
{
  "type": "output",
  "text": "Hello World",
  "target": "console", // Optional: "console", "file-write", "file-append", "c", "fw", or "fa" (defaults to "console")
  "path": "./output.txt" // Required if target is file-related
}
```

Examples:

```json
// Console output
{
  "type": "output",
  "target": "console",
  "text": "Starting process..."
}

// Write to file (overwriting)
{
  "type": "output",
  "target": "file-write", // or "fw"
  "text": "Log entry: Process completed",
  "path": "./logs/process.log"
}

// Append to file
{
  "type": "output",
  "target": "file-append", // or "fa"
  "text": "New log entry\n",
  "path": "./logs/process.log"
}
```

### set-var

Defines variables for use in later tasks. Variables can be set directly or loaded from files.

```json
{
  "type": "set-var",
  "key": "variableName",
  "value": "variableValue", // Can be string, number, boolean, or object
  "isFallback": false // Optional, if true, won't overwrite existing variables
}
```

Examples:

```json
// Simple variable
{
  "type": "set-var",
  "key": "greeting",
  "value": "Hello World"
}

// Object variable
{
  "type": "set-var",
  "key": "config",
  "value": {
    "port": 3000,
    "host": "localhost",
    "debug": true
  }
}

// Load from file
{
  "type": "set-var",
  "key": "settings",
  "src": "./config.json",
  "parser": "json" // Options: "json", "lines", "string", "auto" (default)
}

// Load from multiple files using glob patterns
{
  "type": "set-var",
  "key": "translations",
  "src": "./locales",
  "include": ["**/*.json"],
  "exclude": ["**/*.backup.json"],
  "parser": "json"
}
```

### env-var

Sets environment variables for the current process. Variables can be set directly or loaded from files.

```json
{
  "type": "env-var",
  "key": "ENV_VAR_NAME",
  "value": "value",
  "isFallback": false // Optional, if true, won't overwrite existing env vars
}
```

Alternatively, you can set multiple environment variables at once:

```json
{
  "type": "env-var",
  "map": {
    "NODE_ENV": "development",
    "PORT": "3000",
    "DEBUG": "true"
  },
  "isFallback": false
}
```

Examples:

```json
// Simple environment variable
{
  "type": "env-var",
  "key": "API_KEY",
  "value": "secret-key-123"
}

// Load from .env file or other formats
{
  "type": "env-var",
  "src": "./.env",
  "parser": "lines" // Options: "json", "lines", "auto" (default)
}

// Load from multiple files using glob patterns
{
  "type": "env-var",
  "src": "./configs",
  "include": ["**/*.env"],
  "exclude": ["**/*.local.env"],
  "parser": "lines"
}
```

### fs-symlink

Creates symbolic links between files or directories.

```json
{
  "type": "fs-symlink",
  "target": "./source/path",
  "path": "./link/path",
  "linkType": "file", // Optional: "file", "dir", or "junction" (Windows only)
  "forced": true // Optional: if true, will remove existing files/links at path
}
```

Examples:

```json
// Create a simple symlink
{
  "type": "fs-symlink",
  "target": "./actual/config.json",
  "path": "./config.json"
}

// Create a directory symlink with forced overwrite
{
  "type": "fs-symlink",
  "target": "./node_modules",
  "path": "./vendor/modules",
  "linkType": "dir",
  "forced": true
}
```

### fs-copy

Copies files or directories with optional glob pattern filtering.

```json
{
  "type": "fs-copy",
  "src": "./source/directory",
  "dest": "./destination/directory",
  "options": {
    "conflict": "overwrite" // Optional: "overwrite" or "skip"
  },
  "include": ["**/*.js"], // Optional: glob patterns to include
  "exclude": ["**/*.test.js"] // Optional: glob patterns to exclude
}
```

Examples:

```json
// Copy a single file
{
  "type": "fs-copy",
  "src": "./config.json",
  "dest": "./backup/config.json"
}

// Copy a directory with options
{
  "type": "fs-copy",
  "src": "./src",
  "dest": "./dist",
  "options": {
    "conflict": "skip"
  }
}

// Copy specific files using glob patterns
{
  "type": "fs-copy",
  "src": "./assets",
  "dest": "./public/assets",
  "include": ["**/*.{png,jpg,svg}"],
  "exclude": ["**/temp/**"]
}
```

### fs-del

Deletes files or directories with optional glob pattern filtering.

```json
{
  "type": "fs-del",
  "path": "./path/to/delete",
  "include": ["**/*.tmp"], // Optional: glob patterns to include
  "exclude": ["**/*.important"] // Optional: glob patterns to exclude
}
```

Examples:

```json
// Delete a single file
{
  "type": "fs-del",
  "path": "./temp.log"
}

// Delete a directory
{
  "type": "fs-del",
  "path": "./temp"
}

// Delete specific files using glob patterns
{
  "type": "fs-del",
  "path": "./cache",
  "include": ["**/*.cache"],
  "exclude": ["**/important/**"]
}
```

### fs-mkdir

Creates directories. Supports both single paths and arrays of paths.

```json
{
  "type": "fs-mkdir",
  "path": "./path/to/create" // String or array of strings
}
```

Examples:

```json
// Create a single directory
{
  "type": "fs-mkdir",
  "path": "./logs"
}

// Create multiple directories
{
  "type": "fs-mkdir",
  "path": [
    "./logs",
    "./data/cache",
    "./temp/uploads"
  ]
}

// Create nested directories
{
  "type": "fs-mkdir",
  "path": "./data/cache/temp"
}
```

### fs-touch

Creates empty files. Supports both single paths and arrays of paths. Will not overwrite existing files.

```json
{
  "type": "fs-touch",
  "path": "./path/to/file.txt" // String or array of strings
}
```

Examples:

```json
// Create an empty file
{
  "type": "fs-touch",
  "path": "./logs/app.log"
}

// Create multiple empty files
{
  "type": "fs-touch",
  "path": [
    "./.gitkeep",
    "./logs/errors.log",
    "./temp/placeholder.txt"
  ]
}

// Create a placeholder file
{
  "type": "fs-touch",
  "path": "./.gitkeep"
}
```

### git-setup

Clones or updates a Git repository to a specific state.

```json
{
  "type": "git-setup",
  "localPath": "./path/to/repo",
  "url": "https://github.com/user/repo.git",
  "branch": "main",
  "remote": "origin", // Optional, defaults to "origin"
  "startPoint": "v1.0.0", // Optional, specific commit hash or tag to checkout
  "checkLocalChanges": true, // Optional, whether to check for local changes
  "updateSubmodules": true // Optional, can be boolean or array of submodule paths
}
```

Examples:

```json
// Basic repository setup
{
  "type": "git-setup",
  "localPath": "./projects/my-repo",
  "url": "https://github.com/user/my-repo.git",
  "branch": "main"
}

// Clone with specific tag and submodule handling
{
  "type": "git-setup",
  "localPath": "./vendor/library",
  "url": "https://github.com/org/library.git",
  "branch": "stable",
  "startPoint": "v2.1.0",
  "updateSubmodules": ["./plugins/core", "./plugins/extra"]
}

// Development setup without checking local changes
// This is so wild you can lose your local changes if you are not careful because 'checkLocalChanges' is false
{
  "type": "git-setup",
  "localPath": "./dev/sandbox",
  "url": "https://github.com/team/sandbox.git",
  "branch": "develop",
  "checkLocalChanges": false,
  "updateSubmodules": false
}
```

### sub-tasks

Runs another task file or directory of task files as a sub-task group.

```json
{
  "type": "sub-tasks",
  "src": "./path/to/tasks.json",
  "shareArgs": true, // Optional: whether to share CLI args with sub-tasks
  "shareVars": true, // Optional: whether to share variables with sub-tasks
  "args": "", // Optional: additional CLI args to pass to sub-tasks
  "include": ["**/*.json"], // Optional: glob patterns to include
  "exclude": ["**/*.skip.json"] // Optional: glob patterns to exclude
}
```

Examples:

```json
// Run a single task file
{
  "type": "sub-tasks",
  "src": "./setup/init.json"
}

// Run multiple task files with shared context
{
  "type": "sub-tasks",
  "src": "./tasks",
  "include": ["**/*.json"],
  "exclude": ["**/temp/**"],
  "shareVars": true,
  "args": "--tags deploy"
}

// Run isolated sub-tasks without sharing variables
{
  "type": "sub-tasks",
  "src": "./modules/cleanup.json",
  "shareVars": false,
  "shareArgs": false
}
```

### content-replace

Replaces content in files using string or regex patterns.

```json
{
  "type": "content-replace",
  "path": "./path/to/file.txt", // File or directory path
  "find": "text to find", // String to find or regex object
  "replace": "replacement text", // Replacement string
  "loop": 1, // Optional: number of replacements to make (-1 for all occurrences)
  "include": ["**/*.txt"], // Optional: glob patterns to include when path is a directory
  "exclude": ["**/*.bak"] // Optional: glob patterns to exclude when path is a directory
}
```

Examples:

```json
// Simple text replacement
{
  "type": "content-replace",
  "path": "./config.json",
  "find": "development",
  "replace": "production"
}

// Replace all occurrences
{
  "type": "content-replace",
  "path": "./README.md",
  "find": "TODO",
  "replace": "DONE",
  "loop": -1 // Replace all occurrences
}

// Using regex
{
  "type": "content-replace",
  "path": "./src",
  "find": {
    "pattern": "version:\\s*['\"]([0-9\\.]+)['\"];",
    "flags": "g"
  },
  "replace": "version: '1.2.0';",
  "include": ["**/*.js", "**/*.ts"]
}

// Multiple files with glob patterns
{
  "type": "content-replace",
  "path": "./templates",
  "find": "{{PROJECT_NAME}}",
  "replace": "my-awesome-project",
  "include": ["**/*.html", "**/*.md"],
  "exclude": ["**/node_modules/**"]
}
```

## Tips

### JSON5 Formatting

Useful Tasks supports JSON5, so you can use comments and trailing commas in your configuration files:

```json
{
  // This is a comment
  "type": "output",
  "text": "Hello, world!"
}
```

### 'set-var' vs 'env-var'

- `set-var` stores the variable in the task context
- `env-var` stores the variable in the environment variables

### Variable Replacement

Use `set-var` or `env-var` to define variables, then reference them in later tasks using `${varName}`:

```json
{
  "tasks": [
    { "type": "set-var", "key": "msg", "value": "Hello" },
    { "type": "env-var", "key": "msg2", "value": "Hello2" },
    { "type": "output", "text": "The message: ${msg} ${msg2}" }
  ]
}
```

Useful Tasks supports variable replacement using the pattern `${variable.path}`:

- Regex: `(?<!\\\\)\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}`
- Escaping: Use `\\${variable.path}` to prevent replacement

### Built-in Variables

- `${__env.cwd_startup}`: The directory where Useful Tasks was launched
- `${__env.cwd_base}`: The base working directory (set via `--cwd`)

### Glob Filters

Many tasks support glob patterns for file matching using `include` and `exclude` properties:

```json
{
  "type": "fs-copy",
  "src": "./source",
  "dest": "./destination",
  "include": ["**/*.js", "**/*.ts"],
  "exclude": ["**/*.test.js"]
}
```

Tasks that support glob filters: `set-var`, `env-var`, `fs-copy`, `fs-del`, and `content-replace`.

### Advanced Examples

- Use glob patterns in `include`/`exclude` fields to match files
- Use regular expressions for advanced content replacement
- Chain multiple configs using `sub-tasks`

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

For bugs, questions, or contributions, please visit the [GitHub repository](https://github.com/luxmargos/useful-tasks).
