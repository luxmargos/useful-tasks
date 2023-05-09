

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

            //Optional. Current working directory.
            "cwd":"...",

            //Optional. Set a value if you want to use a different binary of git.
            "bin":"git",
            
            //A path of git(local) repository
            "localPath":"...",
            
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
            //Optional. Current working directory.
            "cwd":"...",

            //Command line to execute
            "cmd":"..."
        }
    ]
}
```