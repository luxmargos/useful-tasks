import { z } from 'zod';

const TasksConfigSchema = z.object({
  /** The name of the tasks file */
  name: z.string().optional(),
  env: z
    .object({
      /** The specific log level for the tasks */
      logLevel: z.enum(['info', 'debug']).default('info'),

      /** The regex to replace text with variable values */
      varReplaceRegex: z.string().nonempty().default('ABC').describe('The regex to replace text with variable values'),

      /** The regex to replace text with environment variable values */
      envReplaceRegex: z
        .string()
        .nonempty()
        .default('CDE')
        .describe('The regex to replace text with environment variable values'),
    })
    .default({ logLevel: 'info', varReplaceRegex: 'AABC', envReplaceRegex: 'CCDE' }),
});

describe('ZodTests', () => {
  it('Zod Test', () => {
    const zStrSchema = z.string().nonempty().optional().default('Z');
    const zObjSchema = z
      .object({
        v: zStrSchema,
      })
      .default({ v: 'xx' });
    type ZStr = z.infer<typeof zStrSchema>;
    type ZObj = z.infer<typeof zObjSchema>;
    console.log(zObjSchema.parse({}));
  });

  it('Zod Test2', () => {
    type TaskConfig = z.infer<typeof TasksConfigSchema>;
    type TaskConfigInput = z.input<typeof TasksConfigSchema>;

    console.log('TaskConfig');
    console.log(
      TasksConfigSchema.parse({
        env: {
          logLevel: 'debug',
        },
      } satisfies TaskConfigInput)
    );
  });
});
