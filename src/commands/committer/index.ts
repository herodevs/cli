import { Args, Command, Flags } from "@oclif/core";
import { CommitterGetAll } from "./get-all";
import { BaseCommand } from "../../shared";

export default class Committer extends BaseCommand<typeof CommitterGetAll> {
  static description = "Gets committer info";

  static examples = [`$ @herodevs/cli committer`];

  static flags = {};

  static args = {
    'get-all': CommitterGetAll.args
  } as any;

  async run(): Promise<void> {

  }
}
