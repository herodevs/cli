export type JSONValue =
  | boolean
  | JSONValue[]
  | null
  | number
  | string
  | { [key: string]: JSONValue };

export type Options = {
  consent: boolean;
};
