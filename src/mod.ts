import { resolve } from "std/path/mod.ts";
import { copySync } from "std/fs/copy.ts";
import schemaJson from "../examples/helius-openrpc.json" with {
  type: "json",
};
import { Schema } from "./Schema.ts";
import { UnrealOpenRPCVisitor } from "./renderers/cpp-ue5/UnrealOpenRPCVisitor.ts";

const dirname = import.meta.dirname || ".";
const renderPath = resolve(dirname, "..", "generated", "HeliusRpc");
const templatePath = resolve(dirname, "renderers", "cpp-ue5", "template");
const staticPath = resolve(dirname, "renderers", "cpp-ue5", "static", "Resources");

try {
  await Deno.remove(renderPath, { recursive: true });
} catch (error) {
  if (!(error instanceof Deno.errors.NotFound)) {
    throw error;
  }
}

try {
  const schema = new Schema(schemaJson, { renderPath });
  await schema.initialize();
  schema.accept(new UnrealOpenRPCVisitor({ templatePath }));
  copySync(staticPath, resolve(renderPath, "Resources"));
} catch (error) {
  if (error.stack) {
    console.error(error.stack);
  } else {
    console.error(error.message);
  }
}
