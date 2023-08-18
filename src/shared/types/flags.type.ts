import { Command, Interfaces } from "@oclif/core";
import { BaseCommand } from "../command"


export type Flags<T extends typeof Command> = Interfaces.InferredFlags<typeof BaseCommand['baseFlags'] & T['flags']>
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>