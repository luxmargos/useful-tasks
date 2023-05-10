

## How to use

Useful-tasks can be used thorough command line interface

### Default usage
 $ useful-tasks --config=my_tasks.json

### Process with including specific tasks
 $ useful-tasks --config=my_tasks.json --include=my_task_1,my_task_2

### Process without some of tasks
 $ useful-tasks --config=my_tasks.json --exclude=my_task_1,my_task_2

## Configuration
The tasks will be processed in the order they are specified.

### A basic structure
```json
{
    "name":"Sample",
    "tasks":[
        ...
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
        //Optional. The regular expression used for value replacement. A default regex is targeting a format such as '${VALUE_REFERENCE}'. DEFAULT="\\$\\{([a-zA-Z0-9\\.\\-_]*)\\}"
        "valueReplaceRegex":"..."
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

            //Optional. If the value is false, the task will be passed without process. DEFAULT=true
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
            //The value can be set and subsequently used by all following tasks. 
            "type":"set-value",

            //This represents the key for the value. All subsequent tasks will access the value using this key.
            "key":"key_of_value",

            //The value can be a type such as 'string', 'number', 'object' or 'file path'
            "value":{
                "a":"value-a",
                "b":"value-b"
            },

            //Optional. It can be used as either 'value' or 'file.' If the 'valueType' is 'file,' the 'value' must be a file path. DEFAULT="value"
            "valueType":"value",

            //Optional. This option applies when the 'valueIsFile' parameter is set to 'file', and can be set to either 'json' or 'string'. 
            //When set to 'json', the value in the file will be parsed as JSON. DEFAULT="string"
            "fileFormat":"string"
        },

        {
            //To output a text
            "type":"echo",
            "text":"Hello world!"
        },

        {
            //To output a text with the value of 'set-value' that was previously set.
            "type":"echo",
            "text":"I found a value ${key_of_value.a}!"
        }
    ]
}
   
```