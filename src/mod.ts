import { resolve } from "std/path/mod.ts";
import { copySync } from "std/fs/copy.ts";
import schemaJson from "../examples/petstore-openrpc.json" with {
  type: "json",
};
import { Schema } from "./Schema.ts";
import { UnrealOpenRPCVisitor } from "./renderers/cpp-ue5/UnrealOpenRPCVisitor.ts";

const dirname = import.meta.dirname || ".";
const renderPath = resolve(dirname, "..", "generated", "cpp-ue5");
const templatePath = resolve(dirname, "renderers", "cpp-ue5", "template");
const staticPath = resolve(
  dirname,
  "renderers",
  "cpp-ue5",
  "static",
  "Resources",
);
await Deno.remove(renderPath, { recursive: true });
const schema = new Schema(schemaJson, { renderPath });
await schema.initialize();
schema.accept(new UnrealOpenRPCVisitor({ templatePath }));
copySync(staticPath, resolve(renderPath, "Resources"));
