

## How to use

Useful-tasks can be used through a command line interface

* Default usage
 $ useful-tasks --config=my_tasks.json

* Process with including specific tasks
 $ useful-tasks --config=my_tasks.json --include=my_task_1,my_task_2

* Process without some of tasks
 $ useful-tasks --config=my_tasks.json --exclude=my_task_1,my_task_2

* The custom variables can be set using command-line parameters. Just use the prefix '--var-' followed by the key-value pair, e.g., '--var-my-key=VALUE'. You can then use this custom variable in your configuration using the syntax '${myKey}'. This will have the same effect as the 'set-var' task.
 $ useful-tasks --config=my_tasks.json --var-my-key=VALUE

* You can turn off the camel case conversion by setting the '--camel-keys' parameter to false. Then you can use it with '${my-key}'.
 $ useful-tasks --config=my_tasks.json --camel-keys=false --var-my-key=VALUE

## Supported Tasks
* cmd
* output
* set-var
* env-var
* symlink
* git-repo-prepare
* fs-copy
* fs-del

## Configuration
The tasks will be processed in the order they are specified.

### A basic structure
```json
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
```json
{
    "name":"Sample",
    //Optional.
    "env":{
        //Optional. To see what happens throughout the entire process.
        "verbose":false,
        //Optional. To see what happens with 'git-repo-prepare' task.
        "verboseGit":false,
        //Optional. The regular expression used for replacing parts of the text with variables. The default regex targets the format '${VARIABLE_KEY}'. DEFAULT="\$\{([a-zA-Z0-9\.\-_]*)\}"
        "replaceRegex":"..."
    },
    "tasks":[
        ...
    ]
}
```

### Common Task structure
All tasks have the following common properties

```json
{
    "name":"Sample",
    "tasks":[
        {
            //Required
            "type":"TASK TYPE",
            
            //Optional. The identifier of task.
            "id":"UNIQUE TASK ID",

            //Optional.
            "tags":[],

            //Optional. If the value is false, the task will be skipped without being processed. DEFAULT=true
            "enabled":true,

            //Optional. Current working directory. Each task can be proccessed in a different directory. DEFAULT="."
            "cwd":"...",
        }
    ]
}
```

### Tasks
```json
{
    "name":"Sample",
    "tasks":[
         {
            //This task sets up a Git repository. The main purpose is to prepare the Git repository to be usable, utilizing various Git commands such as clone, checkout, reset, fetch, and clean.
            "type":"git-repo-prepare",

            //A path of git(local) repository
            "localPath":"...",

            //Optional. Set a value if you want to use a different binary of git. DEFAULT="git"
            "bin":"git",
            
            //Optional. Leave it empty if using local repository.
            "url":"https://.../xxx.git",

            //Optional. Specify a branch(local) that you want to use
            "branch":"master",
            
            //Optional. Use a specific commit hash, tag or another branch(e.g origin/master)
            "startPoint":"origin/master",
            
            //Optional.
            "updateSubmodules":false
        },
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
            "var":"text",
            "var":1,
            //To access nested variable from another task, use the expression 'access_key_to_var.a'
            "var":{
                "a":"value of a",
                "b":{
                    "c":"value of c"
                }
            },
            //The variable can be a path of the file for the "varType":"file"
            "var":"path/of/json/file.json",

            //Optional. It can be used as either 'value' or 'file.' If the 'varType' is 'file,' the 'var' must be a file path. DEFAULT="value"
            "varType":"value",

            //Optional. This option applies when the 'varType' parameter is set to 'file', and can be set to either 'json' or 'string'. 
            //When set to 'json', the content of the file will be parsed as JSON. DEFAULT="string"
            "fileFormat":"string"
        },

        {
            //Set the environment variable that usable while process is running
            "type":"env-var",

            //Set the variable name and text.
            "var":{
                "ENV_VAR_1":"HELLO",
                "ENV_VAR_2":"WORLD"
            },
            //The variable can be a path of the file for the "varType":"file"
            //The example content of the file.json
            //{
            //  "ENV_VAR_1":"HELLO",
            //  "ENV_VAR_2":"WORLD"    
            //}
            "var":"path/of/json/file.json",


            //Optional. It can be used as either 'dict' or 'file.' 
            //If the 'varType' is 'file,' the 'var' must be a file path and its content must be a json formatted.
            //DEFAULT="dict"
            "varType":"dict"
        },

        {
            //To output a text
            "type":"output",
            "text":"Hello world!",
            //Optional. 'console' or 'c', 'file-write' or 'fw', 'file-append' or 'fa'. Default="console"
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
        },

        {
            //To delete a file or directory
            "type":"fs-del",
            "path":"delete-target.txt"
        }
    ]
}
```

## Tips

### Referencing directories
* Aceess to a directory at startup

```json
{
    "type":"some_task",
    "some_property":"${__env.cwd_startup}"
}
```

* Access to a base directory
The base directory is main working directory that is applied using the '--cwd' argument on the command line.

```json
{
    "type":"some_task",
    "some_property":"${__env.cwd_base}"
}
```