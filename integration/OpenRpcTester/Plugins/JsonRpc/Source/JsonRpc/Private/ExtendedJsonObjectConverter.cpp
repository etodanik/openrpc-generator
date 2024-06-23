#include "ExtendedJsonObjectConverter.h"
#include "UObject/PropertyOptional.h"

TSharedPtr<FJsonValue> FExtendedJsonObjectConverter::UPropertyToJsonValue(
	FProperty* Property, const void* Value, int64 CheckFlags, int64 SkipFlags, const CustomExportCallback* ExportCb,
	FProperty* OuterProperty, EJsonObjectConversionFlags ConversionFlags)
{
	FProperty* ActualProperty = Property;
	const void* ActualValue = Value;

	if (const FOptionalProperty* OptionalProperty = CastField<const FOptionalProperty>(Property))
	{
		if (!OptionalProperty->IsSet(Value))
		{
			return TSharedPtr<FJsonValue>();
		}

		ActualValue = OptionalProperty->GetValuePointerForReadIfSet(Value);
		ActualProperty = OptionalProperty->GetValueProperty();
	}

	return FJsonObjectConverter::UPropertyToJsonValue(ActualProperty, ActualValue, CheckFlags, SkipFlags, ExportCb,
	                                                  OuterProperty, ConversionFlags);
}


// bool FExtendedJsonObjectConverter::JsonValueToUProperty(TSharedPtr<FJsonValue> JsonValue, FProperty* Property,
//                                                         void* OutValue, int64 CheckFlags, int64 SkipFlags)
// {
// 	if (const FOptionalProperty* OptionalProperty = CastField<const FOptionalProperty>(Property))
// 	{
// 		void* OptionalValue = OptionalProperty->ContainerPtrToValuePtr<void>(OutValue);
//
// 		if (JsonValue->IsNull())
// 		{
// 			OptionalProperty->ClearValue(OptionalValue);
// 			return true;
// 		}
//
// 		OptionalProperty->InitializeValue(OptionalValue);
// 		return FJsonObjectConverter::JsonValueToUProperty(JsonValue, OptionalProperty->GetValueProperty(),
// 		                                                  OptionalValue, CheckFlags, SkipFlags);
// 	}
//
// 	return FJsonObjectConverter::JsonValueToUProperty(JsonValue, Property, OutValue, CheckFlags, SkipFlags);
// }
//
// bool FExtendedJsonObjectConverter::UStructToJsonObject(const UStruct* Struct, const void* StructPtr,
//                                                        TSharedRef<FJsonObject> OutJsonObject, int64 CheckFlags,
//                                                        int64 SkipFlags, const CustomExportCallback* ExportCb)
// {
// 	for (TFieldIterator<FProperty> It(Struct); It; ++It)
// 	{
// 		FProperty* Property = *It;
//
// 		if (Property->HasAnyPropertyFlags(SkipFlags))
// 		{
// 			continue;
// 		}
//
// 		const void* Value = Property->ContainerPtrToValuePtr<void>(StructPtr);
//
// 		if (const FOptionalProperty* OptionalProperty = CastField<const FOptionalProperty>(Property))
// 		{
// 			if (!OptionalProperty->IsSet(Value))
// 			{
// 				continue;
// 			}
//
// 			Value = OptionalProperty->GetValuePointerForReadIfSet(Value);
// 		}
//
// 		// Maintain the original functionality by checking if a custom export callback is provided
// 		TSharedPtr<FJsonValue> JsonValue;
// 		if (ExportCb && ExportCb->IsBound())
// 		{
// 			JsonValue = ExportCb->Execute(Property, Value);
// 		}
// 		else
// 		{
// 			JsonValue = UPropertyToJsonValue(Property, Value, CheckFlags, SkipFlags);
// 		}
//
// 		if (JsonValue.IsValid() && !JsonValue->IsNull())
// 		{
// 			OutJsonObject->SetField(Property->GetName(), JsonValue);
// 		}
// 	}
//
// 	return true;
// }
//
// bool FExtendedJsonObjectConverter::JsonAttributesToUStruct(const TMap<FString, TSharedPtr<FJsonValue>>& JsonAttributes,
//                                                            UStruct* StructDefinition, void* OutStruct, int64 CheckFlags,
//                                                            int64 SkipFlags)
// {
// 	for (TFieldIterator<FProperty> It(StructDefinition); It; ++It)
// 	{
// 		FProperty* Property = *It;
//
// 		if (Property->HasAnyPropertyFlags(SkipFlags))
// 		{
// 			continue;
// 		}
//
// 		const TSharedPtr<FJsonValue>* JsonValue = JsonAttributes.Find(Property->GetName());
//
// 		if (!JsonValue)
// 		{
// 			continue;
// 		}
//
// 		if (!JsonValueToUProperty(*JsonValue, Property, Property->ContainerPtrToValuePtr<uint8>(OutStruct), CheckFlags,
// 		                          SkipFlags))
// 		{
// 			return false;
// 		}
// 	}
//
// 	return true;
// }
