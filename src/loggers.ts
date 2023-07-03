import debug from "debug";
import { TAG_DEBUG, TAG_INFO } from "./task_data";

export const logv = debug(TAG_DEBUG);
export const logi = debug(TAG_INFO);