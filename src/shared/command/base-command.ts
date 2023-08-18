/* eslint-disable @typescript-eslint/no-explicit-any */
// src/baseCommand.ts
import '@oclif/core/lib/interfaces/parser';
import { Command, Flags } from '@oclif/core';
import { Flags as flagType, Args as argType } from '../types';

enum LogLevel {
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
}

export abstract class BaseCommand<T extends typeof Command> extends Command {
  // add the --json flag
  static enableJsonFlag = true

  // define flags that can be inherited by any command that extends BaseCommand
  static baseFlags = {
    'log-level': Flags.custom<LogLevel>({
      summary: 'Specify level for logging.',
      options: Object.values(LogLevel),
      helpGroup: 'GLOBAL',
    })(),
  }

  protected flags!: flagType<T>
  protected args!: argType<T>

  public override async init(): Promise<void> {
    await super.init()
    const {args, flags} = await this.parse({
      flags: this.ctor.flags,
      baseFlags: ((super.ctor as typeof BaseCommand).baseFlags),
      args: this.ctor.args,
      strict: this.ctor.strict,
    } as any)
    this.flags = flags as flagType<T>
    this.args = args as argType<T>
  }

  protected async catch(err: Error & {exitCode?: number}): Promise<any> {
    // add any custom logic to handle errors from the command
    // or simply return the parent class error handling
    this.logToStderr(JSON.stringify(err));
    return super.catch(err)
  }

  protected async finally(_: Error | undefined): Promise<any> {
    // called after run and catch regardless of whether or not the command errored
    return super.finally(_)
  }
}