

## How to use

## Configuration

Create json file
```json
{
    "name":"Sample",
    "verbose":true,
    "verboseGit":true,
    "tasks":[
        {
            //This task sets up a Git repository. The main purpose is to prepare the Git repository to be usable, utilizing various Git commands such as clone, checkout, reset, fetch, and clean.
            "type":"git-repo-prepare",

            //Optional. The identifier of task.
            "id":"my_task_1",

            //Optional. false - Pass the current task without process. DEFAULT=true
            "enabled":true,

            //Optional. Current working directory. DEFAULT="."
            "cwd":"...",

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
            
            //Optional. The identifier of task
            "id":"my_task_2",

            //Optional. false - Pass the current task without process. DEFAULT=true
            "enabled":true,

            //Optional. Current working directory. DEFAULT="."
            "cwd":"...",

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
            "type":"cmd",

            //Optional. The identifier of task
            "id":"my_task_3",

            //Optional. false - Pass the current task without process. DEFAULT=true
            "enabled":true,

            //Optional. Current working directory. DEFAULT="."
            "cwd":"...",

            //Command line to execute
            "cmd":"..."
        },

        {
            "type":"set-value",

            //Optional. The identifier of task
            "id":"my_task_4",

            //Optional. false - Pass the current task without process. DEFAULT=true
            "enabled":true,

            //Optional. Current working directory. DEFAULT="."
            "cwd":"...",

            //This represents the key for the value. All subsequent tasks will access the value using this key.
            "key":"key_of_value",

            //The value can be a type such as 'string', 'number', 'object' or 'file path'
            "value":{
                "a":"value-a",
                "b":"value-b"
            },

            //Optional. It can be used as either 'value' or 'file.' If the 'valueType' is 'file,' the 'value' must be a file path. DEFAULT="value"
            "valueType":"value",

            //Optional. This option applies when the 'valueIsFile' parameter is set to 'file', and can be set to either 'json' or 'string'. When set to 'json', the value in the file will be parsed as JSON. DEFAULT="string"
            "fileFormat":"string"
        },

         {
            "type":"echo",

            //Optional. The identifier of task
            "id":"my_task_5",

            //Optional. false - Pass the current task without process. DEFAULT=true
            "enabled":true,

            //Optional. Current working directory. DEFAULT="."
            "cwd":"...",

            "text":"I found a value ${key_of_value.a}!"
         }
    ]
}
```