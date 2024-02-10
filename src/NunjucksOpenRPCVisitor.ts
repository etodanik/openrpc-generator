// @deno-types="npm:@types/nunjucks@3.2.6"
import nunjucks, { Environment } from "nunjucks";
import * as changeCase from "change-case";
import { OpenRPCVisitor } from "./OpenRPCVisitor.ts";

export interface NunjucksOpenRPCVisitorOptions {
  templatePath: string;
}

export class NunjucksOpenRPCVisitor extends OpenRPCVisitor {
  #templatePath: string;
  protected nunjucksEnv: Environment;

  constructor(options: NunjucksOpenRPCVisitorOptions) {
    super();
    this.#templatePath = options.templatePath;
    this.nunjucksEnv = nunjucks.configure(this.#templatePath);
    this.nunjucksEnv.addFilter(
      "pascalCase",
      (name) => changeCase.pascalCase(name),
    );
    this.nunjucksEnv.addFilter(
      "capitalCase",
      (name) => changeCase.capitalCase(name),
    );
    this.nunjucksEnv.addFilter(
      "constantCase",
      (name) => changeCase.constantCase(name),
    );
    this.nunjucksEnv.addFilter(
      "kebabCase",
      (name) => changeCase.kebabCase(name),
    );
    this.nunjucksEnv.addFilter(
      "snakeCase",
      (name) => changeCase.snakeCase(name),
    );
    this.nunjucksEnv.addFilter(
      "camelCase",
      (name) => changeCase.camelCase(name),
    );
  }

  protected render(template: string, context: object) {
    return nunjucks.render(template, context);
  }
}
