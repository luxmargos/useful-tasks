# Useful tasks

A CLI task runner that utilizes JSON-based configuration and processes tasks sequentially.
This project was initiated to resolve git repository dependencies without using git submodules.
It aims to be useful for setting up a workspace with complex dependencies and multiple preparation steps.

## Support

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/luxmargos)

## Installation

* Use globally

```npm install -g useful-tasks```

* Project locally

```npm insatll useful-tasks --save-dev```

## Supported Tasks
* cmd
* output
* set-var
* env-var
* symlink
* fs-copy
* fs-del
* git-repo-prepare
* sub-tasks
* content-replace

## How to use

Useful-tasks can be used through a command line interface

```useful-tasks --help```

```text
Usage: useful-tasks [options]

Options:
  -V, --version              output the version number
  --cwd <string>             Change working directory
  -c, --config <string>      A path of json configuraion (default: "useful_tasks.json")
  -i, --include <items>      Include tasks that contain at least one of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02
  -a, --include-cta <items>  Include tasks that contain all of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02
  -e, --exclude <items>      Exclude tasks that contain at least one of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02
  -x, --exclude-cta <items>  Exclude tasks that contain all of the specified parameters. Specify the IDs or tags separated by commas. For example: my_task_01, my_task_02
  --camel-keys <boolean>     Specify whether to use camel case for the key of the variable. If the value is true, the paramter "--var-my-key" will be converted to "myKey" otherwise it will be "my-key" (default: true)
  --cwd-mode <string>        Choose between 'restore' or 'keep'. If you use 'cwd' property in a specific task, consider using this parameter. This parameter determines the behavior of the current working directory (CWD) when each task ends. In 'restore' mode, the
                             CWD will be restored to its original state (or the one specified at --cwd) when each task ends, while in 'keep' mode, the CWD will remain unchanged. (default: "restore")
  --log-level <string>       Specify the logging level as none,info,debug. This parameter takes higher priority than the 'json' configuration. (default: "info")
  -h, --help                 display help for command
```

* Default usage

```useful-tasks --config=my_tasks.json```

* Process with including specific tasks

```useful-tasks --config=my_tasks.json --include=my_task_1,my_task_2```

* Process without some of tasks

```useful-tasks --config=my_tasks.json --exclude=my_task_1,my_task_2```

* The variables can be set using command-line parameters. Just use the prefix '--var-' followed by the key-value pair, e.g., '--var-my-key=VALUE'. You can then use this custom variable in your configuration using the syntax '${myKey}'. This will have the same effect as the 'set-var' task.

 ```useful-tasks --config=my_tasks.json --var-my-key=VALUE```

* You can turn off the camel case conversion by setting the '--camel-keys' parameter to false. Then you can use it with '${my-key}'.

 ```useful-tasks --config=my_tasks.json --camel-keys=false --var-my-key=VALUE```

* The environment variables can be set using command-line parameters. Just use the prefix '--env-' followed by the key-value pair, e.g., '--env-my-key=VALUE'.

 ```useful-tasks --config=my_tasks.json --env-my-key=VALUE```

## Configuration
The tasks will be processed in the order they are specified.

### A basic structure
```json5
{
    "name":"Sample",
    "tasks":[
        {
            "type":"output",
            "text":"Hello world!"
        }
    ]
}
```

### Environment configuration
```json5
{
    "name":"Sample",
    //Optional.
    "env":{
        //Optional. Specify the logging level as 'info', 'debug', or 'none'.
        //Default="info"
        "logLevel":"info",
        
        //Optional. The regular expression used for replacing parts of the text with variables. The default regex targets the format '${VARIABLE_KEY}'. 
        //DEFAULT="\$\{([a-zA-Z0-9\.\-_]*)\}"
        "replaceRegex":"..."
    },
    "tasks":[
        ...
    ]
}
```

### Common Task structure
All tasks have the following common properties

