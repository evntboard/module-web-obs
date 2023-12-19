import kebabCase from 'lodash/kebabCase'

import {MODULE_CODE} from "./constants.ts";

export const toEventName = (name: string) => {
  return `${MODULE_CODE}-${kebabCase(name)}`
}