import * as changeCase from "change-case";
import { NunjucksOpenRPCVisitor, NunjucksOpenRPCVisitorOptions } from "../../NunjucksOpenRPCVisitor.ts";
import { RenderMap } from "../../RenderMap.ts";
import { ContentDescriptorObject, CustomTypeMap, IncludeMap, InfoObject, JSONSchemaObject, MethodObject } from "../../types.ts";

interface UnrealOpenRPCVisitorOptions extends NunjucksOpenRPCVisitorOptions {}

export class UnrealOpenRPCVisitor extends NunjucksOpenRPCVisitor {
  #includeMap: IncludeMap = new Map();
  #apiTag?: string;
  #pluginName?: string;
  #pluginTitle?: string;
  #pluginVersion?: string;

  constructor(options: UnrealOpenRPCVisitorOptions) {
    super(options);
    this.nunjucksEnv.addFilter(
      "unrealParameterClassAttributeType",
      (method: MethodObject, param: ContentDescriptorObject) => this.#getUnrealClassAttributeTypeForParam(method, param),
    );
    this.nunjucksEnv.addFilter(
      "unrealParameterMethodArgumentType",
      (method: MethodObject, param: ContentDescriptorObject) => this.#getUnrealMethodArgumentTypeForParam(method, param),
    );
    this.nunjucksEnv.addFilter(
      "unrealPropertyClassAttributeType",
      (propertyParents: string[], propertyName: string, propertySchema: JSONSchemaObject) =>
        this.#getUnrealClassAttributeTypeForProperty(propertyParents, propertyName, propertySchema),
    );
    this.nunjucksEnv.addFilter(
      "unrealPropertyMethodArgumentType",
      (propertyParents: string[], propertyName: string, propertySchema: JSONSchemaObject) =>
        this.#getUnrealMethodArgumentTypeForProperty(propertyParents, propertyName, propertySchema),
    );
    this.nunjucksEnv.addFilter(
      "getPrefixedPropertyName",
      (propertyParents: string[], propertyName: string) => this.#getPrefixedPropertyName(propertyParents, propertyName),
    );
  }

  visitInfo(info: InfoObject) {
    this.#apiTag = `${changeCase.constantCase(info.title)}RPC_API`;
    this.#pluginName = `${changeCase.pascalCase(info.title)}Rpc`;
    this.#pluginTitle = `${changeCase.sentenceCase(info.title)}`;
    this.#pluginVersion = info.version;

    const infoRenderMap = new RenderMap();

    infoRenderMap.add(`${this.#pluginName}.uplugin`, this.render("plugin.njk", { ...this.getCommonContext() }));

    infoRenderMap.add(`Source/${this.#pluginName}/${this.#pluginName}.Build.cs`, this.render("build.njk", { ...this.getCommonContext() }));

    infoRenderMap.add(
      `Source/${this.#pluginName}/Private/${this.#pluginName}.cpp`,
      this.render("moduleCpp.njk", { ...this.getCommonContext() }),
    );

    infoRenderMap.add(
      `Source/${this.#pluginName}/Public/${this.#pluginName}.h`,
      this.render("moduleH.njk", { ...this.getCommonContext() }),
    );

    return infoRenderMap;
  }

  visitMethods(methods: MethodObject[]) {
    const includeMap: IncludeMap = new Map();
    const methodsRenderMap = new RenderMap();

    for (const method of methods) {
      includeMap.set(`${changeCase.pascalCase(method.name)}RequestArgs.h`, "local");
      includeMap.set(`${changeCase.pascalCase(method.name)}ResponseData.h`, "local");
    }

    methodsRenderMap.add(
      `Source/${this.#pluginName}/Public/${this.#pluginName}Client.h`,
      this.render("clientH.njk", {
        ...this.getCommonContext(),
        includeMap,
        methods,
      }),
    );
    methodsRenderMap.add(
      `Source/${this.#pluginName}/Private/${this.#pluginName}Client.cpp`,
      this.render("clientCpp.njk", {
        ...this.getCommonContext(),
        methods,
        includeMap,
      }),
    );
    return methodsRenderMap;
  }

