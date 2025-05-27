import { prepare } from '@/build_cli_parser';

describe('Misc Tests', () => {
  it('Misc Test', () => {
    // const prepared = prepare(['-c']);
    const prepared = prepare(['--help']);
    console.log(prepared.opt);
  });
});
