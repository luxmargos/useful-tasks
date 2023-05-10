

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

            //Optional. The identifier of task
            "id":"my_task_1",

            //Optional. false - Pass the current task without process.
            "enabled":true,

            //Optional. Current working directory.
            "cwd":"...",

            //A path of git(local) repository
            "localPath":"...",

            //Optional. Set a value if you want to use a different binary of git.
            "bin":"git",
            
            //Optional. Leave it empty if using local repository
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

            //Optional. false - Pass the current task without process.
            "enabled":true,

            //Optional. Current working directory.
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

            //Optional. false - Pass the current task without process.
            "enabled":true,

            //Optional. Current working directory.
            "cwd":"...",

            //Command line to execute
            "cmd":"..."
        }
    ]
}
```