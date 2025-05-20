#!/usr/bin/env node
import { z } from 'zod';
import { Command } from 'commander';

declare const CWD_MODES: readonly ["restore", "keep"];
type CwdModeTuple = typeof CWD_MODES;
type CwdMode = CwdModeTuple[number];
declare const logLevels: readonly ["none", "info", "debug"];
type LogLevelTuple = typeof logLevels;
type LogLevel = LogLevelTuple[number];
interface Options {
    cwd?: string;
    config: string;
    include?: string[];
    includeCta?: string[];
    exclude?: string[];
    excludeCta?: string[];
    camelKeys: boolean;
    cwdMode?: CwdMode;
    logLevel?: LogLevel;
    extraArgs?: string[];
}

declare const TasksConfigSchema: z.ZodObject<{
    /** The name of the tasks file */
    name: z.ZodOptional<z.ZodString>;
    env: z.ZodDefault<z.ZodObject<{
        /** The specific log level for the tasks */
        logLevel: z.ZodDefault<z.ZodEnum<["none", "info", "debug"]>>;
        /** The regex to replace text with variable values */
        varReplaceRegex: z.ZodEffects<z.ZodDefault<z.ZodString>, string, string | undefined>;
        /** The regex to replace text with environment variable values */
        envReplaceRegex: z.ZodEffects<z.ZodDefault<z.ZodString>, string, string | undefined>;
        cwdMode: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"restore">, z.ZodLiteral<"keep">]>>;
    }, "strip", z.ZodTypeAny, {
        logLevel: "none" | "info" | "debug";
        varReplaceRegex: string;
        envReplaceRegex: string;
        cwdMode: "restore" | "keep";
    }, {
        logLevel?: "none" | "info" | "debug" | undefined;
        varReplaceRegex?: string | undefined;
        envReplaceRegex?: string | undefined;
        cwdMode?: "restore" | "keep" | undefined;
    }>>;
    tasks: z.ZodDefault<z.ZodArray<z.ZodUnion<[z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        tags: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>, string[], string | string[] | undefined>;
        cwd: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        when: z.ZodOptional<z.ZodObject<{
            platform: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            architecture: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            machine: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
        }, "strip", z.ZodTypeAny, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }>>;
        comment: z.ZodOptional<z.ZodString>;
        onError: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodLiteral<"throw">, z.ZodLiteral<"warn">]>>;
    } & {
        type: z.ZodLiteral<"git-setup">;
        localPath: z.ZodString;
        binary: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        branch: z.ZodOptional<z.ZodString>;
        startPoint: z.ZodOptional<z.ZodString>;
        updateSubmodules: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString, z.ZodBoolean]>>;
    }, "strip", z.ZodTypeAny, {
        type: "git-setup";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        localPath: string;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        binary?: string | undefined;
        url?: string | undefined;
        branch?: string | undefined;
        startPoint?: string | undefined;
        updateSubmodules?: string | boolean | undefined;
    }, {
        type: "git-setup";
        localPath: string;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        binary?: string | undefined;
        url?: string | undefined;
        branch?: string | undefined;
        startPoint?: string | undefined;
        updateSubmodules?: string | boolean | undefined;
    }>, z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        tags: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>, string[], string | string[] | undefined>;
        cwd: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        when: z.ZodOptional<z.ZodObject<{
            platform: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            architecture: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            machine: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
        }, "strip", z.ZodTypeAny, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }>>;
        comment: z.ZodOptional<z.ZodString>;
        onError: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodLiteral<"throw">, z.ZodLiteral<"warn">]>>;
    } & {
        type: z.ZodLiteral<"cmd">;
        cmd: z.ZodString;
        shell: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "cmd";
        cmd: string;
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        shell?: string | undefined;
    }, {
        type: "cmd";
        cmd: string;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        shell?: string | undefined;
    }>, z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        tags: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>, string[], string | string[] | undefined>;
        cwd: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        when: z.ZodOptional<z.ZodObject<{
            platform: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            architecture: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            machine: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
        }, "strip", z.ZodTypeAny, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }>>;
        comment: z.ZodOptional<z.ZodString>;
        onError: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodLiteral<"throw">, z.ZodLiteral<"warn">]>>;
    } & {
        type: z.ZodLiteral<"set-var">;
        key: z.ZodString;
        value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodAny]>;
        src: z.ZodOptional<z.ZodString>;
        parser: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"json">, z.ZodLiteral<"lines">, z.ZodLiteral<"string">, z.ZodLiteral<"auto">]>>;
        isFallback: z.ZodOptional<z.ZodBoolean>;
        include: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        exclude: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        type: "set-var";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        key: string;
        value?: any;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
        src?: string | undefined;
        parser?: "string" | "json" | "lines" | "auto" | undefined;
        isFallback?: boolean | undefined;
    }, {
        type: "set-var";
        key: string;
        value?: any;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
        src?: string | undefined;
        parser?: "string" | "json" | "lines" | "auto" | undefined;
        isFallback?: boolean | undefined;
    }>, z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        tags: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>, string[], string | string[] | undefined>;
        cwd: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        when: z.ZodOptional<z.ZodObject<{
            platform: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            architecture: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            machine: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
        }, "strip", z.ZodTypeAny, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }>>;
        comment: z.ZodOptional<z.ZodString>;
        onError: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodLiteral<"throw">, z.ZodLiteral<"warn">]>>;
    } & {
        type: z.ZodLiteral<"env-var">;
        map: z.ZodOptional<z.ZodMap<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        src: z.ZodOptional<z.ZodString>;
        parser: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"json">, z.ZodLiteral<"lines">, z.ZodLiteral<"auto">]>>;
        isFallback: z.ZodOptional<z.ZodBoolean>;
        include: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        exclude: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        type: "env-var";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        parser: "json" | "lines" | "auto";
        map?: Map<string, string | number | boolean> | undefined;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
        src?: string | undefined;
        isFallback?: boolean | undefined;
    }, {
        type: "env-var";
        map?: Map<string, string | number | boolean> | undefined;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
        src?: string | undefined;
        parser?: "json" | "lines" | "auto" | undefined;
        isFallback?: boolean | undefined;
    }>, z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        tags: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>, string[], string | string[] | undefined>;
        cwd: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        when: z.ZodOptional<z.ZodObject<{
            platform: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            architecture: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            machine: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
        }, "strip", z.ZodTypeAny, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }>>;
        comment: z.ZodOptional<z.ZodString>;
        onError: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodLiteral<"throw">, z.ZodLiteral<"warn">]>>;
    } & {
        type: z.ZodLiteral<"output">;
        target: z.ZodUnion<[z.ZodLiteral<"console">, z.ZodLiteral<"file-write">, z.ZodLiteral<"file-append">, z.ZodLiteral<"c">, z.ZodLiteral<"fw">, z.ZodLiteral<"fa">]>;
        text: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "output";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        target: "console" | "file-write" | "file-append" | "c" | "fw" | "fa";
        text: string;
        path?: string | undefined;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
    }, {
        type: "output";
        target: "console" | "file-write" | "file-append" | "c" | "fw" | "fa";
        text: string;
        path?: string | undefined;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
    }>, z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        tags: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>, string[], string | string[] | undefined>;
        cwd: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        when: z.ZodOptional<z.ZodObject<{
            platform: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            architecture: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            machine: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
        }, "strip", z.ZodTypeAny, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }>>;
        comment: z.ZodOptional<z.ZodString>;
        onError: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodLiteral<"throw">, z.ZodLiteral<"warn">]>>;
    } & {
        type: z.ZodLiteral<"fs-copy">;
        src: z.ZodString;
        dest: z.ZodString;
        options: z.ZodDefault<z.ZodObject<{
            conflict: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"overwrite">, z.ZodLiteral<"skip">]>>;
        }, "strip", z.ZodTypeAny, {
            conflict: "skip" | "overwrite";
        }, {
            conflict?: "skip" | "overwrite" | undefined;
        }>>;
        include: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        exclude: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        options: {
            conflict: "skip" | "overwrite";
        };
        type: "fs-copy";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        src: string;
        dest: string;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
    }, {
        type: "fs-copy";
        src: string;
        dest: string;
        options?: {
            conflict?: "skip" | "overwrite" | undefined;
        } | undefined;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
    }>, z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        tags: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>, string[], string | string[] | undefined>;
        cwd: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        when: z.ZodOptional<z.ZodObject<{
            platform: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            architecture: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            machine: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
        }, "strip", z.ZodTypeAny, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }>>;
        comment: z.ZodOptional<z.ZodString>;
        onError: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodLiteral<"throw">, z.ZodLiteral<"warn">]>>;
    } & {
        type: z.ZodLiteral<"fs-del">;
        path: z.ZodString;
        include: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        exclude: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "fs-del";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
    }, {
        path: string;
        type: "fs-del";
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
    }>, z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        tags: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>, string[], string | string[] | undefined>;
        cwd: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        when: z.ZodOptional<z.ZodObject<{
            platform: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            architecture: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            machine: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
        }, "strip", z.ZodTypeAny, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }>>;
        comment: z.ZodOptional<z.ZodString>;
        onError: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodLiteral<"throw">, z.ZodLiteral<"warn">]>>;
    } & {
        type: z.ZodLiteral<"fs-mkdir">;
        path: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "fs-mkdir";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
    }, {
        path: string;
        type: "fs-mkdir";
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
    }>, z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        tags: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>, string[], string | string[] | undefined>;
        cwd: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        when: z.ZodOptional<z.ZodObject<{
            platform: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            architecture: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            machine: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
        }, "strip", z.ZodTypeAny, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }>>;
        comment: z.ZodOptional<z.ZodString>;
        onError: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodLiteral<"throw">, z.ZodLiteral<"warn">]>>;
    } & {
        type: z.ZodLiteral<"symlink">;
        target: z.ZodString;
        path: z.ZodString;
        linkType: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"dir">, z.ZodLiteral<"file">, z.ZodLiteral<"junction">]>>;
        forced: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "symlink";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        target: string;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        linkType?: "dir" | "file" | "junction" | undefined;
        forced?: boolean | undefined;
    }, {
        path: string;
        type: "symlink";
        target: string;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        linkType?: "dir" | "file" | "junction" | undefined;
        forced?: boolean | undefined;
    }>, z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        tags: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>, string[], string | string[] | undefined>;
        cwd: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        when: z.ZodOptional<z.ZodObject<{
            platform: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            architecture: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            machine: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
        }, "strip", z.ZodTypeAny, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }>>;
        comment: z.ZodOptional<z.ZodString>;
        onError: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodLiteral<"throw">, z.ZodLiteral<"warn">]>>;
    } & {
        type: z.ZodLiteral<"sub-tasks">;
        args: z.ZodOptional<z.ZodString>;
        inherits: z.ZodOptional<z.ZodObject<{
            args: z.ZodDefault<z.ZodBoolean>;
            vars: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            args: boolean;
            vars: boolean;
        }, {
            args?: boolean | undefined;
            vars?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "sub-tasks";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        args?: string | undefined;
        inherits?: {
            args: boolean;
            vars: boolean;
        } | undefined;
    }, {
        type: "sub-tasks";
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        args?: string | undefined;
        inherits?: {
            args?: boolean | undefined;
            vars?: boolean | undefined;
        } | undefined;
    }>, z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        tags: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>, string[], string | string[] | undefined>;
        cwd: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        when: z.ZodOptional<z.ZodObject<{
            platform: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            architecture: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
            machine: z.ZodOptional<z.ZodType<string, z.ZodTypeDef, string>>;
        }, "strip", z.ZodTypeAny, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }, {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        }>>;
        comment: z.ZodOptional<z.ZodString>;
        onError: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodLiteral<"throw">, z.ZodLiteral<"warn">]>>;
    } & {
        type: z.ZodLiteral<"content-replace">;
        path: z.ZodString;
        find: z.ZodUnion<[z.ZodString, z.ZodObject<{
            pattern: z.ZodString;
            flags: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            pattern: string;
            flags?: string | undefined;
        }, {
            pattern: string;
            flags?: string | undefined;
        }>]>;
        replace: z.ZodString;
        loop: z.ZodOptional<z.ZodNumber>;
        include: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        exclude: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        find: string | {
            pattern: string;
            flags?: string | undefined;
        };
        type: "content-replace";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        replace: string;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
        loop?: number | undefined;
    }, {
        path: string;
        find: string | {
            pattern: string;
            flags?: string | undefined;
        };
        type: "content-replace";
        replace: string;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
        loop?: number | undefined;
    }>]>, "many">>;
}, "strip", z.ZodTypeAny, {
    env: {
        logLevel: "none" | "info" | "debug";
        varReplaceRegex: string;
        envReplaceRegex: string;
        cwdMode: "restore" | "keep";
    };
    tasks: ({
        type: "git-setup";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        localPath: string;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        binary?: string | undefined;
        url?: string | undefined;
        branch?: string | undefined;
        startPoint?: string | undefined;
        updateSubmodules?: string | boolean | undefined;
    } | {
        type: "cmd";
        cmd: string;
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        shell?: string | undefined;
    } | {
        type: "set-var";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        key: string;
        value?: any;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
        src?: string | undefined;
        parser?: "string" | "json" | "lines" | "auto" | undefined;
        isFallback?: boolean | undefined;
    } | {
        type: "env-var";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        parser: "json" | "lines" | "auto";
        map?: Map<string, string | number | boolean> | undefined;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
        src?: string | undefined;
        isFallback?: boolean | undefined;
    } | {
        type: "output";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        target: "console" | "file-write" | "file-append" | "c" | "fw" | "fa";
        text: string;
        path?: string | undefined;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
    } | {
        options: {
            conflict: "skip" | "overwrite";
        };
        type: "fs-copy";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        src: string;
        dest: string;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
    } | {
        path: string;
        type: "fs-del";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
    } | {
        path: string;
        type: "fs-mkdir";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
    } | {
        path: string;
        type: "symlink";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        target: string;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        linkType?: "dir" | "file" | "junction" | undefined;
        forced?: boolean | undefined;
    } | {
        type: "sub-tasks";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        args?: string | undefined;
        inherits?: {
            args: boolean;
            vars: boolean;
        } | undefined;
    } | {
        path: string;
        find: string | {
            pattern: string;
            flags?: string | undefined;
        };
        type: "content-replace";
        tags: string[];
        enabled: boolean;
        onError: "skip" | "throw" | "warn";
        replace: string;
        id?: string | undefined;
        cwd?: string | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
        loop?: number | undefined;
    })[];
    name?: string | undefined;
}, {
    name?: string | undefined;
    env?: {
        logLevel?: "none" | "info" | "debug" | undefined;
        varReplaceRegex?: string | undefined;
        envReplaceRegex?: string | undefined;
        cwdMode?: "restore" | "keep" | undefined;
    } | undefined;
    tasks?: ({
        type: "git-setup";
        localPath: string;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        binary?: string | undefined;
        url?: string | undefined;
        branch?: string | undefined;
        startPoint?: string | undefined;
        updateSubmodules?: string | boolean | undefined;
    } | {
        type: "cmd";
        cmd: string;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        shell?: string | undefined;
    } | {
        type: "set-var";
        key: string;
        value?: any;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
        src?: string | undefined;
        parser?: "string" | "json" | "lines" | "auto" | undefined;
        isFallback?: boolean | undefined;
    } | {
        type: "env-var";
        map?: Map<string, string | number | boolean> | undefined;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
        src?: string | undefined;
        parser?: "json" | "lines" | "auto" | undefined;
        isFallback?: boolean | undefined;
    } | {
        type: "output";
        target: "console" | "file-write" | "file-append" | "c" | "fw" | "fa";
        text: string;
        path?: string | undefined;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
    } | {
        type: "fs-copy";
        src: string;
        dest: string;
        options?: {
            conflict?: "skip" | "overwrite" | undefined;
        } | undefined;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
    } | {
        path: string;
        type: "fs-del";
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
    } | {
        path: string;
        type: "fs-mkdir";
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
    } | {
        path: string;
        type: "symlink";
        target: string;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        linkType?: "dir" | "file" | "junction" | undefined;
        forced?: boolean | undefined;
    } | {
        type: "sub-tasks";
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        args?: string | undefined;
        inherits?: {
            args?: boolean | undefined;
            vars?: boolean | undefined;
        } | undefined;
    } | {
        path: string;
        find: string | {
            pattern: string;
            flags?: string | undefined;
        };
        type: "content-replace";
        replace: string;
        id?: string | undefined;
        tags?: string | string[] | undefined;
        cwd?: string | undefined;
        enabled?: boolean | undefined;
        when?: {
            platform?: string | undefined;
            architecture?: string | undefined;
            machine?: string | undefined;
        } | undefined;
        comment?: string | undefined;
        onError?: "skip" | "throw" | "warn" | undefined;
        include?: string | string[] | undefined;
        exclude?: string | string[] | undefined;
        loop?: number | undefined;
    })[] | undefined;
}>;
type TasksConfigInput = z.input<typeof TasksConfigSchema>;

declare const usefulTasks: (originCwd: string, opts: Options, tasksConfigInput: TasksConfigInput, program: Command) => Promise<void>;
declare const initUsefulTasks: (originCwd: string, opts: Options, program: Command) => Promise<void>;

export { initUsefulTasks, usefulTasks };
