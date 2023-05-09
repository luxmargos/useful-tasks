

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
            "type":"git-checkout",
            
            //Leave it empty if using local repository
            "url":"https://.../xxx.git",
            
            //A path of git(local) repository
            "localPath":"...",

            //Specify a branch(local) that you want to use
            "branch":"master",
            
            //Use a specific commit hash, tag or another branch(e.g origin/master)
            "startPoint":"origin/master",
            
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
        }
    ]
}
```