  visitMethod(method: MethodObject) {
    const methodRenderMap = new RenderMap();
    const path = `Source/${this.#pluginName}/Public`;
    const context = { ...this.getCommonContext(), includeMap: this.#includeMap, method };
    methodRenderMap.add(`${path}/${changeCase.pascalCase(method.name)}RequestArgs.h`, this.render("requestArgsH.njk", context));
    methodRenderMap.add(`${path}/${changeCase.pascalCase(method.name)}ResponseData.h`, this.render("responseDataH.njk", context));
    this.#includeMap.clear();
    return methodRenderMap;
  }

  visitMethodParam(method: MethodObject, param: ContentDescriptorObject) {
    this.#includeMap = new Map([
      ...this.#includeMap,
      ...this.resolveImportFromParamType(
        method,
        param,
      ),
    ]);

    return this.#createTypeForParamIfNeeded(method, param);
  }

  getCommonContext() {
    return {
      apiTag: this.#apiTag,
      pluginName: this.#pluginName,
      pluginTitle: this.#pluginTitle,
      pluginVersion: this.#pluginVersion,
    };
  }

  #getPrefixedPropertyName(path: string[], propertyName: string) {
    return [...path, propertyName].map((element) => changeCase.pascalCase(element)).join("");
  }

  #createTypeForPropertyertyIfNeeded(
    propertyParents: string[],
    propertyName: string,
    propertySchema: JSONSchemaObject,
  ) {
    if (typeof propertySchema === "boolean") {
      throw new Error(
        `Unsupported boolean schema type in ${this.#getPrefixedPropertyName(propertyParents, propertyName)}`,
      );
    }

    if (typeof propertySchema.type !== "string") {
      throw new Error(
        `Unsupported non-string schema type in ${this.#getPrefixedPropertyName(propertyParents, propertyName)}`,
      );
    }

    const path = `Source/${this.#pluginName}/Public`;

    switch (propertySchema.type) {
      case "object": {
        const customTypeRenderMap = new RenderMap();
        const customTypeIncludeMap: IncludeMap = new Map();

        if (propertySchema.properties) {
          for (const [childPropertyName, childPropertySchema] of Object.entries(propertySchema.properties)) {
            const childRenderMap = this.#createTypeForPropertyertyIfNeeded(
              [...propertyParents, propertyName],
              childPropertyName,
              childPropertySchema,
            );
            customTypeRenderMap.mergeWith(childRenderMap);
            if (childRenderMap) {
              customTypeIncludeMap.set(
                `${this.#getObjectPropertyFilename([...propertyParents, propertyName], childPropertyName)}`,
                "local",
              );
            }
          }
        }

        const context = {
          ...this.getCommonContext(),
          includeMap: customTypeIncludeMap,
          propertyParents,
          propertyName,
          propertySchema,
          prefixedPropertyName: this.#getPrefixedPropertyName(propertyParents, propertyName),
        };

        customTypeRenderMap.add(
          `${path}/${this.#getObjectPropertyFilename(propertyParents, propertyName)}`,
          this.render("customTypeH.njk", context),
        );

        return customTypeRenderMap;
      }
      default:
        break;
    }
  }

  #createTypeForParamIfNeeded(
    method: MethodObject,
    param: ContentDescriptorObject,
  ) {
    return this.#createTypeForPropertyertyIfNeeded([method.name], param.name, param.schema);
  }

  #getUnrealMethodArgumentTypeForParam(
    method: MethodObject,
    param: ContentDescriptorObject,
  ): string {
    if (typeof param.schema === "boolean") {
      throw new Error(
        `Unsupported boolean schema type in param ${param.name}`,
      );
    }

    if (typeof param.schema.type !== "string") {
      throw new Error(
        `Unsupported non-string schema type in param ${param.name}`,
      );
    }

    switch (param.schema.type) {
      case "string":
        return "const FString&";
      case "number":
      case "integer":
        return "const int";
      case "boolean":
        return "const bool";
      case "object":
        return `${this.#getObjectPropertyType([method.name], param.name)}&`;
        return "const TMap&";
      case "array":
        throw new Error("array not implemented");
        return "const TArray&";
      case "null":
        throw new Error("null not implemented");
        break;
      default:
        throw new Error(
          `Unsupported type: ${param.type} in param ${param.name}`,
        );
    }
  }

  #getUnrealClassAttributeTypeForParam(
    method: MethodObject,
    param: ContentDescriptorObject,
  ): string {
    if (typeof param.schema === "boolean") {
      throw new Error(
        `Unsupported boolean schema type in param ${param.name}`,
      );
    }

    if (typeof param.schema.type !== "string") {
      throw new Error(
        `Unsupported non-string schema type in param ${param.name}`,
      );
    }

    switch (param.schema.type) {
      case "string":
        return "FString";
      case "number":
      case "integer":
        return "int";
      case "boolean":
        return "bool";
      case "object":
        return this.#getObjectPropertyType([method.name], param.name);
      case "array":
        throw new Error("array not implemented");
        return "TArray";
      case "null":
        throw new Error("null not implemented");
        break;
      default:
        throw new Error(
          `Unsupported type: ${param.type} in param ${param.name}`,
        );
    }
  }

  #getUnrealMethodArgumentTypeForProperty(
    propertyParents: string[],
    propertyName: string,
    propertySchema: JSONSchemaObject,
  ): string {
    const prefixedPropertyName = this.#getPrefixedPropertyName(propertyParents, propertyName);

    if (typeof propertySchema === "boolean") {
      throw new Error(
        `Unsupported boolean schema type in param ${prefixedPropertyName}`,
      );
    }

    if (typeof propertySchema.type !== "string") {
      throw new Error(
        `Unsupported non-string schema type in param ${prefixedPropertyName}`,
      );
    }

    if (propertySchema.enum) {
      return "const FString&";
    }

    switch (propertySchema.type) {
      case "string":
        return "const FString&";
      case "number":
      case "integer":
        return "const int";
      case "boolean":
        return "const bool";
      case "object":
        return `const ${this.#getObjectPropertyType(propertyParents, propertyName)}`;
      case "array":
      case "null":
      default:
        throw new Error(
          `type ${propertySchema.type} not implemented for ${prefixedPropertyName}`,
        );
    }
  }

  #getUnrealClassAttributeTypeForProperty(
    propertyParents: string[],
    propertyName: string,
    propertySchema: JSONSchemaObject,
  ): string {
    const prefixedPropertyName = this.#getPrefixedPropertyName(propertyParents, propertyName);
    if (typeof propertySchema === "boolean") {
      throw new Error(
        `Unsupported boolean schema type in param ${prefixedPropertyName}`,
      );
    }

    if (typeof propertySchema.type !== "string") {
      throw new Error(
        `Unsupported non-string schema type in param ${prefixedPropertyName}`,
      );
    }

    if (propertySchema.enum) {
      return "FString";
    }

    switch (propertySchema.type) {
      case "string":
        return "FString";
      case "number":
      case "integer":
        return "int";
      case "boolean":
        return "bool";
      case "object":
        return this.#getObjectPropertyType(propertyParents, propertyName);
      case "array":
      case "null":
      default:
        throw new Error(
          `type ${propertySchema.type} not implemented for ${prefixedPropertyName}`,
        );
    }
  }

  resolveImportFromParamType(
    method: MethodObject,
    param: ContentDescriptorObject,
  ): IncludeMap {
    if (typeof param.schema === "boolean") {
      throw new Error(
        `Unsupported boolean schema type in method ${method.name} param ${param.name}`,
      );
    }

    if (typeof param.schema.type !== "string") {
      throw new Error(
        `Unsupported non-string schema type in method ${method.name} param ${param.name}`,
      );
    }

    const includeMap: IncludeMap = new Map();

    switch (param.schema.type) {
      case "string":
        includeMap.set("Containers/UnrealString.h", "local");
        break;
      case "number":
      case "integer":
      case "boolean":
        includeMap.set("CoreMinimal.h", "local");
        break;
      case "object":
        includeMap.set(
          `${this.#getObjectPropertyFilename([method.name], param.name)}`,
          "local",
        );
        break;
      case "array":
        includeMap.set("Containers/Array.h", "local");
        break;
      case "null":
        break;
      default:
        throw new Error(
          `Unsupported type: ${param.type} in method ${method.name} param ${param.name}`,
        );
    }

    return includeMap;
  }

  #getObjectPropertyType(propertyParents: string[], propertyName: string) {
    return `F${this.#getPrefixedPropertyName(propertyParents, propertyName)}`;
  }

  #getObjectPropertyFilename(propertyParents: string[], propertyName: string) {
    return `${this.#getPrefixedPropertyName(propertyParents, propertyName)}.h`;
  }
}