```json5
{
    "name":"Sample",
    "tasks":[
        {
            //Required
            "type":"TASK TYPE",
            
            //Optional. The identifier of task. It also used for including or excluding specific tasks.
            "id":"<UNIQUE TASK ID>",

            //Optional. Used by include or exclude specific tasks.
            "tags":[],

            //Optional. If the value is false, the task will be skipped without being processed.
            //DEFAULT=true
            "enabled":true,

            //Optional. Current working directory. Each task can be proccessed in a different directory. 
            //DEFAULT="."
            "cwd":"...",

            //Optional. The comment will be printed before starting a task, unless you set the --log-level to none.
            "comment":"..."
        }
    ]
}
```

### Tasks
```json5
{
    "name":"Sample",
    "tasks":[
        {
            //Run a terminal command
            "type":"cmd",

            //Command line to execute
            "cmd":"..."
        },

        {
            //The variable can be set and subsequently used by all following tasks. 
            "type":"set-var",

            //This represents the key for the variable. All subsequent tasks will access the variable using this key.
            "key":"access_key_to_var",

            //The variable can be a type such as 'string', 'number', 'object' for "varType":"value"
            "value":"text",
            "value":1,
            //To access nested variable from another task, use the expression 'access_key_to_var.a'
            "value":{
                "a":"value of a",
                "b":{
                    "c":"value of c"
                }
            },

            // The 'src' can be a path to a file or a directory. The processor reveals the variables from the file(s).
            "src": "path/of/json/file.json",

            // Optional. This option applies with the 'src' parameter and can be set to either 'json', 'lines' or 'string'. 
            // When set to 'json', the content of the file will be parsed as JSON.
            // DEFAULT="auto"
            "parser": "json",

            // Optional. This option allows you to include specific files using glob patterns. The "src" path must be a directory.
            "include": "*.txt",
            // An array is allowed
            "include": ["foo/bar/*", "bar/**/*.txt"],

            // Optional. This option allows you to exclude specific files using glob patterns. The "src" path must be a directory.
            "exclude": "*.txt",
            // An array is allowed
            "exclude": ["foo/bar/*", "bar/**/*.txt"],

            //Optional. Skip setting the variable if it already exists.
            //DEFAULT=false
            "fallback":false
        },

        {
            //Set the environment variable that usable while process is running
            "type":"env-var",

            //Set the variable name and text.
            "value":{
                "ENV_VAR_1":"HELLO",
                "ENV_VAR_2":"WORLD"
            },

            //Lines style also works.
            "value":"\
                ENV_VAR_1=HELLO\n\
                ENV_VAR_2=WORLD
            ",

            // The 'src' can be a path to a file or a directory. The processor reveals the variables from the file(s).
            "src": "path/of/json/file.json",

            // Optional. This option applies with the 'src' parameter and can be set to either 'json' or 'lines'. 
            // When set to 'json', the content of the file will be parsed as JSON.
            // DEFAULT="auto"
            "parser": "json",

            // Optional. This option allows you to include specific files using glob patterns. The "src" path must be a directory.
            "include": "*.txt",
            // An array is allowed
            "include": ["foo/bar/*", "bar/**/*.txt"],

            // Optional. This option allows you to exclude specific files using glob patterns. The "src" path must be a directory.
            "exclude": "*.txt",
            // An array is allowed
            "exclude": ["foo/bar/*", "bar/**/*.txt"],

            //Optional. Skip setting the environment variable if it already exists.
            //DEFAULT=false
            "fallback":false
        },

        {
            //To output a text
            "type":"output",
            "text":"Hello world!",
            //Optional. 'console' or 'c', 'file-write' or 'fw', 'file-append' or 'fa'. 
            //Default="console"
            "target":"file-write",
            //Optional. But required on "target" is "file".
            "path":"my-output.txt"
        },
        
        {
            //To output a text with the value of 'set-var' that was previously set.
            "type":"output",
            "text":"I found a value ${key_of_value.a}!"
        },

        {
            //To copy a file or directory
            "type":"fs-copy",
            "src":"copy-source.txt",
            "dest":"copy-destination.txt",

            //Optional.
            "options":{
                //Optional. 'skip' or 'overwrite'
                //Default="overwrite"
                "conflict":"overwrite",
            },
            //Optional. This option allows you to include specific files using glob patterns. The "src" path must be a directory.
            "include": "*.txt",
            //An array is allowed
            "include":["foo/bar/*","bar/**/*.txt"],

            //Optional. This option allows you to exclude specific files using glob patterns. The "src" path must be a directory.
            "exclude": "*.txt",
            //An array is allowed
            "exclude":["foo/bar/*","bar/**/*.txt"]
        },

        {
            //To delete a file or directory
            "type":"fs-del",
            "path":"delete-target.txt",

            //Optional. This option allows you to include specific files using glob patterns. The "path" must be a directory.
            "include": "*.txt",
            //An array is allowed
            "include":["foo/bar/*","bar/**/*.txt"],

            //Optional. This option allows you to exclude specific files using glob patterns. The "path" must be a directory.
            "exclude": "*.txt",
            //An array is allowed
            "exclude":["foo/bar/*","bar/**/*.txt"]
        },

        {
            //Find and replace the content of file
            "type":"content-replace",
            //Required.
            "path":"path_to_file.txt",

            //Required.
            "find":"TEXT_TO_REPLACE",

            //Required. If you want to use Regular Expression
            "find":{
                "pattern":"TEXT_TO_REPLACE",
                //Opional. Regex Flags
                "flags":"gi",
            },
            
            //Required.
            "replace":"REPLACEMENT CONTENT",

            //Optional. The count of loops for the entire find and replace operation. If Regular Expression is used with flags, including 'g', it is recommended to leave it as is.
            "loop":1,

            //Optional. This option allows you to include specific files using glob patterns. The "path" must be a directory.
            "include": "*.txt",
            //An array is allowed
            "include":["foo/bar/*","bar/**/*.txt"],

            //Optional. This option allows you to exclude specific files using glob patterns. The "path" must be a directory.
            "exclude": "*.txt",
            //An array is allowed
            "exclude":["foo/bar/*","bar/**/*.txt"]
        }

        {
            "type":"symlink",
            
            //"TARGET PATH of SYMLINK"
            "target":"./symlink_target",
            
            //"SYMLINK DESTINATION PATH"
            "path":"./symlink_path",
            
            //Remove an existing path and recreate a symlink each time the process is executed
            "forced":true,
            
            //'dir', 'file', 'junction'
            "linkType":"dir"
        },

        {
            //Run another 'useful-tasks' process as a single task with specified arguments
            "type":"sub-tasks",

            //This is same with 'useful-tasks -c another_tasks.json'
            "args":"-c another_tasks.json",
        },

        {
            //This task sets up a Git repository. The main purpose is to prepare the Git repository to be usable, utilizing various Git commands such as clone, checkout, reset, fetch, and clean.
            "type":"git-repo-prepare",

            //A path of git(local) repository
            "localPath":"./path/of/local/git/repository",

            //Optional. Set a value if you want to use a different binary of git.
            //DEFAULT="git"
            "bin":"git",
            
            //Optional. Leave it empty if using local repository.
            "url":"https://.../xxx.git",

            //Optional. Specify a branch(local) that you want to use
            "branch":"master",
            
            //Optional. Use a specific commit hash, tag or another branch(e.g origin/master)
            "startPoint":"origin/master",
            
            //Optional.
            "updateSubmodules":false
        }
    ]
}
```

## Tips

### Json5 formatting

The default JSON parser used is json5, allowing you to write tasks with comments and line breaks.

```json5
{
    //my comment
    "type":"output",
    "text":"HELLO \
world!!!"
}
```

### Replacement string with 'set-var' 

The values specified in the 'set-var' task can replace any string properties in the subsequent tasks, except for the 'id' and 'tags' properties.

```json5
{
    "tasks":[
        {
            "type":"set-var",
            "key":"myVar",
            "value":"HELLO set-var"
        },
        {
            "type":"output",
            "text":"The message: ${myVar}"
        },
    ]
}
```

will output

```
The message: Hello set-var
```


### Accessing default variables

#### Aceess to a startup directory 

```json
{
    "type":"some_task",
    "some_property":"${__env.cwd_startup}"
}
```

#### Access to a base directory
The base directory is main working directory that is applied using the '--cwd' argument on the command line.

```json
{
    "type":"some_task",
    "some_property":"${__env.cwd_base}"
}
```