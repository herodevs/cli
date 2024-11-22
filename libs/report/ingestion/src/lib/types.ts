export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

export type Options = {
  all: boolean;
  consent: boolean;
};
