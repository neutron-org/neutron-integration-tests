import * as jestDommatchers from '@testing-library/jest-dom/matchers';
import * as jestMatchers from 'jest-extended';
import { expect } from 'vitest';

expect.extend(jestDommatchers);
expect.extend(jestMatchers);
